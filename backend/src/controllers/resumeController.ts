import { Request, Response } from 'express';
import {
  ResumeService,
  UnknownRoleError,
  InvalidResumeIdError,
} from '../services/resumeService.js';

export const ResumeController = {
  async getResumes(req: Request, res: Response): Promise<Response> {
    try {
      const { status, keyword, location, role, minScore } = req.query as Record<
        string,
        string | undefined
      >;

      const resumes = await ResumeService.list({ status, keyword, location, role, minScore });
      return res.status(200).json({ count: resumes.length, data: resumes });
    } catch (error: unknown) {
      if (error instanceof UnknownRoleError) {
        return res.status(400).json({ error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resumes';
      return res
        .status(500)
        .json({ error: 'Server error while fetching resumes.', details: errorMessage });
    }
  },

  async getResumeById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params as { id: string };
      const resume = await ResumeService.getById(id);

      if (!resume) {
        return res.status(404).json({ error: 'Resume not found.' });
      }

      return res.status(200).json({ data: resume });
    } catch (error: unknown) {
      if (error instanceof InvalidResumeIdError) {
        return res.status(400).json({ error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resume';
      return res
        .status(500)
        .json({ error: 'Server error while fetching resume.', details: errorMessage });
    }
  },
};
