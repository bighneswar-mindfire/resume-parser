import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('Connected to Redis successfully.');
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});
