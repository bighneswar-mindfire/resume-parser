import type { ParsedResumeData } from '../services/nlpParser.js';

export function makeParsedResume(overrides: Partial<ParsedResumeData> = {}): ParsedResumeData {
  return {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 555 010 0100',
    skills: ['react', 'typescript', 'node.js'],
    experience: 5,
    education: [{ school: 'MIT', degree: 'B.Sc Computer Science', year: 2018 }],
    ...overrides,
  };
}

export const SAMPLE_FRONTEND_RESUME = `Jane Doe
jane.doe@example.com | +1 555 010 0100

Professional Summary
Frontend engineer with 5 years of experience building responsive SPAs.

Skills
JavaScript, TypeScript, React, Next.js, HTML, CSS, Git

Experience
Frontend Engineer — Acme Corp
Jan 2020 - Present
- Built the design system used by 30+ product teams.

Junior Developer — Foo Inc
Jun 2018 - Dec 2019
- Shipped bug fixes and small features.

Education
Massachusetts Institute of Technology
B.Sc Computer Science, 2018
`;

export const SAMPLE_BACKEND_RESUME = `John Smith
john.smith@company.io  |  +91 98765 43210

Summary
Backend engineer, 7 years of experience designing REST microservices.

Skills: Node.js, Express, PostgreSQL, MongoDB, Redis, Docker, Git

Experience
Backend Engineer — Widgets LLC
March 2018 - Present
- Built and maintained the payments API.

Education
Indian Institute of Technology, Bombay
B.Tech Computer Science, 2017
`;
