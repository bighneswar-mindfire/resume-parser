export interface EducationEntry {
  school: string;
  degree: string;
  year: number | null;
}

export interface RoleMatch {
  roleName: string;
  score: number;
}

export interface ParsedResume {
  _id: string;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  experience?: number;
  education?: EducationEntry[];
  matchedRoles?: RoleMatch[];
  createdAt: string;
}

export interface ResumeListResponse {
  data: ParsedResume[];
  total: number;
  page: number;
  limit: number;
}

export interface Filters {
  keyword: string;
  location: string;
  role: string;
  minScore: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export const EMPTY_FILTERS: Filters = { keyword: '', location: '', role: '', minScore: '' };

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function buildQueryString(filters: Filters, pagination?: PaginationParams): string {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.location.trim()) params.set('location', filters.location.trim());
  if (filters.role) params.set('role', filters.role);
  if (filters.minScore) params.set('minScore', filters.minScore);
  if (pagination) {
    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
