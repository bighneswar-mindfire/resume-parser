import { Resume } from '../models/Resume.js';
import { InsightsSummary, IInsightsSummary } from '../models/InsightsSummary.js';
import { JOB_ROLES } from './roleMatcher.js';

export interface InsightsPayload {
  totalResumes: number;
  completedResumes: number;
  failedResumes: number;
  avgExperience: number;
  topSkills: Array<{ skill: string; count: number }>;
  topUniversities: Array<{ school: string; count: number }>;
  experienceBuckets: Array<{ range: string; count: number }>;
  roleScores: Array<{ roleName: string; avgScore: number; strongMatches: number }>;
  computedAt: string;
}

const STRONG_MATCH_THRESHOLD = 60;

function normalizeSchool(school: string): string {
  return school
    .replace(
      /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(?:19|20)\d{2}/gi,
      ''
    )
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/[-–—]\s*(?:present|current)/gi, '')
    .replace(/[-–—,|]\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export class InsightsService {
  public static async compute(): Promise<InsightsPayload> {
    const [totalResumes, failedResumes, completed] = await Promise.all([
      Resume.countDocuments(),
      Resume.countDocuments({ status: 'FAILED' }),
      Resume.find(
        { status: 'COMPLETED' },
        { skills: 1, experience: 1, education: 1, matchedRoles: 1 }
      ).lean(),
    ]);

    const skillCounts = new Map<string, number>();
    const universityCounts = new Map<string, number>();
    const experienceBuckets = [
      { range: '0-1 yrs', min: 0, max: 1, count: 0 },
      { range: '2-4 yrs', min: 2, max: 4, count: 0 },
      { range: '5-8 yrs', min: 5, max: 8, count: 0 },
      { range: '9+ yrs', min: 9, max: Infinity, count: 0 },
    ];
    const roleAccumulator = new Map<string, { sum: number; strong: number }>();
    for (const role of JOB_ROLES) {
      roleAccumulator.set(role.name, { sum: 0, strong: 0 });
    }
    let experienceSum = 0;

    for (const resume of completed) {
      for (const skill of resume.skills || []) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }

      const years = resume.experience ?? 0;
      experienceSum += years;
      const bucket = experienceBuckets.find((b) => years >= b.min && years <= b.max);
      if (bucket) bucket.count += 1;

      for (const entry of resume.education || []) {
        if (!entry.school) continue;
        const school = normalizeSchool(entry.school);
        if (!school || school === 'Mentioned Institution' || school.length < 4) continue;
        universityCounts.set(school, (universityCounts.get(school) || 0) + 1);
      }

      for (const match of resume.matchedRoles || []) {
        const acc = match.roleName ? roleAccumulator.get(match.roleName) : undefined;
        if (!acc || typeof match.score !== 'number') continue;
        acc.sum += match.score;
        if (match.score >= STRONG_MATCH_THRESHOLD) acc.strong += 1;
      }
    }

    const topSkills = [...skillCounts.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
      .slice(0, 10);

    const topUniversities = [...universityCounts.entries()]
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count || a.school.localeCompare(b.school))
      .slice(0, 8);

    const roleScores = [...roleAccumulator.entries()]
      .map(([roleName, acc]) => ({
        roleName,
        avgScore: completed.length > 0 ? Math.round(acc.sum / completed.length) : 0,
        strongMatches: acc.strong,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      totalResumes,
      completedResumes: completed.length,
      failedResumes,
      avgExperience:
        completed.length > 0 ? Math.round((experienceSum / completed.length) * 10) / 10 : 0,
      topSkills,
      topUniversities,
      experienceBuckets: experienceBuckets.map(({ range, count }) => ({ range, count })),
      roleScores,
      computedAt: new Date().toISOString(),
    };
  }

  public static async computeAndStore(): Promise<InsightsPayload> {
    const payload = await this.compute();
    await InsightsSummary.findOneAndUpdate(
      { key: 'global' },
      { ...payload, computedAt: new Date(payload.computedAt) },
      { upsert: true }
    );
    return payload;
  }

  public static async getSnapshot(): Promise<InsightsPayload> {
    const stored = (await InsightsSummary.findOne({
      key: 'global',
    }).lean()) as IInsightsSummary | null;

    if (!stored) {
      return this.computeAndStore();
    }

    return {
      totalResumes: stored.totalResumes,
      completedResumes: stored.completedResumes,
      failedResumes: stored.failedResumes,
      avgExperience: stored.avgExperience,
      topSkills: stored.topSkills,
      topUniversities: stored.topUniversities,
      experienceBuckets: stored.experienceBuckets,
      roleScores: stored.roleScores,
      computedAt: new Date(stored.computedAt).toISOString(),
    };
  }
}
