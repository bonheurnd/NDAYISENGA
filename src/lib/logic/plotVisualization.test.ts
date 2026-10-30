import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidGpsCoordinate,
  formatGpsCoordinate,
  generateGoogleMapsUrl,
  getPlotScheduleStatus,
} from './plotVisualization.ts';
import type { Plot, WaterSchedule } from '../../types/index.ts';

describe('Plot Visualization & Schedule Status Logic', () => {
  const samplePlot: Plot = {
    id: 'plt-001',
    plotCode: 'BLK-A-P01',
    blockCode: 'BLOCK-A (Center Pivot 01)',
    schemeName: 'GFI Nasho 1',
    areaHectares: 1.2,
    irrigationType: 'CENTER_PIVOT',
    currentCrop: 'Hybrid Maize',
    status: 'ACTIVE',
    currentFarmerId: 'fmr-001',
    latitude: -2.0624,
    longitude: 30.7381,
  };

  it('validates GPS coordinates within valid latitude/longitude ranges', () => {
    assert.strictEqual(isValidGpsCoordinate(-2.0624, 30.7381), true);
    assert.strictEqual(isValidGpsCoordinate(95, 30.7381), false);
    assert.strictEqual(isValidGpsCoordinate(-2.0624, 195), false);
    assert.strictEqual(isValidGpsCoordinate(undefined, 30.7381), false);
    assert.strictEqual(isValidGpsCoordinate(-2.0624, NaN), false);
  });

  it('formats GPS coordinates to 6 decimal places', () => {
    assert.strictEqual(formatGpsCoordinate(-2.0624), '-2.062400');
    assert.strictEqual(formatGpsCoordinate(30.7381), '+30.738100');
  });

  it('generates valid Google Maps URL with lat/lng query parameters', () => {
    const url = generateGoogleMapsUrl(-2.0624, 30.7381);
    assert.strictEqual(url, 'https://www.google.com/maps?q=-2.0624,30.7381');
  });

  it('returns NO_SCHEDULE when plot has no schedules recorded', () => {
    const statusInfo = getPlotScheduleStatus(samplePlot, []);
    assert.strictEqual(statusInfo.code, 'NO_SCHEDULE');
    assert.strictEqual(statusInfo.labelRw, 'Nta gahunda yo kuhira');
  });

  it('returns IN_PROGRESS (Blue) when schedule time matches current time', () => {
    const now = Date.now();
    const activeSchedule: WaterSchedule = {
      id: 'sch-101',
      scheduleCode: 'SCH-2026-0001',
      plotId: 'plt-001',
      plotCode: 'BLK-A-P01',
      farmerId: 'fmr-001',
      farmerName: 'Jean Bosco Mugisha',
      plannedStartTime: new Date(now - 1800000).toISOString(), // 30 min ago
      plannedEndTime: new Date(now + 1800000).toISOString(),   // 30 min future
      plannedVolumeM3: 350,
      status: 'APPROVED',
      allocationBasis: 'TIME_HOURS',
    };

    const statusInfo = getPlotScheduleStatus(samplePlot, [activeSchedule], now);
    assert.strictEqual(statusInfo.code, 'IN_PROGRESS');
    assert.strictEqual(statusInfo.labelRw, 'Kuhira birakomeje');
  });

  it('returns UPCOMING (Amber) when valid schedule exists in the future', () => {
    const now = Date.now();
    const futureSchedule: WaterSchedule = {
      id: 'sch-102',
      scheduleCode: 'SCH-2026-0002',
      plotId: 'plt-001',
      plotCode: 'BLK-A-P01',
      farmerId: 'fmr-001',
      farmerName: 'Jean Bosco Mugisha',
      plannedStartTime: new Date(now + 7200000).toISOString(), // 2 hours future
      plannedEndTime: new Date(now + 10800000).toISOString(), // 3 hours future
      plannedVolumeM3: 350,
      status: 'APPROVED',
      allocationBasis: 'TIME_HOURS',
    };

    const statusInfo = getPlotScheduleStatus(samplePlot, [futureSchedule], now);
    assert.strictEqual(statusInfo.code, 'UPCOMING font-bold');
    assert.strictEqual(statusInfo.labelRw, 'Gahunda irategerejwe');
  });

  it('returns INTERRUPTED (Red) when schedule is cancelled or interrupted', () => {
    const cancelledSchedule: WaterSchedule = {
      id: 'sch-103',
      scheduleCode: 'SCH-2026-0003',
      plotId: 'plt-001',
      plotCode: 'BLK-A-P01',
      farmerId: 'fmr-001',
      farmerName: 'Jean Bosco Mugisha',
      plannedStartTime: new Date().toISOString(),
      plannedEndTime: new Date().toISOString(),
      plannedVolumeM3: 350,
      status: 'INTERRUPTED',
      allocationBasis: 'TIME_HOURS',
    };

    const statusInfo = getPlotScheduleStatus(samplePlot, [cancelledSchedule]);
    assert.strictEqual(statusInfo.code, 'INTERRUPTED');
    assert.strictEqual(statusInfo.labelRw, 'Gahunda yahagaritswe');
  });
});
