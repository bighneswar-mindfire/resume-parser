import { ParsedResume } from '../components/resumes/types';

/** Build a fully-populated resume, overriding any fields per test. */
export function makeResume(overrides: Partial<ParsedResume> = {}): ParsedResume {
  return {
    _id: 'abc123',
    fileName: 'jane_doe_resume.pdf',
    status: 'COMPLETED',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 555 0100',
    skills: ['React', 'TypeScript', 'Node.js'],
    experience: 5,
    education: [{ school: 'MIT', degree: 'BSc Computer Science', year: 2018 }],
    matchedRoles: [
      { roleName: 'Frontend Developer', score: 82 },
      { roleName: 'Full Stack Developer', score: 40 },
    ],
    createdAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}
