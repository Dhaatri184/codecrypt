import * as fc from 'fast-check';
import { GitHubService } from '../github';

// Feature: codecrypt, Property 1: OAuth redirect URL generation
// Validates: Requirements 1.1

describe('GitHub Service - OAuth URL Generation', () => {
  let githubService: GitHubService;

  beforeEach(() => {
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.GITHUB_CALLBACK_URL = 'http://localhost:4000/api/auth/github/callback';
    githubService = new GitHubService();
  });

  describe('Property 1: OAuth redirect URL generation', () => {
    it('property: generated OAuth URL should always contain required parameters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          (state) => {
            const authUrl = githubService.generateAuthUrl(state);
            
            // Validate URL structure
            const url = new URL(authUrl);
            
            // Check base URL
            const hasCorrectBase = authUrl.startsWith('https://github.com/login/oauth/authorize');
            
            // Check required parameters
            const hasClientId = url.searchParams.has('client_id');
            const hasRedirectUri = url.searchParams.has('redirect_uri');
            const hasScope = url.searchParams.has('scope');
            
            // Validate parameter values
            const clientId = url.searchParams.get('client_id');
            const redirectUri = url.searchParams.get('redirect_uri');
            const scope = url.searchParams.get('scope');
            
            const hasValidClientId = clientId === 'test_client_id';
            const hasValidRedirectUri = redirectUri === 'http://localhost:4000/api/auth/github/callback';
            const hasValidScope = scope?.includes('repo') && scope?.includes('user:email');
            
            return (
              hasCorrectBase &&
              hasClientId &&
              hasRedirectUri &&
              hasScope &&
              hasValidClientId &&
              hasValidRedirectUri &&
              hasValidScope
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: state parameter should be preserved in URL', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (state) => {
            const authUrl = githubService.generateAuthUrl(state);
            const url = new URL(authUrl);
            const urlState = url.searchParams.get('state');
            
            return urlState === state;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: URL should be valid and parseable', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
          (state) => {
            const authUrl = githubService.generateAuthUrl(state);
            
            try {
              const url = new URL(authUrl);
              return url.protocol === 'https:' && url.hostname === 'github.com';
            } catch {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit tests for OAuth URL generation', () => {
    it('should generate valid OAuth URL with state', () => {
      const state = 'test_state_123';
      const authUrl = githubService.generateAuthUrl(state);

      expect(authUrl).toContain('https://github.com/login/oauth/authorize');
      expect(authUrl).toContain('client_id=test_client_id');
      expect(authUrl).toContain('state=test_state_123');
      expect(authUrl).toContain('scope=repo');
    });

    it('should generate valid OAuth URL without state', () => {
      const authUrl = githubService.generateAuthUrl();

      expect(authUrl).toContain('https://github.com/login/oauth/authorize');
      expect(authUrl).toContain('client_id=test_client_id');
    });

    it('should include required scopes', () => {
      const authUrl = githubService.generateAuthUrl();
      const url = new URL(authUrl);
      const scope = url.searchParams.get('scope');

      expect(scope).toContain('repo');
      expect(scope).toContain('user:email');
    });
  });
});
