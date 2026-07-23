import { useCallback, useEffect, useState } from 'react';
import ChartCard from './charts/ChartCard';
import ExperienceDistributionChart from './charts/ExperienceDistributionChart';
import RoleMatchesChart from './charts/RoleMatchesChart';
import StatTile from './charts/StatTile';
import TopSkillsChart from './charts/TopSkillsChart';
import UniversitiesChart from './charts/UniversitiesChart';
import type { InsightsData } from './charts/types';

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
        <TopSkillsChart topSkills={insights.topSkills} />
        <ExperienceDistributionChart experienceBuckets={insights.experienceBuckets} />
        <UniversitiesChart topUniversities={insights.topUniversities} />
        <RoleMatchesChart roleScores={insights.roleScores} />
      </div>

      {insights.computedAt && (
        <div className="mt-3 text-right text-[10px] text-gray-400">
          Last computed {new Date(insights.computedAt).toLocaleString()} (background worker)
        </div>
      )}
    </div>
  );
}

// Re-export ChartCard for backward compatibility if needed elsewhere
export { ChartCard };
