import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import type { InsightsData } from './types';

interface RoleMatchesChartProps {
  roleScores?: InsightsData['roleScores'];
}

export default function RoleMatchesChart({ roleScores }: RoleMatchesChartProps) {
  return (
    <ChartCard title="Avg Match per Job Role">
      {!roleScores || roleScores.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
          Role scores appear after resumes are parsed.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={roleScores}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              type="category"
              dataKey="roleName"
              width={120}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip
              cursor={{ fill: '#eef2ff' }}
              formatter={(value, _name, item) => [
                `${value}% avg • ${(item?.payload as { strongMatches?: number })?.strongMatches ?? 0} strong match(es)`,
                'Match',
              ]}
            />
            <Bar dataKey="avgScore" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
