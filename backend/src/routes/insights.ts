import express, { Router } from 'express';
import { InsightsController } from '../controllers/insightsController.js';

const router: Router = express.Router();

router.get('/insights', InsightsController.getInsights);

export default router;
