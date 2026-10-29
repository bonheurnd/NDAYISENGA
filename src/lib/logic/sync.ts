/**
 * Offline Sync rules & safe non-financial mutation guard.
 *
 * CRITICAL RULE: Never approve invoices, finalize payments, or approve
 * water schedules while offline. Only non-financial submissions (complaints,
 * water interruption reports, notes) are permitted in the offline queue.
 */

import type { OfflineSyncEvent } from '../../types/index.ts';

const PERMITTED_OFFLINE_EVENT_TYPES = [
  'SUBMIT_COMPLAINT',
  'REPORT_INTERRUPTION',
  'UPDATE_PROFILE_NOTE',
] as const;

export function isPermittedOfflineAction(eventType: string): boolean {
  return PERMITTED_OFFLINE_EVENT_TYPES.includes(eventType as typeof PERMITTED_OFFLINE_EVENT_TYPES[number]);
}

export function validateOfflineEvent(event: Partial<OfflineSyncEvent>): {
  valid: boolean;
  error?: string;
} {
  if (!event.eventType) {
    return { valid: false, error: 'Missing eventType.' };
  }

  if (!isPermittedOfflineAction(event.eventType)) {
    return {
      valid: false,
      error: `Action "${event.eventType}" cannot be queued offline. Financial approvals, payments, and schedule authorizations require verified real-time connectivity.`,
    };
  }

  if (!event.payload || typeof event.payload !== 'object' || Object.keys(event.payload).length === 0) {
    return { valid: false, error: 'Payload cannot be empty.' };
  }

  return { valid: true };
}
