import { Worker, Job, QueueOptions } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { Resume } from '../models/Resume.js';
import { NlpParserService } from '../services/nlpParser.js';
import { ParserJobData } from '../queues/queueSetup.js';

export const parserWorker = new Worker<ParserJobData>(
  'parser-queue',
  async (job: Job<ParserJobData>) => {
    const { resumeId, rawText } = job.data;

    try {
      const parsedFields = NlpParserService.parse(rawText);

      await Resume.findByIdAndUpdate(resumeId, {
        status: 'COMPLETED',
        name: parsedFields.name,
        email: parsedFields.email,
        phone: parsedFields.phone,
        skills: parsedFields.skills,
        experience: parsedFields.experience,
        education: parsedFields.education,
      });

      console.log(`[Parser-Worker] Successfully completed parsing for resume ID: ${resumeId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Parsing failed';

      await Resume.findByIdAndUpdate(resumeId, {
        status: 'FAILED',
        errorMessage,
      });

      throw error;
    }
  },
  {
    connection: redisConnection as unknown as QueueOptions['connection'],
    concurrency: 4,
  }
);
