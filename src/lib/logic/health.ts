/**
 * Pure logic and helpers for Health Check monitoring and API status evaluation
 * Decoupled from React DOM for automated unit testing with node:test
 */

export type HealthStatus = 'healthy' | 'degraded' | 'offline' | 'checking';

export interface HealthApiResponse {
  status: string;
  scheme?: string;
  district?: string;
  timezone?: string;
  version?: string;
  database?: string;
  isDemoMode?: boolean;
}

export interface HealthState {
  status: HealthStatus;
  lastChecked: Date | null;
  latencyMs: number | null;
  errorMessage: string | null;
  serverInfo: HealthApiResponse | null;
  consecutiveFailures: number;
}

/**
 * Evaluates the health status based on HTTP success, response payload, and roundtrip latency.
 */
export function evaluateHealthResponse(
  isHttpOk: boolean,
  data?: Partial<HealthApiResponse> | null,
  latencyMs?: number
): { status: HealthStatus; errorMessage: string | null } {
  if (!isHttpOk || !data) {
    return {
      status: 'offline',
      errorMessage: 'Backend API unreachable or returned non-200 status code.',
    };
  }

  const rawStatus = (data.status || '').toUpperCase();
  if (rawStatus === 'UP' || rawStatus === 'OK' || rawStatus === 'HEALTHY') {
    // If latency is excessive (> 3000ms), mark as degraded
    if (latencyMs !== undefined && latencyMs > 3000) {
      return {
        status: 'degraded',
        errorMessage: `High API latency detected (${latencyMs}ms).`,
      };
    }
    return {
      status: 'healthy',
      errorMessage: null,
    };
  }

  if (rawStatus === 'DEGRADED') {
    return {
      status: 'degraded',
      errorMessage: 'Backend services are partially operational.',
    };
  }

  return {
    status: 'offline',
    errorMessage: `Unexpected health status response: ${rawStatus || 'UNKNOWN'}`,
  };
}

/**
 * Determines whether a persistent non-intrusive alert should be shown in the UI.
 * Shows alert if offline or degraded, or if consecutive failures > 0.
 */
export function shouldDisplayHealthAlert(status: HealthStatus, consecutiveFailures: number): boolean {
  return status === 'offline' || status === 'degraded' || consecutiveFailures > 0;
}

/**
 * Calculates next polling interval in milliseconds.
 * Normal: 30 seconds (30,000ms).
 * Offline backoff / faster retry: 10 seconds if offline to recover quickly.
 */
export function getNextPollInterval(status: HealthStatus, defaultIntervalMs = 30000): number {
  if (status === 'offline') {
    return 10000; // Check every 10s when recovering
  }
  return defaultIntervalMs;
}

/**
 * Formats relative time elapsed since the last health ping.
 */
export function formatLastCheckedTime(date: Date | null, language: 'en' | 'rw' = 'en'): string {
  if (!date) {
    return language === 'rw' ? 'Ntabwo barafatanya' : 'Never';
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsedSeconds < 5) {
    return language === 'rw' ? 'Nonaha' : 'Just now';
  }
  if (elapsedSeconds < 60) {
    return language === 'rw' ? `amasegonda ${elapsedSeconds} ashize` : `${elapsedSeconds}s ago`;
  }
  const minutes = Math.floor(elapsedSeconds / 60);
  return language === 'rw' ? `iminota ${minutes} ishize` : `${minutes}m ago`;
}
