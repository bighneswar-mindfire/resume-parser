import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import upload from '../config/multer.js';

const router: Router = express.Router();

interface UploadedFileResponse {
  originalName: string;
  fileName: string;
  path: string;
  mimetype: string;
  size: number;
}

router.post(
  '/upload',
  upload.array('resumes', 10),
  (req: Request, res: Response): Response | void => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one file.' });
      }

      const uploadedFiles: UploadedFileResponse[] = files.map((file) => ({
        originalName: file.originalname,
        fileName: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      }));

      return res.status(200).json({
        message: 'Files uploaded successfully.',
        files: uploadedFiles,
      });
    } catch {
      return res.status(500).json({ error: 'Server error during file upload.' });
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
