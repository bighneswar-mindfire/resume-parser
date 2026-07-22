import express, { Request, Response, Router } from 'express';
import { isValidObjectId, QueryFilter } from 'mongoose';
import { Resume, IResume } from '../models/Resume.js';
import { JOB_ROLES } from '../services/roleMatcher.js';

const router: Router = express.Router();

function escapeRegex(value: string): string {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

router.get('/resumes', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { status, keyword, location, role, minScore } = req.query as Record<
      string,
      string | undefined
    >;

    const conditions: QueryFilter<IResume>[] = [];

    if (status) {
      conditions.push({ status: status.toUpperCase() as IResume['status'] });
    }

    if (keyword?.trim()) {
      const pattern = new RegExp(escapeRegex(keyword.trim()), 'i');
      conditions.push({
        $or: [{ name: pattern }, { email: pattern }, { skills: pattern }, { rawText: pattern }],
      });
    }

    if (location?.trim()) {
      conditions.push({ rawText: new RegExp(escapeRegex(location.trim()), 'i') });
    }

    const parsedMinScore = minScore !== undefined ? Number(minScore) : undefined;
    if (parsedMinScore !== undefined && !Number.isNaN(parsedMinScore)) {
      if (role?.trim()) {
        const roleName = role.trim();
        const knownRole = JOB_ROLES.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
        if (!knownRole) {
          return res.status(400).json({
            error: `Unknown role "${roleName}". Valid roles: ${JOB_ROLES.map((r) => r.name).join(', ')}`,
          });
        }
        conditions.push({
          matchedRoles: {
            $elemMatch: { roleName: knownRole.name, score: { $gte: parsedMinScore } },
          },
        });
      } else {
        conditions.push({ 'matchedRoles.score': { $gte: parsedMinScore } });
      }
    } else if (role?.trim()) {
      conditions.push({
        matchedRoles: { $elemMatch: { roleName: role.trim(), score: { $gt: 0 } } },
      });
    }

    const query: QueryFilter<IResume> = conditions.length > 0 ? { $and: conditions } : {};

    const resumes = await Resume.find(query, { rawText: 0, filePath: 0 })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({ count: resumes.length, data: resumes });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resumes';
    return res
      .status(500)
      .json({ error: 'Server error while fetching resumes.', details: errorMessage });
  }
});

router.get('/resumes/:id', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid resume ID.' });
    }

    const resume = await Resume.findById(id, { rawText: 0, filePath: 0 }).lean();

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    return res.status(200).json({ data: resume });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resume';
    return res
      .status(500)
      .json({ error: 'Server error while fetching resume.', details: errorMessage });
  }
});

export default router;
