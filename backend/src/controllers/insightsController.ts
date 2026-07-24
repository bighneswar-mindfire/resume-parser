import { Request, Response } from 'express';
import { InsightsService } from '../services/insightsService.js';

export const InsightsController = {
  async getInsights(_req: Request, res: Response): Promise<Response> {
    try {
      const payload = await InsightsService.getSnapshot();
      return res.status(200).json(payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load insights';
      return res
        .status(500)
        .json({ error: 'Server error while loading insights.', details: errorMessage });
    }
  },
};
