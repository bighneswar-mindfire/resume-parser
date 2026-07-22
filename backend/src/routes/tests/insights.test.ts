import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../services/insightsService.js', () => ({
  InsightsService: {
    getSnapshot: vi.fn(),
  },
}));

import { InsightsService } from '../../services/insightsService.js';
import insightsRouter from '../insights.js';

const svc = InsightsService as unknown as {
  getSnapshot: ReturnType<typeof vi.fn>;
};

function buildApp() {
  const app = express();
  app.use('/api', insightsRouter);
  return app;
}

describe('GET /api/insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the payload from InsightsService.getSnapshot', async () => {
    const payload = {
      totalResumes: 3,
      completedResumes: 2,
      failedResumes: 1,
      avgExperience: 4.5,
      topSkills: [{ skill: 'react', count: 2 }],
      topUniversities: [{ school: 'MIT', count: 1 }],
      experienceBuckets: [{ range: '0-1 yrs', count: 0 }],
      roleScores: [{ roleName: 'Frontend Developer', avgScore: 60, strongMatches: 1 }],
      computedAt: '2024-01-01T00:00:00.000Z',
    };
    svc.getSnapshot.mockResolvedValue(payload);

    const res = await request(buildApp()).get('/api/insights');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(svc.getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('returns a 500 with the error message when the service throws', async () => {
    svc.getSnapshot.mockRejectedValue(new Error('mongo down'));

    const res = await request(buildApp()).get('/api/insights');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/loading insights/i);
    expect(res.body.details).toBe('mongo down');
  });
});
