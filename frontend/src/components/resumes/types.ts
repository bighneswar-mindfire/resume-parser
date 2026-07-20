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
  count: number;
  data: ParsedResume[];
}

export interface Filters {
  keyword: string;
  location: string;
  role: string;
  minScore: string;
}

export const EMPTY_FILTERS: Filters = { keyword: '', location: '', role: '', minScore: '' };

export function buildQueryString(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.location.trim()) params.set('location', filters.location.trim());
  if (filters.role) params.set('role', filters.role);
  if (filters.minScore) params.set('minScore', filters.minScore);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
