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
const SKILLS_DICTIONARY = [
  'react',
  'node.js',
  'nodejs',
  'javascript',
  'typescript',
  'python',
  'java',
  'c++',
  'c',
  'go',
  'golang',
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
  'angular',
  'vue',
  'next.js',
  'nuxt.js',
  'ruby',
  'rails',
  'php',
  'laravel',
  'c#',
  '.net',
  'spring boot',
  'flask',
  'gcp',
  'azure',
  'jenkins',
  'ci/cd',
  'terraform',
  'graphql',
  'mysql',
  'sqlite',
  'mariadb',
  'elasticsearch',
  'rust',
  'scala',
  'swift',
  'kotlin',
];

const SECTION_HEADERS = {
  experience:
    /professional\s+experience|work\s+experience|experience|employment\s+history|history/i,
  education: /education|academic\s+background|academic\s+history/i,
  skills: /skills|technical\s+skills|technologies|proficiencies|expertise/i,
  summary: /summary|professional\s+summary|profile|about\s+me/i,
};

export class NlpParserService {
  public static parse(rawText: string): ParsedResumeData {
    if (!rawText) {
      return { name: null, email: null, phone: null, skills: [], experience: 0, education: [] };
    }

    const normalizedText = rawText.replace(/\r/g, '');
    const sections = this.partitionSections(normalizedText);
    const doc = nlp(normalizedText);

    const email = this.extractEmail(normalizedText);
    const phone = this.extractPhone(normalizedText);

    const name = this.extractName(doc, sections.header || normalizedText);
    const skills = this.extractSkills(sections.skills || normalizedText);
    const experience = this.calculateExperience(sections.experience || normalizedText);
    const education = this.extractEducation(sections.education || normalizedText);

    return { name, email, phone, skills, experience, education };
  }

  private static partitionSections(text: string): { [key: string]: string } {
    const lines = text.split('\n');
    const sections: { [key: string]: string[] } = {
      header: [], // Holds top portion containing name/contact info before any section headers
    };

    let currentSection = 'header';

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let matchedHeader = false;
      for (const [key, pattern] of Object.entries(SECTION_HEADERS)) {
        if (pattern.test(trimmedLine) && trimmedLine.length < 30) {
          currentSection = key;
          sections[currentSection] = [];
          matchedHeader = true;
          break;
        }
      }

      if (!matchedHeader) {
        let targetSection = sections[currentSection];
        if (!targetSection) {
          targetSection = [];
          sections[currentSection] = targetSection;
        }
        targetSection.push(line);
      }
    });

    const flattened: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(sections)) {
      if (value) {
        flattened[key] = value.join('\n');
      }
    }
    return flattened;
  }

  //name extract
  private static extractName(doc: ReturnType<typeof nlp>, headerText: string): string | null {
    const lines = headerText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const candidateLines = lines.slice(0, 3);
    for (const line of candidateLines) {
      const words = line.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !line.includes('www') &&
        !/[0-9]/.test(line) &&
        !/linkedin|leetcode|github|behance|portfolio|resume|cv|curriculum|email|phone|address|india|usa|odisha/i.test(
          line
        )
      ) {
        const isCapitalized = words.every((word) => {
          const firstChar = word.charAt(0);
          return firstChar === firstChar.toUpperCase() && /[a-zA-Z]/.test(firstChar);
        });
        if (isCapitalized) {
          return line;
        }
      }
    }

    const compromiseName = doc.people().first().text()?.trim();
    if (
      compromiseName &&
      compromiseName.split(' ').length >= 2 &&
      compromiseName.split(' ').length <= 3
    ) {
      if (
        !/engineer|developer|analyst|manager|consultant|resume|linkedin|leetcode|github/i.test(
          compromiseName
        )
      ) {
        return compromiseName;
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

  //phone
  private static extractPhone(rawText: string): string | null {
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}/;
    const match = rawText.match(phoneRegex);
    return match ? match[0] : null;
  }

  //skills
  private static extractSkills(skillsText: string): string[] {
    const foundSkills = new Set<string>();

    const normalizedText = ` ${skillsText.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ')} `;

    SKILLS_DICTIONARY.forEach((skill) => {
      const escapedSkill = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

      const skillRegex = new RegExp(
        `(?<=^|[^a-zA-Z0-9+#.-])${escapedSkill}(?=$|[^a-zA-Z0-9+#.-])`,
        'i'
      );

      if (skillRegex.test(normalizedText)) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  //experience
  private static calculateExperience(experienceText: string): number {
    const explicitPatterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i,
      /experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
      /(?:total\s*of\s*)?(\d+)\+?\s*(?:years?|yrs?)\s*in/i,
    ];

    for (const pattern of explicitPatterns) {
      const match = experienceText.match(pattern);
      if (match) {
        const matchedYears = match[1];
        if (matchedYears) {
          const years = parseInt(matchedYears, 10);
          if (!isNaN(years) && years < 50) return years;
        }
      }
    }

    const dateRangePattern =
      /\b(19\d{2}|20\d{2})\b\s*[-–—to\s]+\s*\b(19\d{2}|20\d{2}|present|current)\b/gi;
    let totalYears = 0;
    let match;

    while ((match = dateRangePattern.exec(experienceText)) !== null) {
      const startYearStr = match[1];
      const endYearStr = match[2];

      if (startYearStr) {
        const startYear = parseInt(startYearStr, 10);
        let endYear = new Date().getFullYear();

        if (endYearStr && !/present|current/i.test(endYearStr)) {
          const parsedEnd = parseInt(endYearStr, 10);
          if (!isNaN(parsedEnd)) endYear = parsedEnd;
        }

        const duration = endYear - startYear;
        if (duration > 0 && duration < 15) {
          totalYears += duration;
        }
      }
    }

    return totalYears > 0 ? Math.min(totalYears, 40) : 0;
  }

  //education
  private static extractEducation(
    educationText: string
  ): Array<{ school: string; degree: string; year: number | null }> {
    const educationEntries: Array<{ school: string; degree: string; year: number | null }> = [];

    const lines = educationText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const degreePatterns = [
      /B\.?S(?:c)?\.?\s*in/i,
      /M\.?S(?:c)?\.?\s*in/i,
      /Bachelor\s*(?:of)?/i,
      /Master\s*(?:of)?/i,
      /Ph\.?D\.?/i,
      /B\.?Tech\.?/i,
      /M\.?Tech\.?/i,
      /Associate\s*(?:of)?/i,
      /Degree/i,
    ];

    let currentSchool: string | null = null;
    let currentDegree: string | null = null;
    let currentYear: number | null = null;

    lines.forEach((line) => {
      const hasSchoolKeyword = /university|college|institute|academy|school/i.test(line);

      let matchedDegree: string | null = null;
      for (const pattern of degreePatterns) {
        if (pattern.test(line)) {
          matchedDegree = line;
          break;
        }
      }

      if (hasSchoolKeyword && currentSchool) {
        educationEntries.push({
          school: currentSchool,
          degree: currentDegree || 'Degree Info',
          year: currentYear,
        });

        currentSchool = null;
        currentDegree = null;
        currentYear = null;
      }

      if (hasSchoolKeyword) {
        currentSchool = line;
      } else if (matchedDegree) {
        currentDegree = line;
      }

      const parsedDates = chrono.parse(line);
      const firstParsedDate = parsedDates[0];

      if (firstParsedDate && firstParsedDate.start) {
        const year = firstParsedDate.start.get('year');
        if (year) {
          currentYear = year;
        }
      } else {
        const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch && yearMatch[1]) {
          currentYear = parseInt(yearMatch[1], 10);
        }
      }
    });

    if (currentSchool) {
      educationEntries.push({
        school: currentSchool,
        degree: currentDegree || 'Degree Info',
        year: currentYear,
      });
    } else if (currentDegree) {
      educationEntries.push({
        school: 'Mentioned Institution',
        degree: currentDegree,
        year: currentYear,
      });
    }

    return educationEntries.slice(0, 3);
  }
}
