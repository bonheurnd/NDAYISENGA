import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getKigaliTodayDate,
  validateQuickLogInput,
  isDuplicateQuickLog,
  getQuickLogStatusLabel,
} from './quicklog.ts';
import type { IrrigationQuickLog } from '../../types/index.ts';

describe('Quick Log Logic & Validation Tests', () => {
  it('formats current date as YYYY-MM-DD for Africa/Kigali', () => {
    const today = getKigaliTodayDate();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('validates a correct quick log submission', () => {
    const valid = validateQuickLogInput({
      blockCode: 'BLOCK-A (Center Pivot 01)',
      reportDate: '2026-10-29',
      irrigationStatus: 'COMPLETED_SUCCESSFULLY',
    });
    assert.equal(valid.isValid, true);
    assert.equal(valid.errorRw, undefined);
  });

  it('fails validation when block code is missing', () => {
    const result = validateQuickLogInput({
      blockCode: '',
      reportDate: '2026-10-29',
      irrigationStatus: 'COMPLETED_SUCCESSFULLY',
    });
    assert.equal(result.isValid, false);
    assert.match(result.errorRw || '', /Hitamo block/);
  });

  it('requires problem description when status is INTERRUPTED or PROBLEM_REPORTED', () => {
    const result = validateQuickLogInput({
      blockCode: 'BLOCK-B',
      reportDate: '2026-10-29',
      irrigationStatus: 'PROBLEM_REPORTED',
      problemDescription: '',
    });
    assert.equal(result.isValid, false);
    assert.match(result.errorRw || '', /Sobanura ikibazo/);

    const resultWithDesc = validateQuickLogInput({
      blockCode: 'BLOCK-B',
      reportDate: '2026-10-29',
      irrigationStatus: 'PROBLEM_REPORTED',
      problemDescription: 'Pump manifold low pressure alert',
    });
    assert.equal(resultWithDesc.isValid, true);
  });

  it('detects duplicate logs for same block on same date', () => {
    const existingLogs: IrrigationQuickLog[] = [
      {
        id: 'qlog-001',
        schemeId: 'scheme-nasho-1',
        blockId: 'plt-001',
        blockCode: 'BLOCK-A (Center Pivot 01)',
        reportedBy: 'Innocent Habimana',
        reporterRole: 'WATER_OPERATOR',
        reportDate: '2026-10-29',
        reportCategory: 'Irrigation Status',
        irrigationStatus: 'COMPLETED_SUCCESSFULLY',
        requiresFollowup: false,
        createdAt: '2026-10-29T10:15:00Z',
        updatedAt: '2026-10-29T10:15:00Z',
      },
    ];

    const duplicate = isDuplicateQuickLog('BLOCK-A (Center Pivot 01)', '2026-10-29', existingLogs);
    assert.equal(duplicate, true);

    const nonDuplicate = isDuplicateQuickLog('BLOCK-B (Center Pivot 02)', '2026-10-29', existingLogs);
    assert.equal(nonDuplicate, false);
  });

  it('returns appropriate status labels in Kinyarwanda and English', () => {
    assert.match(getQuickLogStatusLabel('COMPLETED_SUCCESSFULLY', 'rw'), /Byagenze neza/);
    assert.match(getQuickLogStatusLabel('INTERRUPTED', 'rw'), /Byahagaritswe/);
    assert.match(getQuickLogStatusLabel('PROBLEM_REPORTED', 'en'), /Problem reported/);
  });
});
