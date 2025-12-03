import { Repository } from '@codecrypt/shared';
import { query } from '../index';

// Helper function to map database row to Repository object
const mapRowToRepository = (row: any): Repository => ({
  id: row.id,
  userId: row.user_id,
  githubRepoId: row.github_repo_id,
  name: row.name,
  fullName: row.full_name,
  cloneUrl: row.clone_url,
  defaultBranch: row.default_branch,
  lastScanAt: row.last_scan_at,
  createdAt: row.created_at,
});

export const createRepository = async (data: {
  userId: string;
  githubRepoId: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
}): Promise<Repository> => {
  const result = await query<Repository>(
    `INSERT INTO repositories (user_id, github_repo_id, name, full_name, clone_url, default_branch)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, github_repo_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       full_name = EXCLUDED.full_name,
       clone_url = EXCLUDED.clone_url,
       default_branch = EXCLUDED.default_branch
     RETURNING *`,
    [data.userId, data.githubRepoId, data.name, data.fullName, data.cloneUrl, data.defaultBranch]
  );
  return mapRowToRepository(result.rows[0]);
};

export const findRepositoryById = async (id: string): Promise<Repository | null> => {
  const result = await query<Repository>(
    'SELECT * FROM repositories WHERE id = $1',
    [id]
  );
  if (result.rows[0]) {
    return mapRowToRepository(result.rows[0]);
  }
  return null;
};

export const findRepositoriesByUserId = async (userId: string): Promise<Repository[]> => {
  const result = await query<Repository>(
    'SELECT * FROM repositories WHERE user_id = $1 ORDER BY last_scan_at DESC NULLS LAST, created_at DESC',
    [userId]
  );
  return result.rows.map(mapRowToRepository);
};

export const updateLastScanAt = async (repositoryId: string): Promise<void> => {
  await query(
    'UPDATE repositories SET last_scan_at = NOW() WHERE id = $1',
    [repositoryId]
  );
};

export const deleteRepository = async (repositoryId: string): Promise<void> => {
  await query('DELETE FROM repositories WHERE id = $1', [repositoryId]);
};

export const findRepositoryByScanId = async (scanId: string): Promise<Repository | null> => {
  const result = await query<Repository>(
    `SELECT r.* FROM repositories r
     INNER JOIN scans s ON s.repository_id = r.id
     WHERE s.id = $1`,
    [scanId]
  );
  return result.rows[0] || null;
};
