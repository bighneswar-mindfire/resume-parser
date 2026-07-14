import { NlpParserService } from './services/nlpParser.js';

const mockResumeText = `
John Doe
Software Engineer
john.doe@example.com | (123) 456-7890

SUMMARY
Fullstack engineer with 6+ years of experience working with React, Node.js, and SQL. 

EDUCATION
Bachelor of Science in Computer Science - Boston University (Graduated 2020)

TECHNICAL SKILLS
TypeScript, React, Node.js, Docker, MongoDB
`;

const parsed = NlpParserService.parse(mockResumeText);
console.log('Parsed Output Result:\n', JSON.stringify(parsed, null, 2));
