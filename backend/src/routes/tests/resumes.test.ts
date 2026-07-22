import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../models/Resume.js', () => ({
  Resume: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

import { Resume } from '../../models/Resume.js';
import resumesRouter from '../resumes.js';

const ResumeMock = Resume as unknown as {
  find: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', resumesRouter);
  return app;
}

function chainableList<T>(result: T) {
  const chain = {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

function chainableOne<T>(result: T) {
  return { lean: vi.fn().mockResolvedValue(result) };
}

describe('GET /api/resumes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { count, data } from the model with no filters applied', async () => {
    const rows = [{ _id: '1', fileName: 'a.pdf' }];
    ResumeMock.find.mockReturnValue(chainableList(rows));

    const res = await request(buildApp()).get('/api/resumes');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 1, data: rows });
    expect(ResumeMock.find).toHaveBeenCalledWith({}, { rawText: 0, filePath: 0 });
  });

  it('upper-cases the status query parameter before querying', async () => {
    ResumeMock.find.mockReturnValue(chainableList([]));

    await request(buildApp()).get('/api/resumes?status=completed');

    const [filter] = ResumeMock.find.mock.calls[0]!;
    expect(filter).toEqual({ $and: [{ status: 'COMPLETED' }] });
  });

  it('builds an $or regex query for keyword search', async () => {
    ResumeMock.find.mockReturnValue(chainableList([]));

    await request(buildApp()).get('/api/resumes?keyword=react');

    const [filter] = ResumeMock.find.mock.calls[0]!;
    expect(filter.$and[0].$or).toBeDefined();
    expect(filter.$and[0].$or.length).toBe(4);
    // Every branch should be a case-insensitive regex.
    for (const clause of filter.$and[0].$or) {
      const value = Object.values(clause)[0] as RegExp;
      expect(value).toBeInstanceOf(RegExp);
      expect(value.flags).toContain('i');
    }
  });

  it('rejects an unknown role with a 400', async () => {
    const res = await request(buildApp()).get('/api/resumes?role=Wizard&minScore=50');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unknown role/i);
    expect(ResumeMock.find).not.toHaveBeenCalled();
  });

  it('accepts a known role + minScore and builds an $elemMatch', async () => {
    ResumeMock.find.mockReturnValue(chainableList([]));

    const res = await request(buildApp()).get('/api/resumes?role=Frontend%20Developer&minScore=60');

    expect(res.status).toBe(200);
    const [filter] = ResumeMock.find.mock.calls[0]!;
    const elemMatch = filter.$and[0].matchedRoles.$elemMatch;
    expect(elemMatch.roleName).toBe('Frontend Developer');
    expect(elemMatch.score).toEqual({ $gte: 60 });
  });

  it('accepts a role without a score threshold (any positive match)', async () => {
    ResumeMock.find.mockReturnValue(chainableList([]));

    await request(buildApp()).get('/api/resumes?role=Backend%20Developer');

    const [filter] = ResumeMock.find.mock.calls[0]!;
    const elemMatch = filter.$and[0].matchedRoles.$elemMatch;
    expect(elemMatch.roleName).toBe('Backend Developer');
    expect(elemMatch.score).toEqual({ $gt: 0 });
  });

  it('returns a 500 with a helpful error when the DB throws', async () => {
    ResumeMock.find.mockImplementation(() => {
      throw new Error('boom');
    });

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
    expect(ResumeMock.findById).not.toHaveBeenCalled();
  });

  it('returns 404 when the resume does not exist', async () => {
    ResumeMock.findById.mockReturnValue(chainableOne(null));

    const res = await request(buildApp()).get('/api/resumes/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  it('returns 200 with the resume when found', async () => {
    const resume = { _id: '507f1f77bcf86cd799439011', fileName: 'jane.pdf' };
    ResumeMock.findById.mockReturnValue(chainableOne(resume));

    const res = await request(buildApp()).get('/api/resumes/507f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: resume });
    expect(ResumeMock.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      rawText: 0,
      filePath: 0,
    });
  });
});
