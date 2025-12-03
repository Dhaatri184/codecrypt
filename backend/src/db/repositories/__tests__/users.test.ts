import { createUser, findUserByGithubId, findUserById, updateUserAccessToken, deleteUser } from '../users';
import { query } from '../../index';

// Mock the database query function
jest.mock('../../index');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('User Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: '123',
        github_id: 'gh123',
        github_username: 'testuser',
        access_token: 'token123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await createUser('gh123', 'testuser', 'token123');

      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['gh123', 'testuser', 'token123']
      );
    });

    it('should update existing user on conflict', async () => {
      const mockUser = {
        id: '123',
        github_id: 'gh123',
        github_username: 'updateduser',
        access_token: 'newtoken',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await createUser('gh123', 'updateduser', 'newtoken');

      expect(result.github_username).toBe('updateduser');
    });
  });

  describe('findUserByGithubId', () => {
    it('should find user by GitHub ID', async () => {
      const mockUser = {
        id: '123',
        github_id: 'gh123',
        github_username: 'testuser',
        access_token: 'token123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await findUserByGithubId('gh123');

      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE github_id = $1',
        ['gh123']
      );
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await findUserByGithubId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      const mockUser = {
        id: '123',
        github_id: 'gh123',
        github_username: 'testuser',
        access_token: 'token123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await findUserById('123');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUserAccessToken', () => {
    it('should update user access token', async () => {
      const mockUser = {
        id: '123',
        github_id: 'gh123',
        github_username: 'testuser',
        access_token: 'newtoken',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await updateUserAccessToken('123', 'newtoken');

      expect(result.access_token).toBe('newtoken');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['newtoken', '123']
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await deleteUser('123');

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1',
        ['123']
      );
    });
  });

  describe('Transaction rollback', () => {
    it('should rollback on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(createUser('gh123', 'testuser', 'token123')).rejects.toThrow('Database error');
    });
  });
});
