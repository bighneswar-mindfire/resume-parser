import { Request, Response } from 'express';
import { UploadService } from '../services/uploadService.js';

export const UploadController = {
  async uploadFiles(req: Request, res: Response): Promise<Response | void> {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one file.' });
      }

      const savedResumes = await UploadService.ingestFiles(files);

      return res.status(202).json({
        message: 'Resumes successfully uploaded and queued for processing.',
        data: savedResumes,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      return res
        .status(500)
        .json({ error: 'Server error during queue dispatch.', details: errorMessage });
    }
  },
};
