import { createWorker } from 'tesseract.js';

export class OcrService {
  public static async extractTextFromImage(filePath: string): Promise<string> {
    const worker = await createWorker('eng'); //english language

    const {
      data: { text },
    } = await worker.recognize(filePath);

    await worker.terminate();

    return text;
  }
}
