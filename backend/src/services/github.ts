import axios from 'axios';
import { logger } from '../utils/logger';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_BASE = 'https://github.com/login/oauth';

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export class GitHubService {
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    this.callbackUrl = process.env.GITHUB_CALLBACK_URL || '';

    if (!this.clientId || !this.clientSecret) {
      logger.warn('GitHub OAuth credentials not configured');
    }
  }

  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'repo,user:email',
      state: state || '',
    });

    return `${GITHUB_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        `${GITHUB_OAUTH_BASE}/access_token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error_description || 'Failed to exchange code for token');
      }

      return response.data.access_token;
    } catch (error) {
      logger.error('Error exchanging code for token', { error });
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching user info', { error });
      throw error;
    }
  }

  async getUserRepositories(accessToken: string): Promise<GitHubRepository[]> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/user/repos`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          per_page: 100,
          sort: 'updated',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching repositories', { error });
      throw error;
    }
  }

  async getRepository(accessToken: string, owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching repository', { owner, repo, error });
      throw error;
    }
  }

  async createBranch(
    accessToken: string,
    owner: string,
    repo: string,
    branchName: string,
    fromBranch: string = 'main'
  ): Promise<void> {
    try {
      // Get the SHA of the base branch
      const refResponse = await axios.get(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const sha = refResponse.data.object.sha;

      // Create new branch
      await axios.post(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`,
        {
          ref: `refs/heads/${branchName}`,
          sha,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
    } catch (error) {
      logger.error('Error creating branch', { owner, repo, branchName, error });
      throw error;
    }
  }

  async createPullRequest(
    accessToken: string,
    owner: string,
    repo: string,
    data: {
      title: string;
      body: string;
      head: string;
      base: string;
    }
  ): Promise<{ url: string; number: number }> {
    try {
      const response = await axios.post(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      return {
        url: response.data.html_url,
        number: response.data.number,
      };
    } catch (error) {
      logger.error('Error creating pull request', { owner, repo, data, error });
      throw error;
    }
  }

  async handleRateLimit(error: any): Promise<void> {
    if (error.response?.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
      const resetTime = parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
      const waitTime = resetTime - Date.now();
      
      if (waitTime > 0) {
        logger.warn(`Rate limit exceeded. Waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

export const githubService = new GitHubService();
