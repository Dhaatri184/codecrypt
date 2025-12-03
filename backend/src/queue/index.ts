import Bull from 'bull';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Scan job queue
export const scanQueue = new Bull('scan-jobs', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

// AI explanation job queue
export const aiQueue = new Bull('ai-jobs', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

// Exorcism job queue
export const exorcismQueue = new Bull('exorcism-jobs', REDIS_URL, {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

// Queue event handlers
scanQueue.on('error', (error) => {
  logger.error('Scan queue error', { error });
});

scanQueue.on('failed', (job, error) => {
  logger.error('Scan job failed', { jobId: job.id, error });
});

aiQueue.on('error', (error) => {
  logger.error('AI queue error', { error });
});

exorcismQueue.on('error', (error) => {
  logger.error('Exorcism queue error', { error });
});

export default {
  scanQueue,
  aiQueue,
  exorcismQueue,
};
