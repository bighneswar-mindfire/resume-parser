import { Fragment, useEffect, useState } from 'react';
import {
  Filters,
  EMPTY_FILTERS,
  buildQueryString,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from './resumes/types';
import ResumeFilterBar from './resumes/ResumeFilterBar';
import ResumeRow from './resumes/ResumeRow';
import ResumeDetailsPanel from './resumes/ResumeDetailsPanel';
import ResumePagination from './resumes/ResumePagination';
import { useResumes } from './resumes/useResumes';

export type { ParsedResume } from './resumes/types';

const FILTER_DEBOUNCE_MS = 400;

interface ResumeResultsProps {
  refreshKey: number;
  /** Called when in-flight resumes finish parsing, so sibling views (insights) can refresh */
  onParsingSettled?: () => void;
}

export default function ResumeResults({ refreshKey, onParsingSettled }: ResumeResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // Debounced copy of the filters — the one actually sent to the API
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters(filters);
      setPage(DEFAULT_PAGE); // Reset to first page whenever filters change
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  const queryString = buildQueryString(appliedFilters, { page, limit: pageSize });
  const {
    resumes,
    total,
    page: serverPage,
    limit: serverLimit,
    isLoading,
    fetchError,
    refetch,
  } = useResumes({
    queryString,
    refreshKey,
    onParsingSettled,
  });

  const effectivePage = serverPage || page;
  const effectiveLimit = serverLimit || pageSize;

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setExpandedId(null);
  };

  const handlePageSizeChange = (nextLimit: number) => {
    setPageSize(nextLimit);
    setPage(DEFAULT_PAGE);
    setExpandedId(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Parsed Resumes {total > 0 && `(${total})`}
        </h3>
        <button
          onClick={() => void refetch()}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {fetchError && (
        <div className="p-4 mb-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded-lg">
          {fetchError}
        </div>
      )}

      <ResumeFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Loading resumes…</div>
      ) : resumes.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
          {buildQueryString(appliedFilters)
            ? 'No resumes match the current filters.'
            : 'No resumes yet — upload some above to see parsed results here.'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Skills</th>
                  <th className="px-4 py-3 whitespace-nowrap">Experience</th>
                  <th className="px-4 py-3">Education</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {resumes.map((resume) => {
                  const isExpanded = expandedId === resume._id;
                  return (
                    <Fragment key={resume._id}>
                      <ResumeRow
                        resume={resume}
                        onToggle={() => setExpandedId(isExpanded ? null : resume._id)}
                      />
                      {isExpanded && (
                        <tr className="bg-gray-50/70">
                          <ResumeDetailsPanel resume={resume} />
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ResumePagination
            page={effectivePage}
            limit={effectiveLimit}
            total={total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            disabled={isLoading}
          />
        </>
      )}
    </div>
  );
}
