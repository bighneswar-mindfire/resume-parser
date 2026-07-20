import { Worker, Job, QueueOptions } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { InsightsService } from '../services/insightsService.js';
import { InsightsJobData } from '../queues/queueSetup.js';

export const insightsWorker = new Worker<InsightsJobData>(
  'insights-queue',
  async (job: Job<InsightsJobData>) => {
    const summary = await InsightsService.computeAndStore();

    console.log(
      `[Insights-Worker] Recomputed summary (${job.data.reason}): ` +
        `${summary.completedResumes}/${summary.totalResumes} parsed, ` +
        `top skill: ${summary.topSkills[0]?.skill ?? 'n/a'}`
    );
  },
  {
    connection: redisConnection as unknown as QueueOptions['connection'],

    concurrency: 1,
  }
);
