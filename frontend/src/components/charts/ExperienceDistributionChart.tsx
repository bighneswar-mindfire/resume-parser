import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import type { InsightsData } from './types';

interface ExperienceDistributionChartProps {
  experienceBuckets: InsightsData['experienceBuckets'];
}

export default function ExperienceDistributionChart({
  experienceBuckets,
}: ExperienceDistributionChartProps) {
  return (
    <ChartCard title="Experience Distribution">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={experienceBuckets} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#374151' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip cursor={{ fill: '#eef2ff' }} formatter={(v) => [v, 'candidates']} />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
