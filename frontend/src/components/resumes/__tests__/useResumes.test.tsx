import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useResumes } from '../useResumes';
import { makeResume } from '../../../test/fixtures';

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('useResumes', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches resumes and exposes them once loaded', async () => {
    const resumes = [makeResume()];
    vi.stubGlobal('fetch', mockFetchOnce({ data: resumes, total: 1, page: 1, limit: 20 }));

    const { result } = renderHook(() => useResumes({ queryString: '', refreshKey: 0 }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resumes).toEqual(resumes);
    expect(result.current.total).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(20);
    expect(result.current.fetchError).toBeNull();
  });

  it('requests the correct URL including the query string', async () => {
    const fetchMock = mockFetchOnce({ data: [], total: 0, page: 1, limit: 20 });
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useResumes({ queryString: '?role=Backend%20Developer', refreshKey: 0 }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/resumes?role=Backend%20Developer');
  });

  it('exposes pagination metadata from the server response', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ data: [], total: 123, page: 3, limit: 50 }));

    const { result } = renderHook(() =>
      useResumes({ queryString: '?page=3&limit=50', refreshKey: 0 })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.total).toBe(123);
    expect(result.current.page).toBe(3);
    expect(result.current.limit).toBe(50);
  });

  it('sets an error message when the response is not ok', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ error: 'Server exploded' }, false));

    const { result } = renderHook(() => useResumes({ queryString: '', refreshKey: 0 }));

    await waitFor(() => expect(result.current.fetchError).toBe('Server exploded'));
    expect(result.current.resumes).toEqual([]);
  });

  it('sets a fallback error message when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));

    const { result } = renderHook(() => useResumes({ queryString: '', refreshKey: 0 }));

    await waitFor(() => expect(result.current.fetchError).toBe('Network down'));
  });

  it('polls again while a resume is still in flight', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [makeResume({ status: 'PROCESSING' })],
        total: 1,
        page: 1,
        limit: 20,
      }),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useResumes({ queryString: '', refreshKey: 0 }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1), {
      timeout: 8000,
    });
  });

  it('invokes onParsingSettled when in-flight resumes finish', async () => {
    const onParsingSettled = vi.fn();
    let inFlight = true;
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        ({
          ok: true,
          json: async () => ({
            data: [makeResume({ status: inFlight ? 'PROCESSING' : 'COMPLETED' })],
            total: 1,
            page: 1,
            limit: 20,
          }),
        }) as Response
    );
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useResumes({ queryString: '', refreshKey: 0, onParsingSettled }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    inFlight = false;
    await waitFor(() => expect(onParsingSettled).toHaveBeenCalled(), { timeout: 8000 });
  });
});
