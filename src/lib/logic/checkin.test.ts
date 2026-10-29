import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  parseAndValidateQrPayload,
  generateBlockQrPayload,
  processFarmerCheckinVerification,
  OFFICIAL_NASHO_QR_SECRET_PREFIX,
} from './checkin.ts';
import type { Farmer, Plot, WaterSchedule, FarmerCheckin } from '../../types/index.ts';

const MOCK_FARMER: Farmer = {
  id: 'fmr-001',
  farmerCode: 'NSH-FMR-0101',
  fullName: 'Jean Bosco Mugisha',
  phone: '+250788543210',
  cooperativeName: "Umuryango w'Abakoresha Amazi Nasho (WUO)",
  membershipStatus: 'ACTIVE',
  registrationDate: '2023-01-15',
  totalHectares: 2.4,
  assignedPlotIds: ['plt-001', 'plt-002'],
};

const MOCK_PLOT: Plot = {
  id: 'plt-001',
  plotCode: 'BLK-A-P01',
  blockCode: 'BLOCK-A (Center Pivot 01)',
  schemeName: 'GFI Nasho 1',
  areaHectares: 1.2,
  irrigationType: 'CENTER_PIVOT',
  currentCrop: 'Hybrid Maize',
  status: 'ACTIVE',
  currentFarmerId: 'fmr-001',
  currentFarmerName: 'Jean Bosco Mugisha',
};

const MOCK_SCHEDULE: WaterSchedule = {
  id: 'sch-001',
  scheduleCode: 'SCH-2026-0401',
  plotId: 'plt-001',
  plotCode: 'BLK-A-P01',
  farmerId: 'fmr-001',
  farmerName: 'Jean Bosco Mugisha',
  plannedStartTime: '2026-10-28T08:00:00Z',
  plannedEndTime: '2026-10-28T12:00:00Z',
  plannedVolumeM3: 420,
  status: 'APPROVED',
  allocationBasis: 'TIME_HOURS',
};

describe('QR Code Parsing & Signature Validation', () => {
  test('parses valid official GFI Nasho 1 QR JSON payload', () => {
    const validJson = JSON.stringify({
      schema: 'GFI_NASHO_1_SITE_QR',
      scheme: 'GFI_N1',
      blockCode: 'BLOCK-A',
      plotCode: 'BLK-A-P01',
      blockId: 'plt-001',
      qrCodeId: 'QR-NASHO-BLK-A-P01-V1',
      signatureToken: `${OFFICIAL_NASHO_QR_SECRET_PREFIX}BLK-A-P01-SECURE-KEY`,
      issuedAt: 1730000000,
    });

    const result = parseAndValidateQrPayload(validJson);
    assert.strictEqual(result.isValid, true);
    assert.ok(result.payload);
    assert.strictEqual(result.payload?.plotCode, 'BLK-A-P01');
  });

  test('rejects QR code with invalid schema or missing signature', () => {
    const invalidSchema = JSON.stringify({
      schema: 'OTHER_APP_QR',
      scheme: 'GFI_N1',
      plotCode: 'BLK-A-P01',
      signatureToken: 'HASH-NSH1-TEST',
    });

    const res1 = parseAndValidateQrPayload(invalidSchema);
    assert.strictEqual(res1.isValid, false);
    assert.match(res1.errorReason || '', /Invalid QR code schema/);

    const missingSig = JSON.stringify({
      schema: 'GFI_NASHO_1_SITE_QR',
      scheme: 'GFI_N1',
      plotCode: 'BLK-A-P01',
      blockCode: 'BLOCK-A',
      signatureToken: 'BAD-SIG-KEY',
    });

    const res2 = parseAndValidateQrPayload(missingSig);
    assert.strictEqual(res2.isValid, false);
    assert.match(res2.errorReason || '', /signature verification failed/i);
  });
});

describe('Farmer Check-in Verification Logic', () => {
  test('verifies valid arrival check-in for assigned farmer with active plot', () => {
    const qrData = generateBlockQrPayload(MOCK_PLOT);
    const result = processFarmerCheckinVerification({
      farmer: MOCK_FARMER,
      rawQrData: qrData,
      plots: [MOCK_PLOT],
      schedules: [MOCK_SCHEDULE],
      existingCheckins: [],
      nowMs: Date.now(),
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'VERIFIED');
    assert.ok(result.checkin);
    assert.strictEqual(result.checkin?.farmerId, 'fmr-001');
    assert.strictEqual(result.checkin?.plotCode, 'BLK-A-P01');
  });

  test('rejects check-in if farmer is not assigned to plot and has no schedule', () => {
    const unassignedFarmer: Farmer = {
      ...MOCK_FARMER,
      id: 'fmr-999',
      fullName: 'Unassigned Farmer',
      assignedPlotIds: [],
    };

    const qrData = generateBlockQrPayload(MOCK_PLOT);
    const result = processFarmerCheckinVerification({
      farmer: unassignedFarmer,
      rawQrData: qrData,
      plots: [MOCK_PLOT],
      schedules: [],
      existingCheckins: [],
      nowMs: Date.now(),
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 'REJECTED');
    assert.match(result.reason, /Access Denied/i);
  });

  test('prevents duplicate check-in within 2 hours window', () => {
    const now = Date.now();
    const existingCheckin: FarmerCheckin = {
      id: 'chk-existing-1',
      farmerId: MOCK_FARMER.id,
      farmerName: MOCK_FARMER.fullName,
      farmerCode: MOCK_FARMER.farmerCode,
      blockId: MOCK_PLOT.id,
      blockCode: MOCK_PLOT.blockCode,
      plotCode: MOCK_PLOT.plotCode,
      qrCodeId: 'QR-BLK-A-P01',
      checkinTime: new Date(now - 15 * 60 * 1000).toISOString(), // 15 mins ago
      verificationStatus: 'VERIFIED',
      createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 15 * 60 * 1000).toISOString(),
    };

    const qrData = generateBlockQrPayload(MOCK_PLOT);
    const result = processFarmerCheckinVerification({
      farmer: MOCK_FARMER,
      rawQrData: qrData,
      plots: [MOCK_PLOT],
      schedules: [MOCK_SCHEDULE],
      existingCheckins: [existingCheckin],
      nowMs: now,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 'REJECTED');
    assert.match(result.reason, /Duplicate check-in/i);
  });
});
