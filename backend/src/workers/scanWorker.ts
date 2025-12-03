import { Job } from 'bull';
import { scanQueue, aiQueue } from '../queue';
import { logger } from '../utils/logger';
import {
  updateScanStatus,
  updateScanResults,
  findScanById,
} from '../db/repositories/scans';
import { createIssues, countIssuesByType } from '../db/repositories/issues';
import { updateLastScanAt } from '../db/repositories/repositories';
import { broadcastScanUpdate, broadcastScanComplete, broadcastScanError } from '../websocket';

interface ScanJobData {
  scanId: string;
  repositoryId: string;
  cloneUrl: string;
  branch: string;
}

// Process scan jobs
scanQueue.process(async (job: Job<ScanJobData>) => {
  const { scanId, repositoryId, cloneUrl, branch } = job.data;

  try {
    logger.info('Processing scan job', { scanId, repositoryId });

    // Update scan status to scanning
    await updateScanStatus(scanId, 'scanning');
    broadcastScanUpdate(repositoryId, { scanId, status: 'scanning' });

    // The scanner worker will handle the actual scanning and report progress
    // This worker waits for the results from the queue
    // The scanner worker returns the scan results through the Bull queue
    const scanResult = await job.returnvalue || {};

    // Update scan status to analyzing
    await updateScanStatus(scanId, 'analyzing');
    broadcastScanUpdate(repositoryId, { scanId, status: 'analyzing' });

    // Store issues in database
    const issuesWithScanId = scanResult.issues.map((issue) => ({
      ...issue,
      scanId,
    }));

    if (issuesWithScanId.length > 0) {
      await createIssues(issuesWithScanId);
    }

    // Calculate aggregate metrics
    const issuesByType = await countIssuesByType(scanId);

    // Update scan with results
    await updateScanResults(scanId, {
      totalFiles: scanResult.totalFiles,
      totalIssues: scanResult.totalIssues,
      hauntingLevel: scanResult.hauntingLevel,
    });

    // Update repository last scan timestamp
    await updateLastScanAt(repositoryId);

    // Queue AI explanation jobs for each issue
    const scan = await findScanById(scanId);
    if (scan) {
      // Queue AI jobs (will be processed by AI worker)
      for (const issue of issuesWithScanId) {
        await aiQueue.add({
          issueId: issue.id,
          scanId,
        });
      }
    }

    logger.info('Scan job completed', {
      scanId,
      totalFiles: scanResult.totalFiles,
      totalIssues: scanResult.totalIssues,
    });

    // Broadcast scan completion
    broadcastScanComplete(repositoryId, scanId, {
      totalFiles: scanResult.totalFiles,
      totalIssues: scanResult.totalIssues,
      hauntingLevel: scanResult.hauntingLevel,
      issuesByType,
    });

    return {
      success: true,
      scanId,
      totalIssues: scanResult.totalIssues,
    };
  } catch (error) {
    logger.error('Scan job failed', { scanId, error });

    // Update scan status to failed
    await updateScanStatus(scanId, 'failed', error.message);

    // Broadcast scan error
    broadcastScanError(repositoryId, scanId, error.message);

    throw error;
  }
});

logger.info('Scan worker started');

export default scanQueue;
