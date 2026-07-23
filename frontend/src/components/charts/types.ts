export interface InsightsData {
  totalResumes: number;
  completedResumes: number;
  avgExperience: number;
  topSkills: Array<{ skill: string; count: number }>;
  topUniversities: Array<{ school: string; count: number }>;
  experienceBuckets: Array<{ range: string; count: number }>;
  roleScores?: Array<{ roleName: string; avgScore: number; strongMatches: number }>;
  computedAt?: string;
}

export const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
