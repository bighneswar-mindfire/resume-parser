import { execFile } from 'child_process';
import { promisify } from 'util';
import { createWorker } from 'tesseract.js';

const execFileAsync = promisify(execFile);

export class OcrService {
  private static nativeAvailable: boolean | null = null;

  private static async hasNativeTesseract(): Promise<boolean> {
    if (this.nativeAvailable !== null) return this.nativeAvailable;
    try {
      await execFileAsync('tesseract', ['--version']);
      this.nativeAvailable = true;
      console.log('[OCR] Using native tesseract binary.');
    } catch {
      this.nativeAvailable = false;
      console.log('[OCR] Native tesseract not found — falling back to tesseract.js (WASM).');
    }
    return this.nativeAvailable;
  }

  public static async extractTextFromImage(filePath: string): Promise<string> {
    if (await this.hasNativeTesseract()) {
      const { stdout } = await execFileAsync(
        'tesseract',
        [filePath, '-', '-l', 'eng', '--psm', '3'],
        { maxBuffer: 10 * 1024 * 1024 }
      );
      return stdout;
    }

    const worker = await createWorker('eng');

    const {
      data: { text },
    } = await worker.recognize(filePath);

    await worker.terminate();

    return text;
  }
}
