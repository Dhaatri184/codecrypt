import { User } from '@codecrypt/shared';
import { query, transaction } from '../index';
import { PoolClient } from 'pg';

// Helper function to map database row to User object
const mapRowToUser = (row: any): User => ({
  id: row.id,
  githubId: row.github_id,
  githubUsername: row.github_username,
  accessToken: row.access_token,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createUser = async (
  githubId: string,
  githubUsername: string,
  accessToken: string
): Promise<User> => {
  const result = await query(
    `INSERT INTO users (github_id, github_username, access_token)
     VALUES ($1, $2, $3)
     ON CONFLICT (github_id) 
     DO UPDATE SET 
       github_username = EXCLUDED.github_username,
       access_token = EXCLUDED.access_token,
       updated_at = NOW()
     RETURNING *`,
    [githubId, githubUsername, accessToken]
  );
  return mapRowToUser(result.rows[0]);
};

export const findUserByGithubId = async (githubId: string): Promise<User | null> => {
  const result = await query<User>(
    'SELECT * FROM users WHERE github_id = $1',
    [githubId]
  );
  if (result.rows[0]) {
    return mapRowToUser(result.rows[0]);
  }
  return null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const result = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  if (result.rows[0]) {
    return mapRowToUser(result.rows[0]);
  }
  return null;
};

export const updateUserAccessToken = async (
  userId: string,
  accessToken: string
): Promise<User> => {
  const result = await query<User>(
    'UPDATE users SET access_token = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [accessToken, userId]
  );
  return result.rows[0];
};

export const deleteUser = async (userId: string): Promise<void> => {
  await query('DELETE FROM users WHERE id = $1', [userId]);
};
