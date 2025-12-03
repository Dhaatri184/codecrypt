import { Issue, HauntingType, Severity } from '@codecrypt/shared';
import { query } from '../index';

export const createIssue = async (data: {
  scanId: string;
  hauntingType: HauntingType;
  severity: Severity;
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  ruleId: string;
  message: string;
}): Promise<Issue> => {
  const result = await query<Issue>(
    `INSERT INTO issues (scan_id, haunting_type, severity, file_path, start_line, end_line, code_snippet, rule_id, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.scanId,
      data.hauntingType,
      data.severity,
      data.filePath,
      data.startLine,
      data.endLine,
      data.codeSnippet,
      data.ruleId,
      data.message,
    ]
  );
  return result.rows[0];
};

export const createIssues = async (issues: Array<{
  scanId: string;
  hauntingType: HauntingType;
  severity: Severity;
  filePath: string;
  startLine: number;
  endLine: number;
  codeSnippet: string;
  ruleId: string;
  message: string;
}>): Promise<Issue[]> => {
  if (issues.length === 0) return [];

  const values = issues.map((_, i) => {
    const offset = i * 9;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
  }).join(', ');

  const params = issues.flatMap(issue => [
    issue.scanId,
    issue.hauntingType,
    issue.severity,
    issue.filePath,
    issue.startLine,
    issue.endLine,
    issue.codeSnippet,
    issue.ruleId,
    issue.message,
  ]);

  const result = await query<Issue>(
    `INSERT INTO issues (scan_id, haunting_type, severity, file_path, start_line, end_line, code_snippet, rule_id, message)
     VALUES ${values}
     RETURNING *`,
    params
  );
  return result.rows;
};

export const findIssueById = async (id: string): Promise<Issue | null> => {
  const result = await query<Issue>(
    'SELECT * FROM issues WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const findIssuesByScanId = async (scanId: string): Promise<Issue[]> => {
  const result = await query<Issue>(
    `SELECT 
      id, scan_id, haunting_type, severity, file_path, start_line, end_line,
      SUBSTRING(code_snippet, 1, 500) as code_snippet,
      rule_id, message, created_at
    FROM issues 
    WHERE scan_id = $1 
    ORDER BY severity DESC, file_path, start_line
    LIMIT 1000`,
    [scanId]
  );
  return result.rows;
};

export const countIssuesByType = async (scanId: string): Promise<Record<HauntingType, number>> => {
  const result = await query<{ haunting_type: HauntingType; count: string }>(
    `SELECT haunting_type, COUNT(*) as count
     FROM issues
     WHERE scan_id = $1
     GROUP BY haunting_type`,
    [scanId]
  );

  const counts: Record<HauntingType, number> = {
    ghost: 0,
    zombie: 0,
    vampire: 0,
    skeleton: 0,
    monster: 0,
  };

  result.rows.forEach(row => {
    counts[row.haunting_type] = parseInt(row.count, 10);
  });

  return counts;
};

export const deleteIssue = async (issueId: string): Promise<void> => {
  await query('DELETE FROM issues WHERE id = $1', [issueId]);
};
