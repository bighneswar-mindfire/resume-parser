import { useCallback, useEffect, useRef, useState } from 'react';
import { ParsedResume, ResumeListResponse } from './types';

const POLL_INTERVAL_MS = 4000;

interface UseResumesOptions {
  queryString: string;
  refreshKey: number;
  onParsingSettled?: () => void;
}

interface UseResumesResult {
  resumes: ParsedResume[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  fetchError: string | null;
  refetch: () => Promise<void>;
}

export function useResumes({
  queryString,
  refreshKey,
  onParsingSettled,
}: UseResumesOptions): UseResumesResult {
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchResumes = useCallback(
    async (isCancelled?: () => boolean) => {
      try {
        const response = await fetch(`/api/resumes${queryString}`);
        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || 'Failed to load resumes.');
        }
        const responseData = (await response.json()) as ResumeListResponse;
        if (isCancelled?.()) return;
        setResumes(responseData.data);
        setTotal(responseData.total ?? responseData.data.length);
        if (typeof responseData.page === 'number') setPage(responseData.page);
        if (typeof responseData.limit === 'number') setLimit(responseData.limit);
        setFetchError(null);
      } catch (error: unknown) {
        if (isCancelled?.()) return;
        setFetchError(error instanceof Error ? error.message : 'Failed to load resumes.');
      } finally {
        if (!isCancelled?.()) setIsLoading(false);
      }
    },
    [queryString]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await fetchResumes(() => cancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchResumes, refreshKey]);

  const hasInFlight = resumes.some((r) => r.status === 'PENDING' || r.status === 'PROCESSING');
  useEffect(() => {
    if (!hasInFlight) return;
    const timer = setInterval(() => void fetchResumes(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasInFlight, fetchResumes]);

  const wasInFlightRef = useRef(false);
  useEffect(() => {
    if (wasInFlightRef.current && !hasInFlight) {
      onParsingSettled?.();
    }
    wasInFlightRef.current = hasInFlight;
  }, [hasInFlight, onParsingSettled]);

  return { resumes, total, page, limit, isLoading, fetchError, refetch: fetchResumes };
}
