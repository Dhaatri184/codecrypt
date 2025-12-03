import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as exorcismService from '../services/exorcism';
import * as exorcismRepo from '../db/repositories/exorcisms';
import * as issueRepo from '../db/repositories/issues';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/issues/:issueId/exorcise
 * Trigger an exorcism (auto-fix) for an issue
 */
router.post('/:issueId/exorcise', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { issueId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Get user's access token
    const userRepo = await import('../db/repositories/users');
    const user = await userRepo.findUserById(userId);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const accessToken = user.accessToken;

    // Check if issue exists
    const issue = await issueRepo.findIssueById(issueId);
    if (!issue) {
      return res.status(404).json({
        error: {
          code: 'ISSUE_NOT_FOUND',
          message: 'Issue not found',
        },
      });
    }

    // Check if issue can be exorcised
    if (!exorcismService.canExorcise(issue)) {
      return res.status(400).json({
        error: {
          code: 'NOT_AUTO_FIXABLE',
          message: `This ${issue.hauntingType} issue cannot be automatically fixed`,
          details: {
            hauntingType: issue.hauntingType,
            ruleId: issue.ruleId,
          },
        },
      });
    }

    // Check if exorcism already exists
    const existingExorcism = await exorcismRepo.findExorcismByIssueId(issueId);
    if (existingExorcism && existingExorcism.status === 'pending') {
      return res.status(409).json({
        error: {
          code: 'EXORCISM_IN_PROGRESS',
          message: 'An exorcism is already in progress for this issue',
          details: {
            exorcismId: existingExorcism.id,
            status: existingExorcism.status,
          },
        },
      });
    }

    // Apply exorcism
    const result = await exorcismService.applyExorcism(issueId, accessToken);

    if (!result.success) {
      return res.status(500).json({
        error: {
          code: 'EXORCISM_FAILED',
          message: result.error || 'Failed to apply exorcism',
          details: {
            exorcismId: result.exorcismId,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        exorcismId: result.exorcismId,
        branchName: result.branchName,
        prUrl: result.prUrl,
        prNumber: result.prNumber,
      },
    });
  } catch (error: any) {
    logger.error('Error in exorcise endpoint', { error: error.message });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing the exorcism',
      },
    });
  }
});

/**
 * GET /api/exorcisms/:exorcismId
 * Get exorcism status
 */
router.get('/:exorcismId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { exorcismId } = req.params;

    const exorcism = await exorcismRepo.findExorcismById(exorcismId);
    if (!exorcism) {
      return res.status(404).json({
        error: {
          code: 'EXORCISM_NOT_FOUND',
          message: 'Exorcism not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: exorcism,
    });
  } catch (error: any) {
    logger.error('Error fetching exorcism', { error: error.message });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching the exorcism',
      },
    });
  }
});

/**
 * GET /api/issues/:issueId/exorcism
 * Get exorcism for a specific issue
 */
router.get('/:issueId/exorcism', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { issueId } = req.params;

    const exorcism = await exorcismRepo.findExorcismByIssueId(issueId);
    if (!exorcism) {
      return res.status(404).json({
        error: {
          code: 'EXORCISM_NOT_FOUND',
          message: 'No exorcism found for this issue',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: exorcism,
    });
  } catch (error: any) {
    logger.error('Error fetching exorcism by issue', { error: error.message });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching the exorcism',
      },
    });
  }
});

export default router;
