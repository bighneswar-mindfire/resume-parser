import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

interface EducationEntry {
  school: string;
  degree: string;
  year: number | null;
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
  createdAt: string;
}

interface ResumeListResponse {
  count: number;
  data: ParsedResume[];
}

const STATUS_STYLES: Record<ParsedResume['status'], string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

const POLL_INTERVAL_MS = 4000;
const SKILL_PREVIEW_COUNT = 5;

interface ResumeResultsProps {
  refreshKey: number;
  onParsingSettled?: () => void;
}

export default function ResumeResults({ refreshKey, onParsingSettled }: ResumeResultsProps) {
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    try {
      const response = await fetch('/api/resumes');
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to load resumes.');
      }
      const responseData = (await response.json()) as ResumeListResponse;
      setResumes(responseData.data);
      setFetchError(null);
    } catch (error: unknown) {
      setFetchError(error instanceof Error ? error.message : 'Failed to load resumes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (cancelled) return;
      await fetchResumes();
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

  const formatEducation = (education?: EducationEntry[]): string => {
    const first = education?.[0];
    if (!first) return '—';
    const year = first.year ? ` (${first.year})` : '';
    // degree and school can be the same line when both were found on one line
    const school = first.school === first.degree ? '' : ` — ${first.school}`;
    return `${first.degree}${school}${year}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Parsed Resumes {resumes.length > 0 && `(${resumes.length})`}
        </h3>
        <button
          onClick={() => void fetchResumes()}
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

      {isLoading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Loading resumes…</div>
      ) : resumes.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
          No resumes yet — upload some above to see parsed results here.
        </div>
      ) : (
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
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : resume._id)}
                      className="cursor-pointer hover:bg-indigo-50/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{resume.name || '—'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                          {resume.fileName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{resume.email || '—'}</div>
                        <div className="text-xs text-gray-500">{resume.phone || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        {resume.skills.length === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {resume.skills.slice(0, SKILL_PREVIEW_COUNT).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {resume.skills.length > SKILL_PREVIEW_COUNT && (
                              <span className="px-2 py-0.5 text-[10px] text-gray-500">
                                +{resume.skills.length - SKILL_PREVIEW_COUNT} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {resume.status === 'COMPLETED' ? `${resume.experience ?? 0} yrs` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[220px]">
                        <span className="line-clamp-2">{formatEducation(resume.education)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 border rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_STYLES[resume.status]}`}
                        >
                          {resume.status}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50/70">
                        <td colSpan={6} className="px-6 py-4">
                          {resume.status === 'FAILED' ? (
                            <div className="text-sm text-red-700">
                              <span className="font-semibold">Processing failed:</span>{' '}
                              {resume.errorMessage || 'Unknown error'}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                                  All Skills ({resume.skills.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {resume.skills.length === 0 ? (
                                    <span className="text-gray-400">None detected</span>
                                  ) : (
                                    resume.skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                                  Education
                                </div>
                                {!resume.education || resume.education.length === 0 ? (
                                  <span className="text-gray-400">None detected</span>
                                ) : (
                                  <ul className="space-y-1">
                                    {resume.education.map((entry, index) => (
                                      <li key={index} className="text-gray-700">
                                        <span className="font-medium">{entry.degree}</span>
                                        {entry.school !== entry.degree && (
                                          <span className="text-gray-500"> — {entry.school}</span>
                                        )}
                                        {entry.year && (
                                          <span className="text-gray-400"> ({entry.year})</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="mt-3 text-[10px] font-mono text-gray-400">
                            Doc ID: {resume._id} • Uploaded{' '}
                            {new Date(resume.createdAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
