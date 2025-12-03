import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { githubService } from '../services/github';
import { findUserById } from '../db/repositories/users';
import {
  createRepository,
  findRepositoriesByUserId,
  findRepositoryById,
  deleteRepository,
} from '../db/repositories/repositories';
import { logger } from '../utils/logger';

const router = Router();

// Debug endpoint (remove in production)
router.get('/debug/token-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserById(req.user!.userId);
    res.json({
      success: true,
      data: {
        userId: user?.id,
        username: user?.githubUsername,
        hasToken: !!user?.accessToken,
        tokenLength: user?.accessToken?.length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check token status' });
  }
});

// All routes require authentication
router.use(authenticate);

// Get user's repositories from GitHub
router.get('/github', async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserById(req.user!.userId);
    logger.info('User lookup result', { 
      userId: req.user!.userId, 
      userFound: !!user,
      hasAccessToken: !!user?.accessToken,
      tokenLength: user?.accessToken?.length || 0
    });
    
    if (!user) {
      logger.error('User not found when fetching GitHub repos', { userId: req.user!.userId });
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    if (!user.accessToken) {
      logger.error('User has no access token', { userId: user.id });
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_ACCESS_TOKEN',
          message: 'GitHub access token not found. Please log in again.',
        },
      });
      return;
    }

    logger.info('Fetching GitHub repositories', { userId: user.id, username: user.githubUsername });
    const repositories = await githubService.getUserRepositories(user.accessToken);
    logger.info('Successfully fetched GitHub repositories', { userId: user.id, count: repositories.length });

    res.json({
      success: true,
      data: repositories,
    });
  } catch (error: any) {
    logger.error('Error fetching GitHub repositories', { 
      error: error.message,
      status: error.response?.status,
      userId: req.user!.userId 
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'GITHUB_API_ERROR',
        message: 'Failed to fetch repositories from GitHub',
      },
    });
  }
});

// Connect a repository
router.post('/connect', async (req: AuthRequest, res: Response) => {
  try {
    const { githubRepoId, name, fullName, cloneUrl, defaultBranch } = req.body;

    if (!githubRepoId || !name || !fullName || !cloneUrl) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required fields',
        },
      });
      return;
    }

    const user = await findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Verify user has access to the repository
    try {
      const [owner, repo] = fullName.split('/');
      await githubService.getRepository(user.accessToken, owner, repo);
    } catch (error) {
      res.status(403).json({
        success: false,
        error: {
          code: 'REPOSITORY_ACCESS_DENIED',
          message: 'You do not have access to this repository',
        },
      });
      return;
    }

    const repository = await createRepository({
      userId: req.user!.userId,
      githubRepoId,
      name,
      fullName,
      cloneUrl,
      defaultBranch: defaultBranch || 'main',
    });

    res.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    logger.error('Error connecting repository', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'REPOSITORY_CONNECTION_FAILED',
        message: 'Failed to connect repository',
      },
    });
  }
});

// Get connected repositories
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const repositories = await findRepositoriesByUserId(req.user!.userId);

    res.json({
      success: true,
      data: repositories,
    });
  } catch (error) {
    logger.error('Error fetching connected repositories', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_REPOSITORIES_FAILED',
        message: 'Failed to fetch connected repositories',
      },
    });
  }
});

// Get repository by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const repository = await findRepositoryById(req.params.id);

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

    // Verify ownership
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

    res.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    logger.error('Error fetching repository', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_REPOSITORY_FAILED',
        message: 'Failed to fetch repository',
      },
    });
  }
});

// Disconnect repository
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const repository = await findRepositoryById(req.params.id);

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

    // Verify ownership
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

    await deleteRepository(req.params.id);

    res.json({
      success: true,
      data: {
        message: 'Repository disconnected successfully',
      },
    });
  } catch (error) {
    logger.error('Error disconnecting repository', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'DISCONNECT_REPOSITORY_FAILED',
        message: 'Failed to disconnect repository',
      },
    });
  }
});

export default router;
