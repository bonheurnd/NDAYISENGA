import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateFarmerInput, checkDuplicateFarmer, syncPlotAssignments } from './farmer.ts';
import type { Farmer, Plot } from '../../types/index.ts';

describe('Farmer Registration & Edit Validation Logic', () => {
  const mockFarmers: Farmer[] = [
    {
      id: 'fmr-001',
      farmerCode: 'NSH-FMR-0101',
      fullName: 'Jean Bosco Mugisha',
      phone: '+250788123456',
      nationalId: '1199880012345678',
      cooperativeName: "Umuryango w'Abakoresha Amazi Nasho (WUO)",
      membershipStatus: 'ACTIVE',
      registrationDate: '2026-01-15',
      totalHectares: 2.0,
      assignedPlotIds: ['plt-001'],
    },
    {
      id: 'fmr-002',
      farmerCode: 'NSH-FMR-0102',
      fullName: 'Claudine Uwera',
      phone: '+250785998877',
      nationalId: '1199580098765432',
      cooperativeName: "Umuryango w'Abakoresha Amazi Cyambwe (WUO)",
      membershipStatus: 'ACTIVE',
      registrationDate: '2026-02-10',
      totalHectares: 1.5,
      assignedPlotIds: ['plt-002'],
    },
  ];

  const mockPlots: Plot[] = [
    {
      id: 'plt-001',
      plotCode: 'BLK-A-P01',
      blockCode: 'BLOCK-A (Pivot CP-01)',
      schemeName: 'GFI Nasho 1',
      areaHectares: 2.0,
      irrigationType: 'CENTER_PIVOT',
      status: 'ACTIVE',
      currentFarmerId: 'fmr-001',
      currentFarmerName: 'Jean Bosco Mugisha',
    },
    {
      id: 'plt-002',
      plotCode: 'BLK-A-P02',
      blockCode: 'BLOCK-A (Pivot CP-01)',
      schemeName: 'GFI Nasho 1',
      areaHectares: 1.5,
      irrigationType: 'CENTER_PIVOT',
      status: 'ACTIVE',
      currentFarmerId: 'fmr-002',
      currentFarmerName: 'Claudine Uwera',
    },
    {
      id: 'plt-003',
      plotCode: 'BLK-B-P01',
      blockCode: 'BLOCK-B (Pivot CP-02)',
      schemeName: 'GFI Nasho 1',
      areaHectares: 1.8,
      irrigationType: 'CENTER_PIVOT',
      status: 'ACTIVE',
    },
  ];

  it('validates a correct farmer registration payload', () => {
    const res = validateFarmerInput({
      fullName: 'Erick Ndayishimiye',
      phone: '+250789001122',
      nationalId: '1199080011223344',
    });
    assert.strictEqual(res.isValid, true);
  });

  it('fails validation when full name is missing', () => {
    const res = validateFarmerInput({
      fullName: '  ',
      phone: '+250789001122',
    });
    assert.strictEqual(res.isValid, false);
    assert.match(res.errorEn!, /full name is required/i);
  });

  it('fails validation when National ID is not 16 digits', () => {
    const res = validateFarmerInput({
      fullName: 'Erick Ndayishimiye',
      phone: '+250789001122',
      nationalId: '12345',
    });
    assert.strictEqual(res.isValid, false);
    assert.match(res.errorEn!, /16 digits/i);
  });

  it('detects duplicate phone number', () => {
    const res = checkDuplicateFarmer(
      { phone: '+250788123456' },
      mockFarmers
    );
    assert.strictEqual(res.isValid, false);
    assert.match(res.errorEn!, /already registered to Jean Bosco Mugisha/i);
  });

  it('allows same farmer to keep their own phone number during edit', () => {
    const res = checkDuplicateFarmer(
      { phone: '+250788123456', currentFarmerId: 'fmr-001' },
      mockFarmers
    );
    assert.strictEqual(res.isValid, true);
  });

  it('detects duplicate National ID', () => {
    const res = checkDuplicateFarmer(
      { phone: '+250780000000', nationalId: '1199580098765432' },
      mockFarmers
    );
    assert.strictEqual(res.isValid, false);
    assert.match(res.errorEn!, /National ID 1199580098765432 is already registered/i);
  });

  it('correctly synchronizes plot assignments to plots list', () => {
    // Re-assign fmr-001 from plt-001 to plt-003
    const updatedPlots = syncPlotAssignments('fmr-001', 'Jean Bosco Mugisha', ['plt-003'], mockPlots);

    const oldPlot = updatedPlots.find((p) => p.id === 'plt-001');
    assert.strictEqual(oldPlot?.currentFarmerId, undefined);
    assert.strictEqual(oldPlot?.currentFarmerName, undefined);

    const newPlot = updatedPlots.find((p) => p.id === 'plt-003');
    assert.strictEqual(newPlot?.currentFarmerId, 'fmr-001');
    assert.strictEqual(newPlot?.currentFarmerName, 'Jean Bosco Mugisha');
  });
});
