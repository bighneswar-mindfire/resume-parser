import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface InsightsData {
  totalResumes: number;
  completedResumes: number;
  avgExperience: number;
  topSkills: Array<{ skill: string; count: number }>;
  topUniversities: Array<{ school: string; count: number }>;
  experienceBuckets: Array<{ range: string; count: number }>;
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

interface InsightsChartsProps {
  refreshKey: number;
}

export default function InsightsCharts({ refreshKey }: InsightsChartsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (isCancelled?: () => boolean) => {
    try {
      const response = await fetch('/api/insights');
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to load insights.');
      }
      const data = (await response.json()) as InsightsData;
      if (isCancelled?.()) return;
      setInsights(data);
      setFetchError(null);
    } catch (error: unknown) {
      if (isCancelled?.()) return;
      setFetchError(error instanceof Error ? error.message : 'Failed to load insights.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await fetchInsights(() => cancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchInsights, refreshKey]);

  if (fetchError) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-10 p-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded-lg">
        {fetchError}
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-10 p-8 text-center text-gray-500 text-sm">
        Loading insights…
      </div>
    );
  }

  if (insights.completedResumes === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-10 p-8 text-center text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
        Insights will appear once resumes finish parsing.
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatTile label="Total Resumes" value={insights.totalResumes} />
        <StatTile label="Parsed" value={insights.completedResumes} />
        <StatTile label="Avg Experience" value={`${insights.avgExperience} yrs`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* skills  */}
        <ChartCard title="Top Skills" wide>
          <ResponsiveContainer width="100%" height={Math.max(220, insights.topSkills.length * 34)}>
            <BarChart
              data={insights.topSkills}
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

        {/* Experience */}
        <ChartCard title="Experience Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={insights.experienceBuckets}
              margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#374151' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip cursor={{ fill: '#eef2ff' }} formatter={(v) => [v, 'candidates']} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* universities */}
        <ChartCard title="Common Universities">
          {insights.topUniversities.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
              No university data detected yet.
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ResponsiveContainer width="55%" height={240}>
                <PieChart>
                  <Pie
                    data={insights.topUniversities}
                    dataKey="count"
                    nameKey="school"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {insights.topUniversities.map((entry, index) => (
                      <Cell key={entry.school} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'resumes']} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-1.5 text-xs text-gray-700 min-w-0">
                {insights.topUniversities.map((entry, index) => (
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
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="text-xs font-bold text-gray-500 uppercase">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  wide,
  children,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm ${wide ? 'lg:col-span-2' : ''}`}
    >
      <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      {children}
    </div>
  );
}
