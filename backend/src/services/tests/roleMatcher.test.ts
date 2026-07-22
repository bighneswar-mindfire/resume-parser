import { describe, it, expect } from 'vitest';
import { RoleMatcherService, JOB_ROLES } from '../roleMatcher.js';
import { makeParsedResume } from '../../test/fixtures.js';

describe('RoleMatcherService.match', () => {
  it('returns every known role, sorted by score descending', () => {
    const parsed = makeParsedResume();
    const matches = RoleMatcherService.match(parsed, 'frontend engineer');

    expect(matches).toHaveLength(JOB_ROLES.length);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1]!.score).toBeGreaterThanOrEqual(matches[i]!.score);
    }
  });

  it('scores a frontend-heavy resume highest for the frontend role', () => {
    const parsed = makeParsedResume({
      skills: ['react', 'typescript', 'javascript', 'html', 'css', 'git'],
      experience: 4,
    });
    const rawText = 'Frontend engineer with responsive SPA experience';

    const matches = RoleMatcherService.match(parsed, rawText);

    expect(matches[0]!.roleName).toBe('Frontend Developer');
    expect(matches[0]!.score).toBeGreaterThan(50);
  });

  it('scores a backend resume highest for the backend role', () => {
    const parsed = makeParsedResume({
      skills: ['node.js', 'express', 'postgresql', 'redis', 'git'],
      experience: 6,
    });
    const rawText = 'Backend engineer building REST microservice APIs';

    const matches = RoleMatcherService.match(parsed, rawText);
    expect(matches[0]!.roleName).toBe('Backend Developer');
  });

  it('normalises variants so "nodejs" and "node.js" behave the same', () => {
    const dotted = RoleMatcherService.match(
      makeParsedResume({ skills: ['node.js', 'express'] }),
      'backend api'
    ).find((m) => m.roleName === 'Backend Developer')!;

    const plain = RoleMatcherService.match(
      makeParsedResume({ skills: ['nodejs', 'express'] }),
      'backend api'
    ).find((m) => m.roleName === 'Backend Developer')!;

    expect(plain.score).toBe(dotted.score);
  });

  it('gives the DevOps role a small boost when experience meets its minimum', () => {
    const parsed = makeParsedResume({
      skills: ['docker', 'kubernetes', 'jenkins', 'aws', 'terraform', 'git', 'python'],
      experience: 5,
    });
    const withExp = RoleMatcherService.match(parsed, 'devops sre infrastructure deployment').find(
      (m) => m.roleName === 'DevOps Engineer'
    )!;

    const noExpParsed = makeParsedResume({ ...parsed, experience: 0 });
    const withoutExp = RoleMatcherService.match(
      noExpParsed,
      'devops sre infrastructure deployment'
    ).find((m) => m.roleName === 'DevOps Engineer')!;

    expect(withExp.score).toBeGreaterThanOrEqual(withoutExp.score);
  });

  it('returns zero for a role when the resume has none of its skills or keywords', () => {
    const parsed = makeParsedResume({ skills: ['excel'], experience: 1 });
    const matches = RoleMatcherService.match(parsed, 'marketing manager');
    const dataEngineer = matches.find((m) => m.roleName === 'Data Engineer')!;
    expect(dataEngineer.score).toBe(0);
  });

  it('caps every score at 100', () => {
    const allSkills = JOB_ROLES.flatMap((r) => r.skillGroups.flatMap((g) => g.skills));
    const allKeywords = JOB_ROLES.flatMap((r) => Object.keys(r.keywords));
    const parsed = makeParsedResume({ skills: allSkills, experience: 10 });
    const matches = RoleMatcherService.match(parsed, allKeywords.join(' '));
    for (const m of matches) {
      expect(m.score).toBeLessThanOrEqual(100);
      expect(m.score).toBeGreaterThanOrEqual(0);
    }
  });
});
