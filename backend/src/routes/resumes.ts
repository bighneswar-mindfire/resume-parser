import express, { Router } from 'express';
import { ResumeController } from '../controllers/resumeController.js';

const router: Router = express.Router();

router.get('/resumes', ResumeController.getResumes);
router.get('/resumes/:id', ResumeController.getResumeById);

export default router;
