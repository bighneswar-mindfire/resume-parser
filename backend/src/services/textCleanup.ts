const COLUMN_HEADER_HINT =
  /^(?:skills|education|experience|summary|profile|objective|projects|certifications|contact)\b/im;

export class TextCleanupService {
  public static cleanOcrText(text: string): string {
    let cleaned = text.replace(/\r/g, '');

    cleaned = cleaned
      .split('\n')
      .map((line) => this.collapseSpacedLetters(line))
      .join('\n');

    // joins emails broken by spaces
    cleaned = cleaned.replace(
      /([a-zA-Z0-9._%+-]+)[ \t]*@[ \t]*([a-zA-Z0-9-]+(?:[ \t]*\.[ \t]*[a-zA-Z0-9-]+)*[ \t]*\.[ \t]*[a-zA-Z]{2,})/g,
      (_m, user, domain) => `${user}@${(domain as string).replace(/[ \t]/g, '')}`
    );

    //fix digit/letter confusions
    cleaned = cleaned.replace(/\b[A-Za-z0-9]*[0l1][A-Za-z0-9]*\b/g, (word) => {
      const letters = (word.match(/[A-Za-z]/g) || []).length;
      if (letters < 2) return word;
      const uppers = (word.match(/[A-Z]/g) || []).length;
      const isUpperWord = letters >= 3 && uppers >= letters - 1;

      if (isUpperWord) {
        return word.replace(/l/g, 'I').replace(/0/g, 'O').replace(/1/g, 'I');
      }
      return word
        .replace(/(?<=[A-Za-z])0|0(?=[A-Za-z])/g, 'o')
        .replace(/(?<=[A-Za-z])1|1(?=[A-Za-z])/g, 'i');
    });

    // fix l and 1
    cleaned = cleaned.replace(/\bln\b/g, 'In').replace(/\blnc\b/g, 'Inc');

    return this.stripPageMarkers(cleaned);
  }

  // Cleanup pdf text
  public static cleanPdfText(text: string): string {
    return this.reconstructColumns(this.stripPageMarkers(text.replace(/\r/g, '')));
  }

  // Remove"-- 1 of 2 --".
  public static stripPageMarkers(text: string): string {
    return text.replace(/^\s*-+\s*(?:page\s+)?\d+\s+of\s+\d+\s*-+\s*$/gim, '');
  }

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

  //join words that splits into single spaced letters.
  private static collapseSpacedLetters(line: string): string {
    const tokens = line.trim().split(/\s+/);
    const isSpacedOut =
      tokens.length >= 5 && tokens.every((t) => t.length === 1 && /[a-zA-Z]/.test(t));

    if (!isSpacedOut) return line;

    return line
      .trim()
      .split(/\s{2,}/)
      .map((word) => word.replace(/\s+/g, ''))
      .join(' ');
  }
}
