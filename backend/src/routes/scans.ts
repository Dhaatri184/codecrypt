import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { scanQueue, aiQueue } from '../queue';
import { logger } from '../utils/logger';
import {
  createScan,
  findScanById,
  findScansByRepositoryId,
  updateScanStatus,
  updateScanResults,
} from '../db/repositories/scans';
import { findIssuesByScanId, createIssues } from '../db/repositories/issues';
import { findExplanationsByScanId } from '../db/repositories/aiExplanations';
import { findRepositoryById } from '../db/repositories/repositories';

const router = Router();

// Internal endpoint for scanner worker to report progress (no auth required)
router.post('/:id/progress', async (req, res: Response) => {
  try {
    const { id: scanId } = req.params;
    const { filesProcessed, totalFiles, progressPercentage, statusMessage } = req.body;

    // Update database (throttled)
    const { updateScanProgressThrottled } = await import('../db/repositories/scans');
    await updateScanProgressThrottled(scanId, {
      progressPercentage,
      filesProcessed,
      totalFilesDiscovered: totalFiles,
      currentStatusMessage: statusMessage,
    });

    // Get repository ID for broadcasting
    const scan = await findScanById(scanId);
    if (scan) {
      // Broadcast to WebSocket (throttled)
      const { broadcastScanProgress } = await import('../websocket');
      broadcastScanProgress(scan.repositoryId, scanId, {
        progressPercentage,
        filesProcessed,
        totalFiles,
        statusMessage,
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating scan progress', { error });
    res.status(500).json({ success: false });
  }
});

// Internal endpoint for scanner worker to report completion (no auth required)
router.post('/:id/complete', async (req, res: Response) => {
  try {
    const { id: scanId } = req.params;
    const { totalFiles, totalIssues, hauntingLevel, commitSha, issues } = req.body;

    logger.info('Scan completion received', { scanId, totalFiles, totalIssues });

    // Update scan status to analyzing
    await updateScanStatus(scanId, 'analyzing');
    
    const scan = await findScanById(scanId);
    if (scan) {
      const { broadcastScanUpdate } = await import('../websocket');
      broadcastScanUpdate(scan.repositoryId, { scanId, status: 'analyzing' });
    }

    // Store issues in database
    const issuesWithScanId = issues.map((issue: any) => ({
      ...issue,
      scanId,
    }));

    let createdIssues: any[] = [];
    if (issuesWithScanId.length > 0) {
      createdIssues = await createIssues(issuesWithScanId);
    }

    // Calculate aggregate metrics
    const { countIssuesByType } = await import('../db/repositories/issues');
    const issuesByType = await countIssuesByType(scanId);

    // Update scan with results
    await updateScanResults(scanId, {
      totalFiles,
      totalIssues,
      hauntingLevel,
    });

    // Update repository last scan timestamp
    const { updateLastScanAt } = await import('../db/repositories/repositories');
    if (scan) {
      await updateLastScanAt(scan.repositoryId);

      // Queue AI explanation jobs for each created issue (with IDs)
      for (const issue of createdIssues) {
        await aiQueue.add({
          issueId: issue.id,
          scanId,
        });
      }

      // Broadcast scan completion
      const { broadcastScanComplete } = await import('../websocket');
      broadcastScanComplete(scan.repositoryId, scanId, {
        totalFiles,
        totalIssues,
        hauntingLevel,
        issuesByType,
      });
    }

    logger.info('Scan completion processed', { scanId });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error processing scan completion', { error });
    res.status(500).json({ success: false });
  }
});

// All other routes require authentication
router.use(authenticate);

// Trigger a new scan
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { repositoryId, branch } = req.body;
    
    logger.info('Scan request received', { repositoryId, branch, userId: req.user?.userId });

    if (!repositoryId) {
      logger.error('No repository ID provided');
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Repository ID is required',
        },
      });
      return;
    }

    // Verify repository exists and user has access
    logger.info('Looking up repository', { repositoryId });
    const repository = await findRepositoryById(repositoryId);
    logger.info('Repository lookup result', { found: !!repository });

    if (!repository) {
      res.status(404).json({
        success: false,
        error: {
          code: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        },
      });
      return;
    }

    logger.info('Checking permissions', { repoUserId: repository.userId, requestUserId: req.user!.userId });
    
    if (repository.userId !== req.user!.userId) {
      logger.error('Permission denied');
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this repository',
        },
      });
      return;
    }

    // Create scan record
    logger.info('Creating scan record');
    const scan = await createScan(repositoryId);
    logger.info('Scan created', { scanId: scan.id });

    // Queue scan job
    logger.info('Queueing scan job');
    await scanQueue.add({
      scanId: scan.id,
      repositoryId: repository.id,
      cloneUrl: repository.cloneUrl,
      branch: branch || repository.defaultBranch,
    });

    logger.info('Scan queued successfully', { scanId: scan.id, repositoryId });

    res.json({
      success: true,
      data: scan,
    });
  } catch (error) {
    logger.error('Error triggering scan', { error, message: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
    res.status(500).json({
      success: false,
      error: {
        code: 'SCAN_TRIGGER_FAILED',
        message: 'Failed to trigger scan',
      },
    });
  }
});

// Get scan by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const scan = await findScanById(req.params.id);

    if (!scan) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCAN_NOT_FOUND',
          message: 'Scan not found',
        },
      });
      return;
    }

    // Verify user has access to the repository
    const repository = await findRepositoryById(scan.repositoryId);
    if (!repository || repository.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this scan',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: scan,
    });
  } catch (error) {
    logger.error('Error fetching scan', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_SCAN_FAILED',
        message: 'Failed to fetch scan',
      },
    });
  }
});

// Get scan results (issues + explanations)
router.get('/:id/results', async (req: AuthRequest, res: Response) => {
  try {
    const scan = await findScanById(req.params.id);

    if (!scan) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCAN_NOT_FOUND',
          message: 'Scan not found',
        },
      });
      return;
    }

    // Verify user has access
    const repository = await findRepositoryById(scan.repositoryId);
    if (!repository || repository.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this scan',
        },
      });
      return;
    }

    // Get issues
    const issues = await findIssuesByScanId(scan.id);

    // Get AI explanations
    const explanations = await findExplanationsByScanId(scan.id);

    // Map explanations to issues
    const explanationMap = new Map(
      explanations.map((exp) => [exp.issueId, exp])
    );

    const issuesWithExplanations = issues.map((issue) => ({
      ...issue,
      scanId: issue.scan_id,
      hauntingType: issue.haunting_type,
      filePath: issue.file_path,
      startLine: issue.start_line,
      endLine: issue.end_line,
      codeSnippet: issue.code_snippet,
      ruleId: issue.rule_id,
      createdAt: issue.created_at,
      explanation: explanationMap.get(issue.id) || null,
    }));

    // Transform scan object
    const transformedScan = {
      ...scan,
      repositoryId: scan.repository_id,
      startedAt: scan.started_at,
      completedAt: scan.completed_at,
      cancelledAt: scan.cancelled_at,
      cancelledBy: scan.cancelled_by,
      commitSha: scan.commit_sha,
      totalFiles: scan.total_files,
      totalIssues: scan.total_issues,
      hauntingLevel: scan.haunting_level,
      progressPercentage: scan.progress_percentage,
      filesProcessed: scan.files_processed,
      totalFilesDiscovered: scan.total_files_discovered,
      currentStatusMessage: scan.current_status_message,
    };

    res.json({
      success: true,
      data: {
        scan: transformedScan,
        issues: issuesWithExplanations,
      },
    });
  } catch (error) {
    logger.error('Error fetching scan results', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_RESULTS_FAILED',
        message: 'Failed to fetch scan results',
      },
    });
  }
});

// Get scan history for a repository
router.get('/repository/:repositoryId', async (req: AuthRequest, res: Response) => {
  try {
    const { repositoryId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Verify repository exists and user has access
    const repository = await findRepositoryById(repositoryId);

    if (!repository) {
      res.status(404).json({
        success: false,
        error: {
          code: 'REPOSITORY_NOT_FOUND',
          message: 'Repository not found',
        },
      });
      return;
    }

    if (repository.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this repository',
        },
      });
      return;
    }

    const scans = await findScansByRepositoryId(repositoryId, limit);

    // Transform snake_case to camelCase for frontend
    const transformedScans = scans.map(scan => ({
      ...scan,
      repositoryId: scan.repository_id,
      startedAt: scan.started_at,
      completedAt: scan.completed_at,
      cancelledAt: scan.cancelled_at,
      cancelledBy: scan.cancelled_by,
      commitSha: scan.commit_sha,
      totalFiles: scan.total_files,
      totalIssues: scan.total_issues,
      hauntingLevel: scan.haunting_level,
      progressPercentage: scan.progress_percentage,
      filesProcessed: scan.files_processed,
      totalFilesDiscovered: scan.total_files_discovered,
      currentStatusMessage: scan.current_status_message,
    }));

    res.json({
      success: true,
      data: transformedScans,
    });
  } catch (error) {
    logger.error('Error fetching scan history', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_HISTORY_FAILED',
        message: 'Failed to fetch scan history',
      },
    });
  }
});

// Cancel a running scan
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { id: scanId } = req.params;

    logger.info('Scan cancellation requested', { scanId, userId: req.user?.userId });

    // Get the scan
    const scan = await findScanById(scanId);

    if (!scan) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCAN_NOT_FOUND',
          message: 'Scan not found',
        },
      });
      return;
    }

    // Verify user has access to the repository
    const repository = await findRepositoryById(scan.repositoryId);
    
    logger.info('Authorization check', { 
      scanId, 
      repositoryId: scan.repositoryId,
      repositoryFound: !!repository,
      repositoryUserId: repository?.userId,
      requestUserId: req.user?.userId,
      match: repository?.userId === req.user?.userId
    });
    
    if (!repository || repository.userId !== req.user!.userId) {
      logger.error('Unauthorized cancellation attempt', { 
        scanId, 
        userId: req.user?.userId,
        repositoryUserId: repository?.userId,
        reason: !repository ? 'Repository not found' : 'User ID mismatch'
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this scan',
        },
      });
      return;
    }

    // Check if scan is already completed or failed
    if (['completed', 'failed', 'cancelled'].includes(scan.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SCAN_NOT_CANCELLABLE',
          message: `Cannot cancel scan with status: ${scan.status}`,
        },
      });
      return;
    }

    // Set cancellation flag in Redis
    const { cacheService } = await import('../services/cache');
    await cacheService.setCancellationFlag(scanId);

    // Update scan status in database
    const { cancelScan } = await import('../db/repositories/scans');
    const cancelledScan = await cancelScan(scanId);

    // Broadcast cancellation event
    const { broadcastScanUpdate } = await import('../websocket');
    broadcastScanUpdate(scan.repositoryId, {
      scanId,
      status: 'cancelled',
      message: 'Scan cancelled by user',
    });

    logger.info('Scan cancelled successfully', { scanId });

    res.json({
      success: true,
      data: cancelledScan,
    });
  } catch (error) {
    logger.error('Error cancelling scan', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_SCAN_FAILED',
        message: 'Failed to cancel scan',
      },
    });
  }
});

export default router;
