import { Worker, Job, QueueOptions } from 'bullmq';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { redisConnection } from '../config/redis.js';
import { Resume } from '../models/Resume.js';
import { OcrService } from '../services/ocrService.js';
import { TextCleanupService } from '../services/textCleanup.js';
import { parserQueue, OcrJobData } from '../queues/queueSetup.js';

export const ocrWorker = new Worker<OcrJobData>(
  'ocr-queue',
  async (job: Job<OcrJobData>) => {
    const { resumeId, filePath, mimetype, originalName } = job.data;

    try {
      await Resume.findByIdAndUpdate(resumeId, { status: 'PROCESSING' });

      let rawText = '';

      if (mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfParser = new PDFParse({ data: new Uint8Array(dataBuffer) });
        try {
          // pageJoiner '' drops the default "-- 1 of 2 --" page markers
          const parsedPdf = await pdfParser.getText({ pageJoiner: '' });
          rawText = TextCleanupService.cleanPdfText(parsedPdf.text);
        } finally {
          await pdfParser.destroy();
        }
      } else if (mimetype.startsWith('image/')) {
        rawText = TextCleanupService.cleanOcrText(await OcrService.extractTextFromImage(filePath));
      } else {
        rawText = fs.readFileSync(filePath, 'utf-8');
      }

      await Resume.findByIdAndUpdate(resumeId, { rawText });

      await parserQueue.add('parse-resume', {
        resumeId,
        rawText,
      });

      console.log(`[OCR-Worker] Successfully processed text for: ${originalName}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'OCR processing failed';

      await Resume.findByIdAndUpdate(resumeId, {
        status: 'FAILED',
        errorMessage,
      });

      throw error;
    }
  },
  {
    connection: redisConnection as unknown as QueueOptions['connection'],
    concurrency: 2,
  }
);
