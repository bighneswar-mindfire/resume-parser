import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../repositories/insightsRepository.js', () => ({
  InsightsRepository: {
    countTotal: vi.fn(),
    countFailed: vi.fn(),
    findCompleted: vi.fn(),
    getSnapshot: vi.fn(),
    upsertSnapshot: vi.fn(),
  },
}));

import { InsightsService } from '../insightsService.js';
import { InsightsRepository } from '../../repositories/insightsRepository.js';

const RepoMock = InsightsRepository as unknown as {
  countTotal: ReturnType<typeof vi.fn>;
  countFailed: ReturnType<typeof vi.fn>;
  findCompleted: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
  upsertSnapshot: ReturnType<typeof vi.fn>;
};

const COMPLETED_RESUMES = [
  {
    skills: ['react', 'typescript'],
    experience: 3,
    education: [{ school: 'MIT', degree: 'B.Sc CS', year: 2018 }],
    matchedRoles: [
      { roleName: 'Frontend Developer', score: 80 },
      { roleName: 'Backend Developer', score: 20 },
    ],
  },
  {
    skills: ['react', 'node.js'],
    experience: 7,
    education: [{ school: 'MIT', degree: 'B.Sc CS', year: 2015 }],
    matchedRoles: [
      { roleName: 'Frontend Developer', score: 70 },
      { roleName: 'Full Stack Developer', score: 65 },
    ],
  },
  {
    skills: ['python', 'sql'],
    experience: 10,
    education: [{ school: 'Stanford University', degree: 'M.Sc CS', year: 2012 }],
    matchedRoles: [{ roleName: 'Data Engineer', score: 55 }],
  },
];

describe('InsightsService.compute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RepoMock.countTotal.mockResolvedValue(5);
    RepoMock.countFailed.mockResolvedValue(1);
    RepoMock.findCompleted.mockResolvedValue(COMPLETED_RESUMES);
  });

  it('aggregates the top-level counts', async () => {
    const payload = await InsightsService.compute();
    expect(payload.totalResumes).toBe(5);
    expect(payload.failedResumes).toBe(1);
    expect(payload.completedResumes).toBe(COMPLETED_RESUMES.length);
  });

  it('averages experience across completed resumes to one decimal', async () => {
    const payload = await InsightsService.compute();
    expect(payload.avgExperience).toBeCloseTo(6.7, 1);
  });

  it('produces top skills counts, sorted by frequency', async () => {
    const payload = await InsightsService.compute();
    const react = payload.topSkills.find((s) => s.skill === 'react');
    expect(react?.count).toBe(2);
    expect(payload.topSkills.length).toBeLessThanOrEqual(10);
    for (let i = 1; i < payload.topSkills.length; i++) {
      expect(payload.topSkills[i - 1]!.count).toBeGreaterThanOrEqual(payload.topSkills[i]!.count);
    }
  });

  it('bucketises resumes by years of experience', async () => {
    const payload = await InsightsService.compute();
    const map = Object.fromEntries(payload.experienceBuckets.map((b) => [b.range, b.count]));
    expect(map['2-4 yrs']).toBe(1);
    expect(map['5-8 yrs']).toBe(1);
    expect(map['9+ yrs']).toBe(1);
    expect(map['0-1 yrs']).toBe(0);
  });

  it('normalises university names and drops the placeholder', async () => {
    RepoMock.countTotal.mockResolvedValue(2);
    RepoMock.countFailed.mockResolvedValue(0);
    RepoMock.findCompleted.mockResolvedValue([
      {
        skills: [],
        experience: 1,
        education: [{ school: 'Stanford University - 2018', degree: 'X', year: 2018 }],
        matchedRoles: [],
      },
      {
        skills: [],
        experience: 1,
        education: [{ school: 'Mentioned Institution', degree: 'X', year: null }],
        matchedRoles: [],
      },
    ]);

    const payload = await InsightsService.compute();
    expect(payload.topUniversities).toEqual([{ school: 'Stanford University', count: 1 }]);
  });

  it('averages role scores and counts strong matches (score >= 60)', async () => {
    const payload = await InsightsService.compute();
    const frontend = payload.roleScores.find((r) => r.roleName === 'Frontend Developer')!;
    expect(frontend.avgScore).toBe(50);
    expect(frontend.strongMatches).toBe(2);

    const backend = payload.roleScores.find((r) => r.roleName === 'Backend Developer')!;
    expect(backend.strongMatches).toBe(0);
  });

  it('returns zeros when there are no completed resumes', async () => {
    RepoMock.countTotal.mockResolvedValue(0);
    RepoMock.countFailed.mockResolvedValue(0);
    RepoMock.findCompleted.mockResolvedValue([]);

    const payload = await InsightsService.compute();
    expect(payload.avgExperience).toBe(0);
    expect(payload.completedResumes).toBe(0);
    expect(payload.topSkills).toEqual([]);
    for (const role of payload.roleScores) {
      expect(role.avgScore).toBe(0);
      expect(role.strongMatches).toBe(0);
    }
  });

  it('emits an ISO-8601 computedAt timestamp', async () => {
    const payload = await InsightsService.compute();
    expect(new Date(payload.computedAt).toString()).not.toBe('Invalid Date');
  });
});

describe('InsightsService.getSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the stored snapshot when one exists (without recomputing)', async () => {
    const stored = {
      totalResumes: 42,
      completedResumes: 40,
      failedResumes: 2,
      avgExperience: 4.5,
      topSkills: [{ skill: 'react', count: 30 }],
      topUniversities: [{ school: 'MIT', count: 10 }],
      experienceBuckets: [{ range: '0-1 yrs', count: 5 }],
      roleScores: [{ roleName: 'Frontend Developer', avgScore: 65, strongMatches: 20 }],
      computedAt: new Date('2024-06-01T12:00:00Z'),
    };
    RepoMock.getSnapshot.mockResolvedValue(stored);

    const payload = await InsightsService.getSnapshot();

    expect(payload.totalResumes).toBe(42);
    expect(payload.computedAt).toBe('2024-06-01T12:00:00.000Z');
    expect(RepoMock.countTotal).not.toHaveBeenCalled();
  });

  it('falls back to computeAndStore when nothing is cached yet', async () => {
    RepoMock.getSnapshot.mockResolvedValue(null);
    RepoMock.upsertSnapshot.mockResolvedValue(undefined);
    RepoMock.countTotal.mockResolvedValue(0);
    RepoMock.countFailed.mockResolvedValue(0);
    RepoMock.findCompleted.mockResolvedValue([]);

    const payload = await InsightsService.getSnapshot();

    expect(payload.completedResumes).toBe(0);
    expect(RepoMock.upsertSnapshot).toHaveBeenCalledTimes(1);
    const [update] = RepoMock.upsertSnapshot.mock.calls[0]!;
    expect(update.computedAt).toBeInstanceOf(Date);
  });
});
