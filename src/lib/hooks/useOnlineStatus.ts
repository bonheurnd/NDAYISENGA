import { useEffect, useState } from 'react';
import { flushOfflineQueue } from '../services/offlineSync.ts';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-flush pending sync queue on reconnect
      flushOfflineQueue().then((res) => {
        if (res.syncedCount > 0) {
          console.log(`[PWA Offline Sync] Successfully synced ${res.syncedCount} offline events.`);
        }
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
