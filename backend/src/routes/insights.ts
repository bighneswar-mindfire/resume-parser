import express, { Request, Response, Router } from 'express';
import { Resume } from '../models/Resume.js';

const router: Router = express.Router();

export interface InsightsResponse {
  totalResumes: number;
  completedResumes: number;
  avgExperience: number;
  topSkills: Array<{ skill: string; count: number }>;
  topUniversities: Array<{ school: string; count: number }>;
  experienceBuckets: Array<{ range: string; count: number }>;
}

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

router.get('/insights', async (_req: Request, res: Response): Promise<Response> => {
  try {
    const [totalResumes, completed] = await Promise.all([
      Resume.countDocuments(),
      Resume.find({ status: 'COMPLETED' }, { skills: 1, experience: 1, education: 1 }).lean(),
    ]);

    const skillCounts = new Map<string, number>();
    const universityCounts = new Map<string, number>();
    const experienceBuckets = [
      { range: '0-1 yrs', min: 0, max: 1, count: 0 },
      { range: '2-4 yrs', min: 2, max: 4, count: 0 },
      { range: '5-8 yrs', min: 5, max: 8, count: 0 },
      { range: '9+ yrs', min: 9, max: Infinity, count: 0 },
    ];
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
    }

    const topSkills = [...skillCounts.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
      .slice(0, 10);

    const topUniversities = [...universityCounts.entries()]
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count || a.school.localeCompare(b.school))
      .slice(0, 8);

    const payload: InsightsResponse = {
      totalResumes,
      completedResumes: completed.length,
      avgExperience:
        completed.length > 0 ? Math.round((experienceSum / completed.length) * 10) / 10 : 0,
      topSkills,
      topUniversities,
      experienceBuckets: experienceBuckets.map(({ range, count }) => ({ range, count })),
    };

    return res.status(200).json(payload);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to compute insights';
    return res
      .status(500)
      .json({ error: 'Server error while computing insights.', details: errorMessage });
  }
});

export default router;
