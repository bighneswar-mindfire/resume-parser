import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import type { InsightsData } from './types';

interface TopSkillsChartProps {
  topSkills: InsightsData['topSkills'];
}

export default function TopSkillsChart({ topSkills }: TopSkillsChartProps) {
  return (
    <ChartCard title="Top Skills" wide>
      <ResponsiveContainer width="100%" height={Math.max(220, topSkills.length * 34)}>
        <BarChart
          data={topSkills}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis
            type="category"
            dataKey="skill"
            width={96}
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <Tooltip cursor={{ fill: '#eef2ff' }} formatter={(v) => [v, 'resumes']} />
          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
