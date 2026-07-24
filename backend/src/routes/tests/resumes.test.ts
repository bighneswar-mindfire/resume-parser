import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../repositories/resumeRepository.js', () => ({
  ResumeRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
  },
}));

import { ResumeRepository } from '../../repositories/resumeRepository.js';
import resumesRouter from '../resumes.js';

const RepoMock = ResumeRepository as unknown as {
  findMany: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', resumesRouter);
  return app;
}

describe('GET /api/resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { count, data } with no filters applied', async () => {
    const rows = [{ _id: '1', fileName: 'a.pdf' }];
    RepoMock.findMany.mockResolvedValue(rows);

    const res = await request(buildApp()).get('/api/resumes');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 1, data: rows });
  });

  it('upper-cases the status query parameter before querying', async () => {
    RepoMock.findMany.mockResolvedValue([]);

    await request(buildApp()).get('/api/resumes?status=completed');

    const [filter] = RepoMock.findMany.mock.calls[0]!;
    expect(filter.status).toBe('completed');
  });

  it('passes keyword to the repository', async () => {
    RepoMock.findMany.mockResolvedValue([]);

    await request(buildApp()).get('/api/resumes?keyword=react');

    const [filter] = RepoMock.findMany.mock.calls[0]!;
    expect(filter.keyword).toBe('react');
  });

  it('rejects an unknown role with a 400', async () => {
    const res = await request(buildApp()).get('/api/resumes?role=Wizard&minScore=50');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unknown role/i);
    expect(RepoMock.findMany).not.toHaveBeenCalled();
  });

  it('accepts a known role + minScore and calls the repository', async () => {
    RepoMock.findMany.mockResolvedValue([]);

    const res = await request(buildApp()).get('/api/resumes?role=Frontend%20Developer&minScore=60');

    expect(res.status).toBe(200);
    const [filter] = RepoMock.findMany.mock.calls[0]!;
    expect(filter.role).toBe('Frontend Developer');
    expect(filter.minScore).toBe(60);
  });

  it('accepts a role without a score threshold', async () => {
    RepoMock.findMany.mockResolvedValue([]);

    await request(buildApp()).get('/api/resumes?role=Backend%20Developer');

    const [filter] = RepoMock.findMany.mock.calls[0]!;
    expect(filter.role).toBe('Backend Developer');
    expect(filter.minScore).toBeUndefined();
  });

  it('returns a 500 with a helpful error when the repository throws', async () => {
    RepoMock.findMany.mockRejectedValue(new Error('boom'));

    const res = await request(buildApp()).get('/api/resumes');
    expect(res.status).toBe(500);
    expect(res.body.details).toBe('boom');
  });
});

describe('GET /api/resumes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a non-ObjectId with a 400', async () => {
    const res = await request(buildApp()).get('/api/resumes/not-an-id');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
    expect(RepoMock.findById).not.toHaveBeenCalled();
  });

  it('returns 404 when the resume does not exist', async () => {
    RepoMock.findById.mockResolvedValue(null);

    const res = await request(buildApp()).get('/api/resumes/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  it('returns 200 with the resume when found', async () => {
    const resume = { _id: '507f1f77bcf86cd799439011', fileName: 'jane.pdf' };
    RepoMock.findById.mockResolvedValue(resume);

    const res = await request(buildApp()).get('/api/resumes/507f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: resume });
  });
});
