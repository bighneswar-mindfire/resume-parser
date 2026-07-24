import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import upload from '../config/multer.js';
import { UploadController } from '../controllers/uploadController.js';

const router: Router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const authedUser = (req as Request & { user?: { sub?: string } }).user?.sub;
    if (authedUser) return authedUser;
    return ipKeyGenerator(req.ip ?? 'unknown');
  },
  message: {
    error: 'Too many upload requests from this client. Please try again later.',
  },
});

router.post('/upload', uploadLimiter, upload.array('resumes', 10), UploadController.uploadFiles);

router.use((err: Error, req: Request, res: Response, next: NextFunction): Response | void => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
