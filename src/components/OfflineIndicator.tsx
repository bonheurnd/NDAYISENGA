import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../lib/hooks/useOnlineStatus.ts';
import { getOfflineQueue, flushOfflineQueue } from '../lib/services/offlineSync.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedRecently, setSyncedRecently] = useState(false);

  useEffect(() => {
    const checkQueue = () => {
      const q = getOfflineQueue();
      setQueuedCount(q.filter((i) => i.status === 'QUEUED').length);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    const res = await flushOfflineQueue();
    setIsSyncing(false);
    if (res.syncedCount > 0) {
      setSyncedRecently(true);
      setTimeout(() => setSyncedRecently(false), 4000);
    }
  };

  if (isOnline && queuedCount === 0 && !syncedRecently) {
    return null;
  }

  if (!isOnline) {
    return (
      <aside
        aria-label="Offline Mode Notification"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
      >
        <WifiOff className="w-4 h-4 text-amber-100" />
        <span>Offline Mode — Cached data active</span>
        {queuedCount > 0 && (
          <span className="ml-1 bg-amber-800/80 px-2 py-0.5 rounded text-[11px] font-semibold">
            {queuedCount} queued
          </span>
        )}
      </aside>
    );
  }

  if (syncedRecently) {
    return (
      <aside
        aria-label="Sync Success Notification"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-100" />
        <span>Offline changes synchronized successfully</span>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Pending Sync Notification"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white px-3.5 py-2 text-xs font-medium shadow-lg border border-slate-700"
    >
      <span>{queuedCount} non-financial actions waiting to sync</span>
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className="ml-2 flex items-center gap-1 bg-sky-600 hover:bg-sky-500 px-2 py-1 rounded text-[11px] font-semibold"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>Sync Now</span>
      </button>
    </aside>
  );
};
