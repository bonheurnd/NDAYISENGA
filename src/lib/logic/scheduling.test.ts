import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateScheduleRequest,
  transitionScheduleStatus,
  calculateDeliveryMetrics,
  generateFarmerNotification,
  DEFAULT_SCHEME_RULES,
  type WaterScheduleItem,
} from './scheduling.ts';

const mockNow = new Date('2026-10-18T06:00:00Z').getTime();

const sampleSchedules: WaterScheduleItem[] = [
  {
    id: 'SCH-1',
    scheduleCode: 'SCH-2026A-001',
    seasonId: 'SEASON-2026A',
    blockCode: 'CP-01',
    plotId: 'P-101',
    plotCode: 'PLOT-101',
    farmerId: 'F-10',
    farmerName: 'Jean Damascene',
    farmerPhone: '+250788111222',
    plannedStartTime: '2026-10-18T20:00:00Z', // 14 hours in advance from 06:00
    plannedEndTime: '2026-10-19T00:00:00Z',
    plannedVolumeM3: 400, // 4 hours @ 100 m3/h
    allocationBasis: 'TIME_HOURS',
    flowRateM3h: 100,
    status: 'APPROVED',
    createdBy: 'farmer@nasho.rw',
    createdAt: '2026-10-18T05:00:00Z',
  },
];

describe('Water Scheduling Logic & Conflict Validation', () => {
  it('validates a correct schedule with sufficient advance notice and no overlaps', () => {
    const newSchedule: Partial<WaterScheduleItem> = {
      plotId: 'P-102',
      blockCode: 'CP-01',
      plannedStartTime: '2026-10-19T08:00:00Z',
      plannedEndTime: '2026-10-19T12:00:00Z',
      plannedVolumeM3: 400,
    };

    const result = validateScheduleRequest(newSchedule, sampleSchedules, DEFAULT_SCHEME_RULES, mockNow);
    assert.equal(result.isValid, true);
    assert.equal(result.conflicts.length, 0);
  });

  it('detects advance notice violation if requested under 12 hours ahead', () => {
    const tooSoonSchedule: Partial<WaterScheduleItem> = {
      plotId: 'P-103',
      blockCode: 'CP-02',
      plannedStartTime: '2026-10-18T09:00:00Z', // only 3 hours ahead of mockNow (06:00)
      plannedEndTime: '2026-10-18T13:00:00Z',
      plannedVolumeM3: 350,
    };

    const result = validateScheduleRequest(tooSoonSchedule, sampleSchedules, DEFAULT_SCHEME_RULES, mockNow);
    assert.equal(result.isValid, false);
    assert.equal(result.conflicts[0].type, 'ADVANCE_NOTICE_VIOLATION');
  });

  it('detects direct plot time overlaps', () => {
    const overlappingSchedule: Partial<WaterScheduleItem> = {
      plotId: 'P-101', // Same plot as SCH-1
      blockCode: 'CP-01',
      plannedStartTime: '2026-10-18T22:00:00Z', // Overlaps 20:00 - 00:00
      plannedEndTime: '2026-10-19T02:00:00Z',
      plannedVolumeM3: 400,
    };

    const result = validateScheduleRequest(overlappingSchedule, sampleSchedules, DEFAULT_SCHEME_RULES, mockNow);
    assert.equal(result.isValid, false);
    assert.equal(result.conflicts[0].type, 'TIME_OVERLAP');
    assert.deepEqual(result.conflicts[0].conflictingScheduleCodes, ['SCH-2026A-001']);
  });

  it('detects pivot capacity limit breach when simultaneous flow rates exceed 450 m3/h', () => {
    const highFlowSchedules: WaterScheduleItem[] = [
      {
        ...sampleSchedules[0],
        plannedVolumeM3: 1600, // 400 m3/h
        flowRateM3h: 400,
      },
    ];

    const extraSchedule: Partial<WaterScheduleItem> = {
      plotId: 'P-104',
      blockCode: 'CP-01', // Same pivot block CP-01
      plannedStartTime: '2026-10-18T21:00:00Z', // Overlaps SCH-1
      plannedEndTime: '2026-10-18T23:00:00Z',
      plannedVolumeM3: 200, // 100 m3/h => total = 500 m3/h > 450 max
    };

    const result = validateScheduleRequest(extraSchedule, highFlowSchedules, DEFAULT_SCHEME_RULES, mockNow);
    assert.equal(result.isValid, false);
    assert.equal(result.conflicts[0].type, 'PIVOT_CAPACITY_EXCEEDED');
  });
});

describe('Status Transitions & Permissions', () => {
  it('allows SCHEME_MANAGER to approve a SUBMITTED schedule', () => {
    const submitted: WaterScheduleItem = {
      ...sampleSchedules[0],
      status: 'SUBMITTED',
    };

    const transition = transitionScheduleStatus(
      submitted,
      'APPROVED',
      'SCHEME_MANAGER',
      'manager@nasho.rw'
    );

    assert.equal(transition.updatedSchedule.status, 'APPROVED');
    assert.equal(transition.updatedSchedule.approvedBy, 'manager@nasho.rw');
    assert.equal(transition.historyEntry.previousStatus, 'SUBMITTED');
    assert.equal(transition.historyEntry.newStatus, 'APPROVED');
  });

  it('rejects approval when attempted by FARMER_MEMBER role', () => {
    const submitted: WaterScheduleItem = {
      ...sampleSchedules[0],
      status: 'SUBMITTED',
    };

    assert.throws(() => {
      transitionScheduleStatus(submitted, 'APPROVED', 'FARMER_MEMBER', 'farmer@nasho.rw');
    }, /Only Scheme Management/);
  });

  it('rejects invalid state transition (COMPLETED -> SUBMITTED)', () => {
    const completed: WaterScheduleItem = {
      ...sampleSchedules[0],
      status: 'COMPLETED',
    };

    assert.throws(() => {
      transitionScheduleStatus(completed, 'SUBMITTED', 'SCHEME_MANAGER', 'manager@nasho.rw');
    }, /Invalid status transition/);
  });
});

describe('Delivery Metrics & Notifications', () => {
  it('calculates volume variance and average flow rate correctly', () => {
    const metrics = calculateDeliveryMetrics(
      400,
      420,
      '2026-10-18T08:00:00Z',
      '2026-10-18T12:00:00Z',
      '2026-10-18T12:00:00Z'
    );

    assert.equal(metrics.plannedDurationHrs, 4);
    assert.equal(metrics.actualDurationHrs, 4);
    assert.equal(metrics.volumeVarianceM3, 20);
    assert.equal(metrics.volumeVariancePercent, 5);
    assert.equal(metrics.averageFlowRateM3h, 105);
  });

  it('generates bilingual notification with Kinyarwanda and English text', () => {
    const notification = generateFarmerNotification(sampleSchedules[0], 'APPROVED');
    assert.equal(notification.farmerId, 'F-10');
    assert.equal(notification.status, 'SENT');
    assert.match(notification.message, /CYEMEWE/);
    assert.match(notification.message, /APPROVED/);
  });
});
