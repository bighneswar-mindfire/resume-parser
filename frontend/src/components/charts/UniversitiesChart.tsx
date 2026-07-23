import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_COLORS, type InsightsData } from './types';

interface UniversitiesChartProps {
  topUniversities: InsightsData['topUniversities'];
}

export default function UniversitiesChart({ topUniversities }: UniversitiesChartProps) {
  return (
    <ChartCard title="Common Universities">
      {topUniversities.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
          No university data detected yet.
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <ResponsiveContainer width="55%" height={240}>
            <PieChart>
              <Pie
                data={topUniversities}
                dataKey="count"
                nameKey="school"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {topUniversities.map((entry, index) => (
                  <Cell key={entry.school} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, 'resumes']} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-1.5 text-xs text-gray-700 min-w-0">
            {topUniversities.map((entry, index) => (
              <li key={entry.school} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="truncate" title={entry.school}>
                  {entry.school}
                </span>
                <span className="ml-auto font-semibold text-gray-500">{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
