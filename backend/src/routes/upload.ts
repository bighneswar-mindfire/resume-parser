import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import upload from '../config/multer.js';
import { Resume } from '../models/Resume.js';
import { ocrQueue } from '../queues/queueSetup.js';

const router: Router = express.Router();

router.post(
  '/upload',
  upload.array('resumes', 10),
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one file.' });
      }

      const savedResumes = [];

      for (const file of files) {
        const placeholderResume = new Resume({
          fileName: file.originalname,
          filePath: file.path,
          status: 'PENDING',
        });

        const savedDoc = await placeholderResume.save();

        await ocrQueue.add('extract-text', {
          resumeId: savedDoc._id.toString(),
          filePath: file.path,
          mimetype: file.mimetype,
          originalName: file.originalname,
        });

        savedResumes.push(savedDoc);
      }

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
  }
);

router.use((err: Error, req: Request, res: Response, next: NextFunction): Response | void => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
