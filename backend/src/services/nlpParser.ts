import nlp from 'compromise';
import * as chrono from 'chrono-node';

export interface ParsedResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: number;
  education: Array<{ school: string; degree: string; year: number | null }>;
}

//technical skills.
const SKILLS_DICTIONARY = [
  'react',
  'node.js',
  'nodejs',
  'javascript',
  'typescript',
  'python',
  'java',
  'c++',
  'sql',
  'postgresql',
  'mongodb',
  'docker',
  'kubernetes',
  'aws',
  'git',
  'html',
  'css',
  'graphql',
  'express',
  'django',
  'fastapi',
  'nest.js',
  'redis',
];

//degree
const DEGREE_PATTERNS = [
  /B\.?S(?:c)?\.?\s*in/i,
  /M\.?S(?:c)?\.?\s*in/i,
  /Bachelor\s*(?:of)?/i,
  /Master\s*(?:of)?/i,
  /Ph\.?D\.?/i,
  /B\.?Tech\.?/i,
  /M\.?Tech\.?/i,
  /Associate\s*(?:of)?/i,
];

export class NlpParserService {
  public static parse(rawText: string): ParsedResumeData {
    if (!rawText) {
      return { name: null, email: null, phone: null, skills: [], experience: 0, education: [] };
    }

    const doc = nlp(rawText);

    return {
      name: this.extractName(doc, rawText),
      email: this.extractEmail(rawText),
      phone: this.extractPhone(rawText),
      skills: this.extractSkills(rawText),
      experience: this.estimateExperience(rawText),
      education: this.extractEducation(rawText),
    };
  }

  //name
  private static extractName(doc: ReturnType<typeof nlp>, rawText: string): string | null {
    const compromiseName = doc.people().first().text()?.trim();
    if (compromiseName && compromiseName.split(' ').length >= 2) {
      return compromiseName;
    }

    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 0) {
      const candidateLine = lines[0];
      if (candidateLine && !candidateLine.includes('@') && candidateLine.split(' ').length <= 4) {
        return candidateLine;
      }
    }

    return null;
  }

  //email
  private static extractEmail(rawText: string): string | null {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = rawText.match(emailRegex);
    return match ? match[0] : null;
  }

  //email
  private static extractPhone(rawText: string): string | null {
    const phoneRegex = /[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,10}/;
    const match = rawText.match(phoneRegex);
    return match ? match[0] : null;
  }

  //skills
  private static extractSkills(rawText: string): string[] {
    const foundSkills = new Set<string>();
    const normalizedText = ` ${rawText.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ')} `;

    SKILLS_DICTIONARY.forEach((skill) => {
      const escapedSkill = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const skillRegex = new RegExp(`\\s${escapedSkill}\\s`, 'i');
      if (skillRegex.test(normalizedText)) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  //experience
  private static estimateExperience(rawText: string): number {
    const patterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i,
      /experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
      /(?:total\s*of\s*)?(\d+)\+?\s*(?:years?|yrs?)\s*in/i,
    ];

    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match) {
        const matchedYears = match[1];
        if (matchedYears) {
          const years = parseInt(matchedYears, 10);
          if (!isNaN(years) && years < 50) {
            return years;
          }
        }
      }
    }

    return 0;
  }

  //education
  private static extractEducation(
    rawText: string
  ): Array<{ school: string; degree: string; year: number | null }> {
    const educationEntries: Array<{ school: string; degree: string; year: number | null }> = [];
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    lines.forEach((line) => {
      let matchedDegree: string | null = null;
      for (const pattern of DEGREE_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          matchedDegree = line;
          break;
        }
      }

      const hasSchoolKeyword = /university|college|institute|academy|school/i.test(line);

      if (matchedDegree || hasSchoolKeyword) {
        const parsedDates = chrono.parse(line);
        let graduationYear: number | null = null;

        const firstParsedDate = parsedDates[0];

        if (firstParsedDate && firstParsedDate.start) {
          const year = firstParsedDate.start.get('year');
          if (year) {
            graduationYear = year;
          }
        } else {
          const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
          if (yearMatch && yearMatch[1]) {
            graduationYear = parseInt(yearMatch[1], 10);
          }
        }

        educationEntries.push({
          school: hasSchoolKeyword ? line : 'Mentioned Institution',
          degree: matchedDegree ? matchedDegree.substring(0, 100) : 'Degree Info',
          year: graduationYear,
        });
      }
    });

    return educationEntries.slice(0, 3);
  }
}
