/**
 * Cleans raw extracted text before NLP parsing.
 * - OCR artifact repair (letter-spaced words, digit/letter confusions, broken emails)
 * - Two-column PDF reconstruction from tab-separated cells (pdf-parse cellSeparator)
 * - Page marker removal
 */

// Light-weight header check used to decide if tab cells form a real second column
const COLUMN_HEADER_HINT =
  /^(?:skills|education|experience|summary|profile|objective|projects|certifications|contact)\b/im;

export class TextCleanupService {
  /** Full cleanup for OCR (tesseract) output. */
  public static cleanOcrText(text: string): string {
    let cleaned = text.replace(/\r/g, '');

    // Re-join letter-spaced words: "M a r i a   G o n z a l e z" -> "Maria Gonzalez"
    cleaned = cleaned
      .split('\n')
      .map((line) => this.collapseSpacedLetters(line))
      .join('\n');

    // Re-join emails broken by stray spaces: "maria.gonzalez@ hotmail.com"
    cleaned = cleaned.replace(
      /([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9-]+)\s*\.\s*([a-zA-Z][a-zA-Z\s.]{1,10}[a-zA-Z])/g,
      (_m, user, domain, tld) => `${user}@${domain}.${tld.replace(/\s+/g, '')}`
    );

    // Fix digit/letter OCR confusions inside alphabetic words:
    // W0RK -> WORK, EXPERlENCE -> EXPERIENCE, Ph0ne -> Phone, Un1versity -> University
    cleaned = cleaned.replace(/\b[A-Za-z0-9]*[0l1][A-Za-z0-9]*\b/g, (word) => {
      const letters = (word.match(/[A-Za-z]/g) || []).length;
      if (letters < 2) return word; // codes/numbers, leave alone

      const uppers = (word.match(/[A-Z]/g) || []).length;
      const isUpperWord = letters >= 3 && uppers >= letters - 1;

      if (isUpperWord) {
        return word.replace(/l/g, 'I').replace(/0/g, 'O').replace(/1/g, 'I');
      }
      // lowercase/mixed word: only fix 0/1 when flanked by letters
      return word
        .replace(/(?<=[A-Za-z])0|0(?=[A-Za-z])/g, 'o')
        .replace(/(?<=[A-Za-z])1|1(?=[A-Za-z])/g, 'i');
    });

    // Common whole-word confusions: "ln Computer Science" -> "In", "WebWorks lnc." -> "Inc"
    cleaned = cleaned.replace(/\bln\b/g, 'In').replace(/\blnc\b/g, 'Inc');

    return this.stripPageMarkers(cleaned);
  }

  /** Cleanup for PDF-extracted text: page markers + column reconstruction. */
  public static cleanPdfText(text: string): string {
    return this.reconstructColumns(this.stripPageMarkers(text.replace(/\r/g, '')));
  }

  /** Remove pdf-parse page joiners like "-- 1 of 2 --". */
  public static stripPageMarkers(text: string): string {
    return text.replace(/^\s*-+\s*(?:page\s+)?\d+\s+of\s+\d+\s*-+\s*$/gim, '');
  }

  /**
   * Reconstruct a two-column layout from tab-separated cells.
   * pdf-parse inserts "\t" between text items with a large horizontal gap, so a
   * two-column resume line arrives as "leftCellText\trightCellText". Splitting the
   * cells into two streams and concatenating left-then-right restores reading order.
   * Only applied when enough lines are tabbed AND the right stream contains a
   * section header — otherwise tabs are more likely simple alignment (e.g. dates).
   */
  public static reconstructColumns(text: string): string {
    const lines = text.split('\n');
    const tabbedCount = lines.filter((l) => l.includes('\t')).length;
    if (tabbedCount < 3 || tabbedCount / Math.max(lines.length, 1) < 0.3) {
      return text.replace(/\t/g, '  ');
    }

    const left: string[] = [];
    const right: string[] = [];
    for (const line of lines) {
      const cells = line.split('\t').map((c) => c.trim());
      const firstCell = cells[0];
      if (firstCell) left.push(firstCell);
      const rest = cells.slice(1).filter(Boolean).join(' ');
      if (rest) right.push(rest);
    }

    if (!COLUMN_HEADER_HINT.test(right.join('\n'))) {
      return text.replace(/\t/g, '  ');
    }

    return [...left, '', ...right].join('\n');
  }

  /** Re-join words that OCR split into single spaced letters. */
  private static collapseSpacedLetters(line: string): string {
    const tokens = line.trim().split(/\s+/);
    const isSpacedOut =
      tokens.length >= 5 && tokens.every((t) => t.length === 1 && /[a-zA-Z]/.test(t));

    if (!isSpacedOut) return line;

    // 2+ spaces separate words, single spaces are intra-word gaps
    return line
      .trim()
      .split(/\s{2,}/)
      .map((word) => word.replace(/\s+/g, ''))
      .join(' ');
  }
}
