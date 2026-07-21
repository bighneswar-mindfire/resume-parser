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
    vi.stubGlobal('fetch', mockFetchOnce({ count: 1, data: resumes }));

    const { result } = renderHook(() => useResumes({ queryString: '', refreshKey: 0 }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resumes).toEqual(resumes);
    expect(result.current.fetchError).toBeNull();
  });

  it('requests the correct URL including the query string', async () => {
    const fetchMock = mockFetchOnce({ count: 0, data: [] });
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useResumes({ queryString: '?role=Backend%20Developer', refreshKey: 0 }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/resumes?role=Backend%20Developer');
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
      json: async () => ({ count: 1, data: [makeResume({ status: 'PROCESSING' })] }),
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
            count: 1,
            data: [makeResume({ status: inFlight ? 'PROCESSING' : 'COMPLETED' })],
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
