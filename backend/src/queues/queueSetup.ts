import { Queue, QueueOptions } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export interface OcrJobData {
  resumeId: string;
  filePath: string;
  mimetype: string;
  originalName: string;
}

export interface ParserJobData {
  resumeId: string;
  rawText: string;
}

const defaultOptions: QueueOptions = {
  connection: redisConnection as unknown as QueueOptions['connection'],
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const ocrQueue = new Queue<OcrJobData>('ocr-queue', defaultOptions);
export const parserQueue = new Queue<ParserJobData>('parser-queue', defaultOptions);
