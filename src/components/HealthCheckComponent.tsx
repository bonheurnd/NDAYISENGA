import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  evaluateHealthResponse,
  shouldDisplayHealthAlert,
  getNextPollInterval,
  formatLastCheckedTime,
  type HealthStatus,
  type HealthApiResponse,
} from '../lib/logic/health.ts';

interface HealthCheckProps {
  language?: 'en' | 'rw';
  pollIntervalMs?: number;
}

export const HealthCheckComponent: React.FC<HealthCheckProps> = ({
  language = 'en',
  pollIntervalMs = 30000,
}) => {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<HealthApiResponse | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Time tracker for relative time display
  const [, setTick] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    }
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/v1/health', {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data: HealthApiResponse = await res.json();
        const evaluation = evaluateHealthResponse(true, data, latency);

        setStatus(evaluation.status);
        setErrorMessage(evaluation.errorMessage);
        setServerInfo(data);
        setLatencyMs(latency);
        setConsecutiveFailures(0);
      } else {
        const evaluation = evaluateHealthResponse(false, null, latency);
        setStatus('offline');
        setErrorMessage(evaluation.errorMessage || `HTTP error ${res.status}`);
        setConsecutiveFailures((prev) => prev + 1);
      }
    } catch (err: any) {
      const evaluation = evaluateHealthResponse(false, null, 0);
      setStatus('offline');
      setErrorMessage(
        err?.name === 'AbortError'
          ? (language === 'rw' ? 'Igihe cyo gutegereza cyarangiye (Timeout)' : 'API request timed out (6s)')
          : (err?.message || (language === 'rw' ? 'Ntabwo bishobora guhuzwa na seriveri' : 'Failed to reach API server'))
      );
      setConsecutiveFailures((prev) => prev + 1);
    } finally {
      setLastChecked(new Date());
      setIsRetrying(false);
    }
  }, [language]);

  // Main polling effect - 30 seconds default
  useEffect(() => {
    // Initial check on mount
    checkHealth();

    // Schedule next poll dynamically based on health status
    const scheduleNext = () => {
      const interval = getNextPollInterval(status, pollIntervalMs);
      intervalRef.current = setTimeout(() => {
        checkHealth().then(() => scheduleNext());
      }, interval);
    };

    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [checkHealth, pollIntervalMs, status]);

  // Update relative time readout every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const isAlertActive = shouldDisplayHealthAlert(status, consecutiveFailures);

  // Translations
  const t = {
    online: language === 'rw' ? 'API Ihujwe' : 'API Online',
    offline: language === 'rw' ? 'Isano Ryahagaze' : 'API Connection Lost',
    degraded: language === 'rw' ? 'API Itinda' : 'API Degraded',
    checking: language === 'rw' ? 'Gusuzuma...' : 'Checking API...',
    retryButton: language === 'rw' ? 'Ongera Ugerageze' : 'Retry Connection',
    retrying: language === 'rw' ? 'Kugerageza...' : 'Retrying...',
    offlineDesc:
      language === 'rw'
        ? 'Ntabwo seriveri ya GFI Nasho 1 iri kuboneka. Porogaramu ikoresha amakuru abitswe.'
        : 'Cannot reach GFI Nasho 1 API server. Application is serving cached records.',
    lastCheckedPrefix: language === 'rw' ? 'Iheruka gusuzumwa:' : 'Last checked:',
    latencyLabel: language === 'rw' ? 'Umuvuduko:' : 'Latency:',
    serverStatus: language === 'rw' ? 'Imimerere ya seriveri:' : 'Server Status:',
    detailsTitle: language === 'rw' ? 'Ibisobanuro bya Seriveri' : 'Backend Diagnostics',
  };

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed top-3 right-4 z-50 flex flex-col items-end pointer-events-none"
    >
      <div className="pointer-events-auto flex flex-col items-end">
        {/* If healthy: show subtle, elegant status indicator badge */}
        {!isAlertActive && (
          <div className="relative">
            <button
              onClick={() => setShowDetails(!showDetails)}
              aria-label="Toggle backend health details"
              className="group flex items-center gap-1.5 rounded-full bg-slate-900/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/30 shadow-sm hover:bg-slate-900 transition-all cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline text-slate-300">{t.online}</span>
              {latencyMs !== null && (
                <span className="text-[10px] text-emerald-400/90 font-mono">
                  {latencyMs}ms
                </span>
              )}
              {showDetails ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-200" />
              )}
            </button>

            {/* Diagnostic dropdown popover */}
            {showDetails && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700/80 p-3.5 shadow-2xl text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.detailsTitle}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> UP
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Endpoint:</span>
                    <span className="font-mono text-slate-200">/api/v1/health</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Scheme:</span>
                    <span className="text-slate-200">{serverInfo?.scheme || 'GFI Nasho 1'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>District:</span>
                    <span className="text-slate-200">{serverInfo?.district || 'Kirehe District'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.latencyLabel}</span>
                    <span className="font-mono text-emerald-400">{latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.lastCheckedPrefix}</span>
                    <span className="text-slate-300">{formatLastCheckedTime(lastChecked, language)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => checkHealth(true)}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{isRetrying ? t.retrying : 'Ping Now'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* If offline or degraded: persistent, non-intrusive alert toast with Retry mechanism */}
        {isAlertActive && (
          <div
            role="alert"
            className="w-80 sm:w-96 rounded-xl bg-slate-900/95 border border-amber-500/40 text-slate-100 shadow-2xl backdrop-blur-md p-3.5 transition-all transform animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-amber-300">
                    {t.offline}
                  </h4>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300">
                    {consecutiveFailures > 1 ? `${consecutiveFailures} fails` : 'Disconnected'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  {errorMessage || t.offlineDesc}
                </p>
                <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>
                    {t.lastCheckedPrefix} {formatLastCheckedTime(lastChecked, language)}
                  </span>
                  {latencyMs !== null && <span>Ping: {latencyMs}ms</span>}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => checkHealth(true)}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow hover:bg-amber-400 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{isRetrying ? t.retrying : t.retryButton}</span>
                  </button>
                  <span className="text-[10px] text-slate-400">
                    Auto-retry every {getNextPollInterval(status, pollIntervalMs) / 1000}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
