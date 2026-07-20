interface SkillChipsProps {
  skills: string[];
  previewCount?: number;
}

export default function SkillChips({ skills, previewCount }: SkillChipsProps) {
  if (skills.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  const visible = previewCount ? skills.slice(0, previewCount) : skills;
  const hiddenCount = skills.length - visible.length;

  return (
    <div className={`flex flex-wrap gap-1 ${previewCount ? 'max-w-[240px]' : ''}`}>
      {visible.map((skill) => (
        <span
          key={skill}
          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-medium"
        >
          {skill}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="px-2 py-0.5 text-[10px] text-gray-500">+{hiddenCount} more</span>
      )}
    </div>
  );
}
