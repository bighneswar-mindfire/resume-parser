import express, { Request, Response, Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { Resume } from '../models/Resume.js';

const router: Router = express.Router();

router.get('/resumes', async (req: Request, res: Response): Promise<Response> => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const query: Record<string, unknown> = {};

    if (statusFilter) {
      query.status = statusFilter.toUpperCase();
    }

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
