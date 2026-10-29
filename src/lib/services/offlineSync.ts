/**
 * Client-side Offline Storage and Non-Financial Sync Queue
 * Stores submissions in localStorage when offline, synchronizing when network reconnects.
 */

import { OfflineSyncEvent } from '../../types/index.ts';
import { validateOfflineEvent } from '../logic/sync.ts';
import { api } from './api.ts';

const OFFLINE_QUEUE_KEY = 'nasho_offline_sync_queue';

export function getOfflineQueue(): OfflineSyncEvent[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineSyncEvent[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save offline queue', err);
  }
}

export function enqueueOfflineEvent(
  eventType: OfflineSyncEvent['eventType'],
  payload: Record<string, unknown>
): { success: boolean; event?: OfflineSyncEvent; error?: string } {
  const event: OfflineSyncEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventType,
    payload,
    queuedAt: new Date().toISOString(),
    status: 'QUEUED',
  };

  const validation = validateOfflineEvent(event);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const queue = getOfflineQueue();
  queue.push(event);
  saveOfflineQueue(queue);

  return { success: true, event };
}

export async function flushOfflineQueue(): Promise<{
  syncedCount: number;
  failedCount: number;
  remainingQueue: OfflineSyncEvent[];
}> {
  const queue = getOfflineQueue();
  const queuedItems = queue.filter((item) => item.status === 'QUEUED');

  if (queuedItems.length === 0) {
    return { syncedCount: 0, failedCount: 0, remainingQueue: queue };
  }

  try {
    const res = await api.syncEvents(queuedItems);
    let syncedCount = 0;
    let failedCount = 0;

    const updatedQueue = queue.map((item) => {
      const match = res.results.find((r: any) => r.id === item.id);
      if (match) {
        if (match.status === 'SYNCED') {
          syncedCount++;
          return { ...item, status: 'SYNCED' as const };
        } else {
          failedCount++;
          return { ...item, status: 'FAILED' as const, errorMessage: match.error };
        }
      }
      return item;
    });

    saveOfflineQueue(updatedQueue);
    return { syncedCount, failedCount, remainingQueue: updatedQueue };
  } catch (err: any) {
    console.error('Error flushing sync queue:', err);
    return { syncedCount: 0, failedCount: queuedItems.length, remainingQueue: queue };
  }
}
