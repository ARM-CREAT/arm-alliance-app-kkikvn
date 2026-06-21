import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiGet } from '@/utils/api';

interface UseRealtimeApiOptions {
  /** Polling interval in seconds (default: 30) */
  intervalSeconds?: number;
  /** Whether to start polling immediately (default: true) */
  enabled?: boolean;
}

interface UseRealtimeApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Manually trigger a re-fetch (e.g. for pull-to-refresh) */
  refetch: () => void;
  /** Alias for refetch — use either name */
  refresh: () => void;
}

/**
 * Hook for polling an API endpoint at a regular interval.
 * Fetches immediately on mount, then re-fetches every `intervalSeconds`.
 * Pauses polling when the app goes to the background to save battery/bandwidth.
 */
export function useRealtimeApi<T = any>(
  endpoint: string,
  options: UseRealtimeApiOptions = {}
): UseRealtimeApiResult<T> {
  const { intervalSeconds = 30, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    console.log('[useRealtimeApi] Fetching:', endpoint);
    try {
      const result = await apiGet<T>(endpoint);
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        console.log('[useRealtimeApi] Success:', endpoint);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const msg = err?.message || 'Erreur réseau';
        setError(msg);
        console.error('[useRealtimeApi] Error:', endpoint, msg);
        // Keep existing data on error — don't wipe the UI
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, enabled]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchData, intervalSeconds * 1000);
  }, [fetchData, intervalSeconds]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchData();
    startPolling();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && prev !== 'active') {
        // App came to foreground — refresh immediately and restart polling
        console.log('[useRealtimeApi] App foregrounded, refreshing:', endpoint);
        fetchData();
        startPolling();
      } else if (nextState !== 'active' && prev === 'active') {
        // App went to background — pause polling
        console.log('[useRealtimeApi] App backgrounded, pausing polling:', endpoint);
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      stopPolling();
      subscription.remove();
    };
  }, [endpoint, intervalSeconds, enabled, fetchData, startPolling, stopPolling]);

  return { data, loading, error, refetch: fetchData, refresh: fetchData };
}

export default useRealtimeApi;
