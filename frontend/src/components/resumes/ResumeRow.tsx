import { ParsedResume, EducationEntry } from './types';
import SkillChips from './SkillChips';

const STATUS_STYLES: Record<ParsedResume['status'], string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

const SKILL_PREVIEW_COUNT = 5;

function formatEducation(education?: EducationEntry[]): string {
  const first = education?.[0];
  if (!first) return '—';
  const year = first.year ? ` (${first.year})` : '';
  // degree and school can be the same line when both were found on one line
  const school = first.school === first.degree ? '' : ` — ${first.school}`;
  return `${first.degree}${school}${year}`;
}

interface ResumeRowProps {
  resume: ParsedResume;
  onToggle: () => void;
}

/** Summary table row for one resume; click toggles the details panel. */
export default function ResumeRow({ resume, onToggle }: ResumeRowProps) {
  return (
    <tr onClick={onToggle} className="cursor-pointer hover:bg-indigo-50/40 transition-colors">
      <td className="px-4 py-3">
        <div className="font-semibold text-gray-900">{resume.name || '—'}</div>
        <div className="text-xs text-gray-500 truncate max-w-[180px]">{resume.fileName}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-gray-700">{resume.email || '—'}</div>
        <div className="text-xs text-gray-500">{resume.phone || ''}</div>
      </td>
      <td className="px-4 py-3">
        <SkillChips skills={resume.skills} previewCount={SKILL_PREVIEW_COUNT} />
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
  );
}
