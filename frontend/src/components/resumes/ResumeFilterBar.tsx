import { Filters, EMPTY_FILTERS } from './types';

const ROLE_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
];

interface ResumeFilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function ResumeFilterBar({ filters, onChange }: ResumeFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.keyword) ||
    Boolean(filters.location) ||
    Boolean(filters.role) ||
    Boolean(filters.minScore);

  return (
    <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Keyword (name, skill, text…)"
          value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Location (city, state…)"
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filters.role}
          onChange={(e) => onChange({ ...filters, role: e.target.value })}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Any role</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={filters.minScore}
          onChange={(e) => onChange({ ...filters, minScore: e.target.value })}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Any score</option>
          <option value="30">≥ 30%</option>
          <option value="50">≥ 50%</option>
          <option value="70">≥ 70%</option>
          <option value="90">≥ 90%</option>
        </select>
      </div>
      {hasActiveFilters && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
