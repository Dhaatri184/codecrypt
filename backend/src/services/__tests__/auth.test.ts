import * as fc from 'fast-check';
import { AuthService } from '../auth';
import { User } from '@codecrypt/shared';

// Feature: codecrypt, Property 2: Token storage and repository retrieval
// Validates: Requirements 1.2

describe('Auth Service - Token Storage', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('Property 2: Token storage and repository retrieval', () => {
    it('property: generated JWT should be verifiable and contain user data', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            githubId: fc.string({ minLength: 1, maxLength: 50 }),
            githubUsername: fc.string({ minLength: 1, maxLength: 39 }),
            accessToken: fc.string({ minLength: 10 }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (userData) => {
            const user = userData as User;
            
            // Generate token
            const token = authService.generateToken(user);
            
            // Verify token
            try {
              const payload = authService.verifyToken(token);
              
              // Check that payload contains correct user data
              return (
                payload.userId === user.id &&
                payload.githubId === user.githubId &&
                payload.githubUsername === user.githubUsername
              );
            } catch {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: token generation should be deterministic for same user', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            githubId: fc.string({ minLength: 1 }),
            githubUsername: fc.string({ minLength: 1 }),
            accessToken: fc.string({ minLength: 10 }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (userData) => {
            const user = userData as User;
            
            const token1 = authService.generateToken(user);
            const token2 = authService.generateToken(user);
            
            // Tokens should be different (due to timestamp) but verify to same payload
            const payload1 = authService.verifyToken(token1);
            const payload2 = authService.verifyToken(token2);
            
            return (
              payload1.userId === payload2.userId &&
              payload1.githubId === payload2.githubId &&
              payload1.githubUsername === payload2.githubUsername
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: invalid tokens should fail verification', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (randomString) => {
            try {
              authService.verifyToken(randomString);
              return false; // Should have thrown
            } catch {
              return true; // Expected to throw
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: encrypted tokens should not match original', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (token) => {
            const encrypted = await authService.encryptToken(token);
            return encrypted !== token && encrypted.length > 0;
          }
        ),
        { numRuns: 50 } // Reduced runs due to async bcrypt
      );
    });
  });

  describe('Unit tests for token operations', () => {
    const mockUser: User = {
      id: '123',
      githubId: 'gh123',
      githubUsername: 'testuser',
      accessToken: 'token123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate valid JWT token', () => {
      const token = authService.generateToken(mockUser);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify valid token', () => {
      const token = authService.generateToken(mockUser);
      const payload = authService.verifyToken(token);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.githubId).toBe(mockUser.githubId);
      expect(payload.githubUsername).toBe(mockUser.githubUsername);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should encrypt and compare tokens', async () => {
      const token = 'test_access_token';
      const encrypted = await authService.encryptToken(token);

      expect(encrypted).not.toBe(token);
      
      const isMatch = await authService.compareToken(token, encrypted);
      expect(isMatch).toBe(true);

      const isNotMatch = await authService.compareToken('wrong_token', encrypted);
      expect(isNotMatch).toBe(false);
    });
  });
});
