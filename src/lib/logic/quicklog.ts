import type { QuickLogStatus, IrrigationQuickLog, Language } from '../../types/index.ts';

/**
 * Returns today's date formatted as YYYY-MM-DD in Africa/Kigali timezone.
 */
export function getKigaliTodayDate(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Kigali',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch (err) {
    // Fallback if Africa/Kigali timezone isn't available in node/browser env
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

export interface QuickLogValidationInput {
  blockCode: string;
  reportDate: string;
  irrigationStatus: QuickLogStatus;
  problemDescription?: string;
}

/**
 * Validates Quick Log form inputs.
 * Enforces conditional requirement for problemDescription when status is INTERRUPTED or PROBLEM_REPORTED.
 */
export function validateQuickLogInput(input: QuickLogValidationInput): {
  isValid: boolean;
  errorRw?: string;
  errorEn?: string;
} {
  if (!input.blockCode || !input.blockCode.trim()) {
    return {
      isValid: false,
      errorRw: 'Reba amakuru utaruzuza neza: Hitamo block yo kuhira.',
      errorEn: 'Please review incomplete fields: Select an irrigation block.',
    };
  }

  if (!input.reportDate || !input.reportDate.trim()) {
    return {
      isValid: false,
      errorRw: 'Reba amakuru utaruzuza neza: Itariki irakenewe.',
      errorEn: 'Please review incomplete fields: Date is required.',
    };
  }

  if (
    (input.irrigationStatus === 'INTERRUPTED' || input.irrigationStatus === 'PROBLEM_REPORTED') &&
    (!input.problemDescription || !input.problemDescription.trim())
  ) {
    return {
      isValid: false,
      errorRw: 'Reba amakuru utaruzuza neza: Sobanura ikibazo cyabaye.',
      errorEn: 'Please review incomplete fields: Please describe the problem.',
    };
  }

  return { isValid: true };
}

/**
 * Checks if a report for the same block code on the same date already exists.
 */
export function isDuplicateQuickLog(
  blockCode: string,
  reportDate: string,
  existingLogs: IrrigationQuickLog[]
): boolean {
  return existingLogs.some(
    (log) =>
      log.blockCode.trim().toLowerCase() === blockCode.trim().toLowerCase() &&
      log.reportDate === reportDate
  );
}

/**
 * Helper to get human-readable status labels in Kinyarwanda or English.
 */
export function getQuickLogStatusLabel(status: QuickLogStatus, lang: Language = 'rw'): string {
  switch (status) {
    case 'COMPLETED_SUCCESSFULLY':
      return lang === 'rw' ? 'Byagenze neza — Completed successfully' : 'Completed successfully';
    case 'IN_PROGRESS':
      return lang === 'rw' ? 'Birakomeje — In progress' : 'In progress';
    case 'NOT_STARTED':
      return lang === 'rw' ? 'Ntibiratangira — Not started' : 'Not started';
    case 'INTERRUPTED':
      return lang === 'rw' ? 'Byahagaritswe — Interrupted' : 'Interrupted';
    case 'PROBLEM_REPORTED':
      return lang === 'rw' ? 'Habaye ikibazo — Problem reported' : 'Problem reported';
    default:
      return status;
  }
}
