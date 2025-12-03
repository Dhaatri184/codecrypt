import dotenv from 'dotenv';
dotenv.config();

import Queue from 'bull';
import { scanner } from './scanner';
import { logger } from './utils/logger';
import axios from 'axios';
import { createClient } from 'redis';

// Connect to Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Create queue connection - MUST match backend queue name!
const scanQueue = new Queue('scan-jobs', REDIS_URL);

// Create Redis client for cancellation checks
const redisClient = createClient({ url: REDIS_URL });
redisClient.connect().catch((err) => logger.error('Redis connection error', { err }));

logger.info('Scanner worker started', { redisUrl: REDIS_URL, backendUrl: BACKEND_URL });

// Process scan jobs
scanQueue.process(async (job) => {
  const { scanId, repositoryId, cloneUrl, branch } = job.data;

  logger.info('Processing scan job', { scanId, repositoryId, cloneUrl, branch });

  try {
    // Define progress callback
    const onProgress = async (update: any) => {
      try {
        // Update backend via HTTP (backend will handle DB and WebSocket)
        await axios.post(`${BACKEND_URL}/api/scans/${scanId}/progress`, update, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        });
      } catch (error) {
        logger.error('Failed to report progress', { scanId, error });
        // Don't fail the scan if progress reporting fails
      }
    };

    // Define cancellation check callback
    const shouldCancel = async () => {
      try {
        const key = `scan:${scanId}:cancel`;
        const value = await redisClient.get(key);
        return value === '1';
      } catch (error) {
        logger.error('Failed to check cancellation flag', { scanId, error });
        return false;
      }
    };

    // Run the scan with callbacks
    const result = await scanner.scan({
      cloneUrl,
      branch: branch || 'main',
      repositoryId,
      scanId, // Pass the actual scanId
    }, {
      onProgress,
      shouldCancel,
    });

    logger.info('Scan completed successfully', { scanId, issuesFound: result.issues.length });

    // Notify backend that scan is complete
    try {
      await axios.post(`${BACKEND_URL}/api/scans/${scanId}/complete`, {
        totalFiles: result.totalFiles,
        totalIssues: result.totalIssues,
        hauntingLevel: result.hauntingLevel,
        commitSha: result.commitSha,
        issues: result.issues,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
    } catch (error) {
      logger.error('Failed to notify backend of completion', { scanId, error });
    }

    return result;
  } catch (error: any) {
    if (error.message === 'SCAN_CANCELLED') {
      logger.info('Scan was cancelled', { scanId });
      // Return partial results
      return {
        cancelled: true,
        scanId,
        repositoryId,
      };
    }
    logger.error('Scan failed', { scanId, error });
    throw error;
  }
});

// Handle queue events
scanQueue.on('completed', (job, result) => {
  logger.info('Job completed', { jobId: job.id, scanId: job.data.scanId });
});

scanQueue.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job.id, scanId: job.data.scanId, error: err.message });
});

scanQueue.on('error', (error) => {
  logger.error('Queue error', { error });
});

logger.info('Scanner worker ready and listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing queue');
  await scanQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing queue');
  await scanQueue.close();
  process.exit(0);
});
