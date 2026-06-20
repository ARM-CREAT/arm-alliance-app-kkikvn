import { useState, useEffect, useCallback, useRef } from 'react';
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
  refetch: () => void;
}

/**
 * Hook for polling an API endpoint at a regular interval.
 * Fetches immediately on mount, then re-fetches every `intervalSeconds`.
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

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    console.log('[useRealtimeApi] Fetching:', endpoint);
    try {
      const result = await apiGet<T>(endpoint);
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        console.log('[useRealtimeApi] Success:', endpoint, result);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const msg = err?.message || 'Erreur réseau';
        setError(msg);
        console.error('[useRealtimeApi] Error:', endpoint, msg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, intervalSeconds * 1000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [endpoint, intervalSeconds, enabled, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useRealtimeApi;
