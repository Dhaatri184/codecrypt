import { Router, Request, Response } from 'express';
import { githubService } from '../services/github';
import { authService } from '../services/auth';
import { createUser, findUserByGithubId } from '../db/repositories/users';
import { logger } from '../utils/logger';

const router = Router();

// Initiate GitHub OAuth flow
router.get('/github/initiate', (req: Request, res: Response) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const authUrl = githubService.generateAuthUrl(state);

    res.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });
  } catch (error) {
    logger.error('Error initiating GitHub OAuth', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'OAUTH_INITIATION_FAILED',
        message: 'Failed to initiate GitHub OAuth',
      },
    });
  }
});

// GitHub OAuth callback
router.get('/github/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Authorization code is required',
        },
      });
      return;
    }

    // Exchange code for access token
    const accessToken = await githubService.exchangeCodeForToken(code);

    // Get user info from GitHub
    const githubUser = await githubService.getUserInfo(accessToken);

    // Create or update user in database
    const user = await createUser(
      githubUser.id.toString(),
      githubUser.login,
      accessToken
    );

    // Generate JWT token
    const jwtToken = authService.generateToken(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    logger.error('Error in GitHub OAuth callback', { error });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    const user = await findUserByGithubId(payload.githubId);

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

    // Don't send access token to client
    const { accessToken, ...userWithoutToken } = user;

    res.json({
      success: true,
      data: userWithoutToken,
    });
  } catch (error) {
    logger.error('Error fetching current user', { error });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
});

export default router;
