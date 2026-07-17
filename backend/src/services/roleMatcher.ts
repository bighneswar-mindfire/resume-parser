import { ParsedResumeData } from './nlpParser.js';

export interface RoleMatch {
  roleName: string;
  score: number;
}

interface SkillGroup {
  weight: number;
  skills: string[];
}

interface JobRole {
  name: string;
  skillGroups: SkillGroup[];
  keywords: Record<string, number>;
  minExperience?: number;
}

export const JOB_ROLES: JobRole[] = [
  {
    name: 'Frontend Developer',
    skillGroups: [
      { weight: 3, skills: ['react', 'angular', 'vue', 'next.js', 'nuxt.js'] },
      { weight: 3, skills: ['javascript', 'typescript'] },
      { weight: 2, skills: ['html'] },
      { weight: 2, skills: ['css'] },
      { weight: 1, skills: ['graphql'] },
      { weight: 1, skills: ['git'] },
    ],
    keywords: { frontend: 2, 'front-end': 2, 'front end': 2, ui: 1, responsive: 1, spa: 1 },
  },
  {
    name: 'Backend Developer',
    skillGroups: [
      {
        weight: 3,
        skills: ['node.js', 'nodejs', 'python', 'java', 'go', 'golang', 'ruby', 'php', 'c#'],
      },
      {
        weight: 3,
        skills: [
          'express',
          'django',
          'fastapi',
          'nest.js',
          'spring boot',
          'flask',
          'rails',
          'laravel',
          '.net',
        ],
      },
      { weight: 3, skills: ['sql', 'postgresql', 'mysql', 'mongodb', 'sqlite', 'mariadb'] },
      { weight: 1, skills: ['redis'] },
      { weight: 1, skills: ['graphql'] },
      { weight: 1, skills: ['git'] },
    ],
    keywords: { backend: 2, 'back-end': 2, 'back end': 2, api: 1, microservice: 2, rest: 1 },
  },
  {
    name: 'Full Stack Developer',
    skillGroups: [
      { weight: 3, skills: ['react', 'angular', 'vue', 'next.js'] },
      { weight: 3, skills: ['node.js', 'nodejs', 'express', 'nest.js'] },
      { weight: 2, skills: ['javascript', 'typescript'] },
      { weight: 2, skills: ['sql', 'postgresql', 'mysql', 'mongodb'] },
      { weight: 1, skills: ['html', 'css'] },
      { weight: 1, skills: ['git'] },
    ],
    keywords: { 'full stack': 2, 'full-stack': 2, fullstack: 2, mern: 2, mean: 1 },
  },
  {
    name: 'DevOps Engineer',
    skillGroups: [
      { weight: 3, skills: ['docker'] },
      { weight: 3, skills: ['kubernetes'] },
      { weight: 3, skills: ['ci/cd', 'jenkins'] },
      { weight: 2, skills: ['aws', 'gcp', 'azure'] },
      { weight: 2, skills: ['terraform'] },
      { weight: 1, skills: ['python', 'go', 'golang'] },
      { weight: 1, skills: ['git'] },
    ],
    keywords: { devops: 3, infrastructure: 2, deployment: 1, monitoring: 1, sre: 2 },
    minExperience: 1,
  },
  {
    name: 'Data Engineer',
    skillGroups: [
      { weight: 3, skills: ['python', 'scala', 'java'] },
      { weight: 3, skills: ['sql', 'postgresql', 'mysql'] },
      { weight: 2, skills: ['elasticsearch', 'mongodb'] },
      { weight: 1, skills: ['aws', 'gcp', 'azure'] },
    ],
    keywords: {
      'data pipeline': 3,
      etl: 3,
      'data warehouse': 2,
      spark: 2,
      kafka: 2,
      airflow: 2,
      'big data': 2,
    },
  },
];

export class RoleMatcherService {
  public static match(parsed: ParsedResumeData, rawText: string): RoleMatch[] {
    //for making node.js and nodejs same
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, '');
    const resumeSkills = new Set(parsed.skills.map(normalize));
    const lowerText = rawText.toLowerCase();

    return JOB_ROLES.map((role) => {
      let matchedWeight = 0;
      let totalWeight = 0;

      for (const group of role.skillGroups) {
        totalWeight += group.weight;
        if (group.skills.some((skill) => resumeSkills.has(normalize(skill)))) {
          matchedWeight += group.weight;
        }
      }

      for (const [keyword, weight] of Object.entries(role.keywords)) {
        totalWeight += weight;
        const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        if (new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i').test(lowerText)) {
          matchedWeight += weight;
        }
      }

      let score = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

      if (role.minExperience !== undefined && parsed.experience >= role.minExperience) {
        score = Math.min(100, score * 1.1);
      }

      return { roleName: role.name, score: Math.round(score) };
    }).sort((a, b) => b.score - a.score);
  }
}
