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

export interface InsightsJobData {
  reason: string;
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
export const insightsQueue = new Queue<InsightsJobData>('insights-queue', defaultOptions);

export async function requestInsightsRefresh(reason: string): Promise<void> {
  await insightsQueue.add(
    'recompute-insights',
    { reason },
    {
      delay: 3000,
      deduplication: { id: 'insights-refresh' },
    }
  );
}
