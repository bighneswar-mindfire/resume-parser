import { PAGE_SIZE_OPTIONS } from './types';

interface ResumePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  disabled?: boolean;
}

export default function ResumePagination({
  page,
  limit,
  total,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: ResumePaginationProps) {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const clampedPage = Math.min(Math.max(page, 1), totalPages);
  const rangeStart = total === 0 ? 0 : (clampedPage - 1) * limit + 1;
  const rangeEnd = Math.min(clampedPage * limit, total);

  const canPrev = !disabled && clampedPage > 1;
  const canNext = !disabled && clampedPage < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-gray-700">
      <div>
        {total === 0 ? (
          <span>No results</span>
        ) : (
          <span>
            Showing <span className="font-medium">{rangeStart}</span>–
            <span className="font-medium">{rangeEnd}</span> of{' '}
            <span className="font-medium">{total}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-gray-600">
          <span>Per page:</span>
          <select
            aria-label="Results per page"
            value={limit || PAGE_SIZE_OPTIONS[1]}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={disabled}
            className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800 disabled:opacity-50"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => canPrev && onPageChange(clampedPage - 1)}
          disabled={!canPrev}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>

        <span className="px-2 text-gray-600">
          Page <span className="font-medium">{clampedPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </span>

        <button
          type="button"
          onClick={() => canNext && onPageChange(clampedPage + 1)}
          disabled={!canNext}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
