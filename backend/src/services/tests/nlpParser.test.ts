import { describe, it, expect } from 'vitest';
import { NlpParserService } from '../nlpParser.js';
import { SAMPLE_FRONTEND_RESUME, SAMPLE_BACKEND_RESUME } from '../../test/fixtures.js';

describe('NlpParserService.parse', () => {
  it('returns an empty result for empty input', () => {
    const parsed = NlpParserService.parse('');
    expect(parsed).toEqual({
      name: null,
      email: null,
      phone: null,
      skills: [],
      experience: 0,
      education: [],
    });
  });

  it('extracts email and phone from free-form text', () => {
    const parsed = NlpParserService.parse(SAMPLE_FRONTEND_RESUME);
    expect(parsed.email).toBe('jane.doe@example.com');
    expect(parsed.phone).not.toBeNull();
    expect(parsed.phone).toMatch(/555/);
  });

  it('returns null for email/phone when the resume has neither', () => {
    const parsed = NlpParserService.parse('Just some prose with no contact info.');
    expect(parsed.email).toBeNull();
    expect(parsed.phone).toBeNull();
  });

  it('extracts the candidate name from the top of the resume', () => {
    const parsed = NlpParserService.parse(SAMPLE_FRONTEND_RESUME);
    expect(parsed.name).toBe('Jane Doe');
  });

  it('picks up common frontend skills from the skills section', () => {
    const parsed = NlpParserService.parse(SAMPLE_FRONTEND_RESUME);
    expect(parsed.skills).toEqual(expect.arrayContaining(['react', 'typescript', 'javascript']));
  });

  it('handles inline "Skills: a, b, c" headers', () => {
    const parsed = NlpParserService.parse(SAMPLE_BACKEND_RESUME);
    expect(parsed.skills).toEqual(
      expect.arrayContaining(['node.js', 'express', 'postgresql', 'mongodb', 'redis', 'docker'])
    );
  });

  it('prefers explicit "N years of experience" over date-range math', () => {
    const parsed = NlpParserService.parse(
      'Summary\n10 years of experience in software engineering.\nExperience\n2020 - Present'
    );
    expect(parsed.experience).toBe(10);
  });

  it('computes experience from date ranges when no explicit total is stated', () => {
    const parsed = NlpParserService.parse(
      'Experience\nJunior Dev 2018 - 2019\nMid Dev 2019 - 2021'
    );
    expect(parsed.experience).toBeGreaterThanOrEqual(2);
    expect(parsed.experience).toBeLessThanOrEqual(4);
  });

  it('never returns a negative or absurdly high experience total', () => {
    const parsed = NlpParserService.parse(
      'Experience\nEngineer 2019 - Present\nEngineer 2020 - 2022'
    );
    expect(parsed.experience).toBeGreaterThanOrEqual(0);
    expect(parsed.experience).toBeLessThanOrEqual(40);
  });

  it('extracts an education entry with school, degree and year', () => {
    const parsed = NlpParserService.parse(SAMPLE_FRONTEND_RESUME);
    expect(parsed.education.length).toBeGreaterThan(0);
    const first = parsed.education[0]!;
    expect(first.school.toLowerCase()).toContain('massachusetts institute of technology');
    expect(first.degree).toMatch(/B\.?\s?Sc/i);
    expect(first.year).toBe(2018);
  });

  it('caps education entries at three', () => {
    const schools = Array.from({ length: 6 }, (_, i) => `University ${i + 1}\nB.Sc, 20${10 + i}`);
    const parsed = NlpParserService.parse(`Education\n${schools.join('\n')}`);
    expect(parsed.education.length).toBeLessThanOrEqual(3);
  });

  it('does not treat a role/title line as the candidate name', () => {
    const parsed = NlpParserService.parse(
      'Senior Software Engineer\nSarah Connor\nsarah@example.com'
    );
    expect(parsed.name).not.toMatch(/engineer/i);
    expect(parsed.name).toMatch(/Sarah/);
  });
});
