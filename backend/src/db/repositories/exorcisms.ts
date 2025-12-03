import { Exorcism, ExorcismStatus } from '@codecrypt/shared';
import { query } from '../index';

export const createExorcism = async (issueId: string): Promise<Exorcism> => {
  const result = await query<Exorcism>(
    `INSERT INTO exorcisms (issue_id, status)
     VALUES ($1, 'pending')
     RETURNING *`,
    [issueId]
  );
  return result.rows[0];
};

export const findExorcismById = async (id: string): Promise<Exorcism | null> => {
  const result = await query<Exorcism>(
    'SELECT * FROM exorcisms WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const findExorcismByIssueId = async (issueId: string): Promise<Exorcism | null> => {
  const result = await query<Exorcism>(
    'SELECT * FROM exorcisms WHERE issue_id = $1 ORDER BY created_at DESC LIMIT 1',
    [issueId]
  );
  return result.rows[0] || null;
};

export const updateExorcismStatus = async (
  exorcismId: string,
  status: ExorcismStatus,
  data?: {
    branchName?: string;
    prUrl?: string;
    prNumber?: number;
    errorMessage?: string;
  }
): Promise<Exorcism> => {
  const completedAt = ['completed', 'failed'].includes(status) ? 'NOW()' : 'NULL';
  const result = await query<Exorcism>(
    `UPDATE exorcisms
     SET status = $1,
         branch_name = COALESCE($2, branch_name),
         pr_url = COALESCE($3, pr_url),
         pr_number = COALESCE($4, pr_number),
         error_message = COALESCE($5, error_message),
         completed_at = ${completedAt}
     WHERE id = $6
     RETURNING *`,
    [
      status,
      data?.branchName || null,
      data?.prUrl || null,
      data?.prNumber || null,
      data?.errorMessage || null,
      exorcismId,
    ]
  );
  return result.rows[0];
};

export const deleteExorcism = async (exorcismId: string): Promise<void> => {
  await query('DELETE FROM exorcisms WHERE id = $1', [exorcismId]);
};
