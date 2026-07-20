import { ParsedResume } from './types';
import SkillChips from './SkillChips';

interface ResumeDetailsPanelProps {
  resume: ParsedResume;
}

export default function ResumeDetailsPanel({ resume }: ResumeDetailsPanelProps) {
  return (
    <td colSpan={6} className="px-6 py-4">
      {resume.status === 'FAILED' ? (
        <div className="text-sm text-red-700">
          <span className="font-semibold">Processing failed:</span>{' '}
          {resume.errorMessage || 'Unknown error'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">
              All Skills ({resume.skills.length})
            </div>
            {resume.skills.length === 0 ? (
              <span className="text-gray-400">None detected</span>
            ) : (
              <SkillChips skills={resume.skills} />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Education</div>
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
                    {entry.year && <span className="text-gray-400"> ({entry.year})</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Role Matches</div>
            {!resume.matchedRoles || resume.matchedRoles.length === 0 ? (
              <span className="text-gray-400">Not scored yet</span>
            ) : (
              <ul className="space-y-2">
                {resume.matchedRoles.map((match) => (
                  <li key={match.roleName}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-700">{match.roleName}</span>
                      <span className="font-semibold text-gray-900">{match.score}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          match.score >= 60
                            ? 'bg-green-500'
                            : match.score >= 35
                              ? 'bg-amber-400'
                              : 'bg-gray-300'
                        }`}
                        style={{ width: `${match.score}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className="mt-3 text-[10px] font-mono text-gray-400">
        Doc ID: {resume._id} • Uploaded {new Date(resume.createdAt).toLocaleString()}
      </div>
    </td>
  );
}
