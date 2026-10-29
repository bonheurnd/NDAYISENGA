import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMoney,
  subtractMoney,
  calculateTariffAmount,
  calculateInvoiceTotals,
  applyPaymentToInvoice,
  isDuplicatePaymentTransaction,
} from './billing.ts';
import {
  doIntervalsOverlap,
  findScheduleConflicts,
  isValidScheduleStateTransition,
  checkPumpCapacityViolation,
} from './scheduling.ts';
import {
  hasPermission,
  canApproveSchedule,
  canCreateInvoice,
  canRecordPayment,
} from './permissions.ts';
import {
  isPermittedOfflineAction,
  validateOfflineEvent,
} from './sync.ts';
import type { WaterSchedule } from '../../types/index.ts';

test('Billing logic - decimal safe arithmetic for RWF', () => {
  assert.equal(addMoney(10500.5, 450.25), 10950.75);
  assert.equal(subtractMoney(25000, 10500.5), 14499.5);
  assert.equal(calculateTariffAmount('PER_HECTARE_SEASON', 2.5, 45000), 112500);
  assert.equal(calculateTariffAmount('PER_M3_WATER', 120, 150), 18000);
});

test('Billing logic - invoice totals and payment application', () => {
  const lineItems = [
    { id: '1', description: 'Irrigation Tariff 2.5 Ha', quantity: 2.5, unit: 'Ha', unitPriceRwf: 40000, totalRwf: 100000 },
    { id: '2', description: 'Maintenance levy', quantity: 1, unit: 'Season', unitPriceRwf: 5000, totalRwf: 5000 },
  ];
  const { subtotalRwf, totalRwf } = calculateInvoiceTotals(lineItems, 0);
  assert.equal(subtotalRwf, 105000);
  assert.equal(totalRwf, 105000);

  // Partial payment
  const part1 = applyPaymentToInvoice(totalRwf, 0, 50000);
  assert.equal(part1.newAmountPaid, 50000);
  assert.equal(part1.newBalance, 55000);
  assert.equal(part1.newStatus, 'PARTIALLY_PAID');

  // Complete payment
  const part2 = applyPaymentToInvoice(totalRwf, 50000, 55000);
  assert.equal(part2.newAmountPaid, 105000);
  assert.equal(part2.newBalance, 0);
  assert.equal(part2.newStatus, 'PAID');
});

test('Billing logic - idempotency and duplicate transaction prevention', () => {
  const existingKeys = new Set(['IDEM-999-AAA']);
  const existingRefs = new Set(['TX-MOMO-2026-001']);

  assert.equal(isDuplicatePaymentTransaction('IDEM-999-AAA', 'TX-NEW-1', existingKeys, existingRefs), true);
  assert.equal(isDuplicatePaymentTransaction('IDEM-NEW-BBB', 'tx-momo-2026-001', existingKeys, existingRefs), true);
  assert.equal(isDuplicatePaymentTransaction('IDEM-NEW-CCC', 'TX-MOMO-2026-002', existingKeys, existingRefs), false);
});

test('Scheduling logic - interval overlap and plot conflict detection', () => {
  // Overlapping intervals
  assert.equal(
    doIntervalsOverlap('2026-10-15T08:00:00Z', '2026-10-15T12:00:00Z', '2026-10-15T10:00:00Z', '2026-10-15T14:00:00Z'),
    true
  );
  // Non-overlapping intervals
  assert.equal(
    doIntervalsOverlap('2026-10-15T08:00:00Z', '2026-10-15T10:00:00Z', '2026-10-15T10:00:00Z', '2026-10-15T12:00:00Z'),
    false
  );

  const existing: WaterSchedule[] = [
    {
      id: 'sch-1',
      scheduleCode: 'SCH-01',
      plotId: 'plot-A1',
      plotCode: 'BLK-A-P01',
      farmerId: 'f-1',
      farmerName: 'Jean Bosco Mugisha',
      plannedStartTime: '2026-10-15T08:00:00Z',
      plannedEndTime: '2026-10-15T12:00:00Z',
      plannedVolumeM3: 350,
      status: 'APPROVED',
      allocationBasis: 'TIME_HOURS',
    },
  ];

  // Conflicting schedule on same plot
  const conflicts = findScheduleConflicts(
    { plotId: 'plot-A1', plannedStartTime: '2026-10-15T09:00:00Z', plannedEndTime: '2026-10-15T11:00:00Z' },
    existing
  );
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].id, 'sch-1');

  // Different plot -> no conflict
  const noConflicts = findScheduleConflicts(
    { plotId: 'plot-B2', plannedStartTime: '2026-10-15T09:00:00Z', plannedEndTime: '2026-10-15T11:00:00Z' },
    existing
  );
  assert.equal(noConflicts.length, 0);
});

test('Scheduling logic - status state machine transitions', () => {
  assert.equal(isValidScheduleStateTransition('DRAFT', 'SUBMITTED'), true);
  assert.equal(isValidScheduleStateTransition('SUBMITTED', 'APPROVED'), true);
  assert.equal(isValidScheduleStateTransition('APPROVED', 'IN_PROGRESS'), true);
  assert.equal(isValidScheduleStateTransition('IN_PROGRESS', 'COMPLETED'), true);
  assert.equal(isValidScheduleStateTransition('DRAFT', 'COMPLETED'), false);
  assert.equal(isValidScheduleStateTransition('COMPLETED', 'DRAFT'), false);
});

test('Scheduling logic - pump station capacity limits', () => {
  assert.equal(checkPumpCapacityViolation(550, 500), true);
  assert.equal(checkPumpCapacityViolation(450, 500), false);
});

test('Permissions logic - RBAC rules for 8 roles', () => {
  assert.equal(canApproveSchedule('SCHEME_MANAGER'), true);
  assert.equal(canApproveSchedule('SUPER_ADMIN'), true);
  assert.equal(canApproveSchedule('FARMER'), false);
  assert.equal(canApproveSchedule('WATER_OPERATOR'), false);

  assert.equal(canCreateInvoice('FINANCE_OFFICER'), true);
  assert.equal(canCreateInvoice('FARMER'), false);

  assert.equal(canRecordPayment('FINANCE_OFFICER'), true);
  assert.equal(canRecordPayment('AUDITOR'), false);

  assert.equal(hasPermission('AUDITOR', 'VIEW_AUDIT_LOGS'), true);
  assert.equal(hasPermission('AUDITOR', 'CREATE_INVOICE'), false);
  assert.equal(hasPermission('FARMER', 'FARMER_PORTAL_ONLY'), true);
});

test('Sync logic - offline queue prevents financial mutations', () => {
  assert.equal(isPermittedOfflineAction('SUBMIT_COMPLAINT'), true);
  assert.equal(isPermittedOfflineAction('REPORT_INTERRUPTION'), true);
  assert.equal(isPermittedOfflineAction('APPROVE_INVOICE'), false);
  assert.equal(isPermittedOfflineAction('FINALIZE_PAYMENT'), false);
  assert.equal(isPermittedOfflineAction('APPROVE_SCHEDULE'), false);

  // Validate complaint event
  const validEvent = validateOfflineEvent({
    eventType: 'SUBMIT_COMPLAINT',
    payload: { category: 'WATER_SHORTAGE', description: 'Low pressure at Pivot 3' },
  });
  assert.equal(validEvent.valid, true);

  // Reject illicit financial offline event
  const invalidEvent = validateOfflineEvent({
    eventType: 'APPROVE_INVOICE' as any,
    payload: { invoiceId: 'inv-123' },
  });
  assert.equal(invalidEvent.valid, false);
});
