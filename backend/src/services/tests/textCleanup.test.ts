import { describe, it, expect } from 'vitest';
import { TextCleanupService } from '../textCleanup.js';

describe('TextCleanupService', () => {
  describe('cleanOcrText', () => {
    it('removes carriage returns', () => {
      expect(TextCleanupService.cleanOcrText('hello\r\nworld')).toBe('hello\nworld');
    });

    it('rejoins emails split by whitespace inside the domain', () => {
      const input = 'contact: jane.doe @ example . com';
      expect(TextCleanupService.cleanOcrText(input)).toContain('jane.doe@example.com');
    });

    it('collapses lines that are just single spaced-out letters back into words', () => {
      const input = 'J A N E   D O E';
      const cleaned = TextCleanupService.cleanOcrText(input);
      // The single-letter tokens should be joined back into contiguous words.
      expect(cleaned).toBe('JANE DOE');
    });

    it('leaves normal prose untouched when no spaced-out block is present', () => {
      const input = 'A quick brown fox jumps.';
      expect(TextCleanupService.cleanOcrText(input)).toBe('A quick brown fox jumps.');
    });

    it('normalises the classic "ln"/"lnc" OCR mistakes to In/Inc', () => {
      const input = 'Worked at Acme lnc from ln March 2020';
      const cleaned = TextCleanupService.cleanOcrText(input);
      expect(cleaned).toContain('Inc');
      expect(cleaned).toContain('In');
    });

    it('fixes digit/letter confusions inside all-uppercase words', () => {
      const input = 'Skills: REACT0';
      const cleaned = TextCleanupService.cleanOcrText(input);
      expect(cleaned).toMatch(/REACTO/);
    });

    it('strips "-- 1 of 3 --" page markers', () => {
      const input = 'body\n-- 1 of 3 --\nmore body';
      const cleaned = TextCleanupService.cleanOcrText(input);
      expect(cleaned).not.toMatch(/1 of 3/);
    });
  });

  describe('cleanPdfText', () => {
    it('replaces tab characters with double spaces when the doc is mostly single-column', () => {
      const input = 'Name\tJane\nSummary\tHello';
      const cleaned = TextCleanupService.cleanPdfText(input);
      expect(cleaned).not.toContain('\t');
      expect(cleaned).toContain('  ');
    });

    it('reconstructs a two-column layout when a right column looks like section headers', () => {
      const input =
        'Jane Doe\tSkills\n' +
        'jane@example.com\tReact, TypeScript\n' +
        'Some City\tExperience\n' +
        'phone\tFrontend Engineer at Acme';
      const cleaned = TextCleanupService.cleanPdfText(input);
      const lines = cleaned.split('\n');

      const idxLeft = lines.indexOf('Jane Doe');
      const idxRight = lines.indexOf('Skills');
      expect(idxLeft).toBeGreaterThanOrEqual(0);
      expect(idxRight).toBeGreaterThan(idxLeft);
    });

    it('strips page markers from PDF text too', () => {
      const cleaned = TextCleanupService.cleanPdfText('foo\n-- Page 2 of 4 --\nbar');
      expect(cleaned).not.toMatch(/Page 2 of 4/);
    });
  });
});
