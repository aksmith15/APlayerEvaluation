/**
 * Custom Data Fetching Hook
 * Consolidates data fetching logic with integrated caching and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// import { dataCacheManager } from '../services/dataCacheManager';
import { useComponentPerformance } from '../contexts/PerformanceContext';

interface UseDataFetchOptions<T> {
  enabled?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
  lastFetched: number | null;
}

export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: UseDataFetchOptions<T> = {}
): UseDataFetchResult<T> {
  const {
    enabled = true,
    cacheKey,
    cacheTTL,
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    refetchOnMount = true,
    refetchOnWindowFocus = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { measureDataFetch } = useComponentPerformance('useDataFetch');

  // Load cached data on mount
  // useEffect(() => {
  //   if (cacheKey && !data) {
  //     const cachedData = dataCacheManager.get(cacheKey);
  //     if (cachedData) {
  //       setData(cachedData);
  //       setLastFetched(Date.now());
  //     }
  //   }
  // }, [cacheKey, data]);

  const executeRequest = useCallback(async (attempt: number = 1): Promise<void> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Measure performance of the data fetch operation
      const result = await measureDataFetch(
        () => fetchFn(),
        { attempt, cacheKey, enabled }
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setLastFetched(Date.now());

      // Cache the result if cache key provided
      // if (cacheKey) {
      //   dataCacheManager.set(cacheKey, result, cacheTTL);
      // }

      // Call success callback
      onSuccess?.(result);

    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Retry logic
      if (attempt < retryCount) {
        console.warn(`Data fetch attempt ${attempt} failed, retrying in ${retryDelay}ms...`, errorMessage);
        
        retryTimeoutRef.current = setTimeout(() => {
          executeRequest(attempt + 1);
        }, retryDelay * attempt); // Exponential backoff
        
        return;
      }

      // Final error state
      setError(errorMessage);
      console.error('Data fetch failed after all retry attempts:', errorMessage);
      
      // Call error callback
      onError?.(err instanceof Error ? err : new Error(errorMessage));

    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, cacheTTL, retryCount, retryDelay, onSuccess, onError, measureDataFetch]);

  // Manual refetch function
  const refetch = useCallback(async (): Promise<void> => {
    if (enabled) {
      await executeRequest();
    }
  }, [enabled, executeRequest]);

  // Manual data mutation (optimistic updates)
  const mutate = useCallback((newData: T) => {
    setData(newData);
    setLastFetched(Date.now());
    
    // Update cache if cache key provided
    // if (cacheKey) {
    //   dataCacheManager.set(cacheKey, newData, cacheTTL);
    // }
  }, []);

  // Effect to trigger initial fetch and refetch on dependency changes
  useEffect(() => {
    if (enabled && refetchOnMount) {
      executeRequest();
    }

    return () => {
      // Cleanup on unmount or dependency change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enabled, refetchOnMount, executeRequest, ...dependencies]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled && !loading) {
        executeRequest();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enabled, loading, refetchOnWindowFocus, executeRequest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    lastFetched
  };
}

// Specialized hooks for common use cases
export function useEmployeeData(employeeId: string | null) {
  return useDataFetch(
    () => {
      if (!employeeId) throw new Error('Employee ID is required');
      return fetch(`/api/employees/${employeeId}`).then(res => res.json());
    },
    [employeeId],
    {
      enabled: !!employeeId,
      cacheKey: employeeId ? `employee-${employeeId}` : undefined,
      cacheTTL: 5 * 60 * 1000 // 5 minutes
    }
  );
}

export function useQuarterData() {
  return useDataFetch(
    () => fetch('/api/quarters').then(res => res.json()),
    [],
    {
      cacheKey: 'quarters',
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: true
    }
  );
}

export function useEvaluationData(employeeId: string | null, quarterId: string | null) {
  return useDataFetch(
    () => {
      if (!employeeId || !quarterId) {
        throw new Error('Employee ID and Quarter ID are required');
      }
      return fetch(`/api/evaluations/${employeeId}/${quarterId}`).then(res => res.json());
    },
    [employeeId, quarterId],
    {
      enabled: !!(employeeId && quarterId),
      cacheKey: employeeId && quarterId ? `evaluation-${employeeId}-${quarterId}` : undefined,
      cacheTTL: 10 * 60 * 1000 // 10 minutes
    }
  );
}
