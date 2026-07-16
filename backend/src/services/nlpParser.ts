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
    /^(?:professional\s+|work\s+|relevant\s+)?experience\b|^employment(?:\s+history)?\b|^work\s+history\b/i,
  education: /^education\b|^academic\s+(?:background|history|qualifications?)\b/i,
  skills:
    /^(?:technical\s+|key\s+|core\s+)?skills\b|^(?:technologies|proficiencies|expertise)\b|^tech(?:nical)?\s+stack\b/i,
  summary: /^(?:professional\s+|career\s+)?summary\b|^profile\b|^about(?:\s+me)?\b|^objective\b/i,
};

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
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

    const name = this.extractName(doc, sections.header || normalizedText, email);
    const skills = this.extractSkills(sections.skills || normalizedText);
    const experience = this.calculateExperience(
      sections.experience || normalizedText,
      normalizedText
    );
    const education = this.extractEducation(sections.education || normalizedText);

    return { name, email, phone, skills, experience, education };
  }

  private static partitionSections(text: string): { [key: string]: string } {
    const lines = text.split('\n');
    const sections: { [key: string]: string[] } = {
      header: [],
    };

    let currentSection = 'header';

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Strip decorations
      const undecorated = trimmedLine.replace(/^[=\-*#_~\s]+|[=\-*#_~\s]+$/g, '');

      let matchedHeader = false;
      for (const [key, pattern] of Object.entries(SECTION_HEADERS)) {
        if (pattern.test(undecorated) && undecorated.length < 40) {
          currentSection = key;
          const headerSection = sections[currentSection] || [];
          sections[currentSection] = headerSection;
          matchedHeader = true;

          // Inline header like "Skills: java, sql" — keep the content after the colon
          const colonIndex = undecorated.indexOf(':');
          if (colonIndex !== -1) {
            const inlineContent = undecorated.slice(colonIndex + 1).trim();
            if (inlineContent) {
              headerSection.push(inlineContent);
            }
          }
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
  private static extractName(
    doc: ReturnType<typeof nlp>,
    headerText: string,
    email: string | null
  ): string | null {
    const lines = headerText
      .split('\n')
      .map((l) => (l.split('\t')[0] || '').trim())
      .map((l) =>
        l
          .replace(
            /\s+(?:skills?|experience|education|summary|profile|objective|projects?|contact)\s*$/i,
            ''
          )
          .trim()
      )
      .filter((l) => l.length > 0);

    const candidateLines = lines.slice(0, 4);
    const candidates: string[] = [];

    for (const line of candidateLines) {
      const words = line.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !line.includes('www') &&
        !/[0-9]/.test(line) &&
        !/[,|:;()/]/.test(line) &&
        !/linkedin|leetcode|github|behance|portfolio|resume|\bcv\b|curriculum|vitae|email|phone|mobile|address|engineer|developer|analyst|manager|consultant|architect|scientist|designer|intern\b/i.test(
          line
        )
      ) {
        const isCapitalized = words.every((word) => {
          const firstChar = word.charAt(0);
          return firstChar === firstChar.toUpperCase() && /[a-zA-Z]/.test(firstChar);
        });
        if (isCapitalized) {
          candidates.push(line);
        }
      }
    }

    if (email && candidates.length > 0) {
      const localPart = (email.split('@')[0] || '').toLowerCase();
      const corroborated = candidates.find((c) =>
        c
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.length >= 3 && localPart.includes(w))
      );
      if (corroborated) return corroborated;
    }

    if (candidates.length > 0 && candidates[0]) {
      return candidates[0];
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
  private static calculateExperience(experienceText: string, fullText?: string): number {
    const explicitPatterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i,
      /experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
      /(?:total\s*of\s*)?(\d+)\+?\s*(?:years?|yrs?)\s*in/i,
    ];

    const explicitSource = fullText || experienceText;
    for (const pattern of explicitPatterns) {
      const match = explicitSource.match(pattern);
      if (match) {
        const matchedYears = match[1];
        if (matchedYears) {
          const years = parseInt(matchedYears, 10);
          if (!isNaN(years) && years < 50) return years;
        }
      }
    }

    // experience count
    const monthName = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
    const dateRangePattern = new RegExp(
      `\\b(?:(${monthName})[.,]?\\s+)?(19\\d{2}|20\\d{2})\\s*(?:[-–—~]|to|until)\\s*(?:(?:(${monthName})[.,]?\\s+)?(19\\d{2}|20\\d{2})|(present|current|now|till\\s+date))\\b`,
      'gi'
    );

    const now = new Date();
    const nowMonths = now.getFullYear() * 12 + now.getMonth();
    const intervals: Array<[number, number]> = [];
    let match;

    while ((match = dateRangePattern.exec(experienceText)) !== null) {
      const [, startMonthStr, startYearStr, endMonthStr, endYearStr, presentStr] = match;
      if (!startYearStr) continue;

      const startYear = parseInt(startYearStr, 10);
      const startMonth = startMonthStr
        ? (MONTH_INDEX[startMonthStr.slice(0, 3).toLowerCase()] ?? 0)
        : 0;
      const start = startYear * 12 + startMonth;

      let end: number;
      if (presentStr || !endYearStr) {
        end = nowMonths;
      } else {
        const endYear = parseInt(endYearStr, 10);
        const endMonth = endMonthStr
          ? (MONTH_INDEX[endMonthStr.slice(0, 3).toLowerCase()] ?? 11)
          : 11;
        end = endYear * 12 + endMonth + 1;
      }

      const durationMonths = end - start;
      if (durationMonths > 0 && durationMonths < 15 * 12) {
        intervals.push([start, Math.min(end, nowMonths)]);
      }
    }

    if (intervals.length === 0) return 0;

    intervals.sort((a, b) => a[0] - b[0]);
    let totalMonths = 0;
    let [curStart, curEnd] = intervals[0] as [number, number];

    for (let i = 1; i < intervals.length; i++) {
      const [nextStart, nextEnd] = intervals[i] as [number, number];
      if (nextStart <= curEnd) {
        curEnd = Math.max(curEnd, nextEnd);
      } else {
        totalMonths += curEnd - curStart;
        curStart = nextStart;
        curEnd = nextEnd;
      }
    }
    totalMonths += curEnd - curStart;

    const totalYears = Math.round(totalMonths / 12);
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
      /\bB\.?\s?Sc\.?\b/i,
      /\bM\.?\s?Sc\.?\b/i,
      /\bB\.?\s?S\.?(?:\s+in\b|\s*,|\s*$)/i,
      /\bM\.?\s?S\.?(?:\s+in\b|\s*,|\s*$)/i,
      /\bBachelor(?:'?s)?\b/i,
      /\bMaster(?:'?s)?\b/i,
      /\bPh\.?\s?D\.?\b/i,
      /\bB\.?\s?Tech\b/i,
      /\bM\.?\s?Tech\b/i,
      /\bB\.?\s?E\.?(?:\s+in\b|\s*,|\s*$)/i,
      /\bM\.?\s?E\.?(?:\s+in\b|\s*,|\s*$)/i,
      /\bBCA\b/i,
      /\bMCA\b/i,
      /\bBBA\b/i,
      /\bMBA\b/i,
      /\bB\.?\s?Com\b/i,
      /\bM\.?\s?Com\b/i,
      /\bAssociate\s*(?:of|degree)\b/i,
      /\bDiploma\b/i,
      /\bDoctorate\b/i,
      /\bDegree\b/i,
    ];

    let currentSchool: string | null = null;
    let currentDegree: string | null = null;
    let currentYear: number | null = null;

    const flushEntry = () => {
      if (currentSchool || currentDegree) {
        educationEntries.push({
          school: currentSchool || 'Mentioned Institution',
          degree: currentDegree || 'Degree Info',
          year: currentYear,
        });
      }
      currentSchool = null;
      currentDegree = null;
      currentYear = null;
    };

    lines.forEach((line) => {
      const hasSchoolKeyword = /university|college|institute|academy|school|iit\b|nit\b/i.test(
        line
      );
      const hasDegree = degreePatterns.some((pattern) => pattern.test(line));

      // A new school or degree line while we already hold one of that kind → previous entry is complete
      if ((hasSchoolKeyword && currentSchool) || (hasDegree && currentDegree)) {
        flushEntry();
      }

      if (hasSchoolKeyword) {
        currentSchool = line;
      }
      if (hasDegree) {
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

    flushEntry();

    return educationEntries.slice(0, 3);
  }
}
