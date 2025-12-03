import { AIExplanation } from '@codecrypt/shared';
import { query } from '../index';

export const createAIExplanation = async (data: {
  issueId: string;
  explanation: string;
  fixSuggestion?: string;
  codeExample?: string;
}): Promise<AIExplanation> => {
  const result = await query<AIExplanation>(
    `INSERT INTO ai_explanations (issue_id, explanation, fix_suggestion, code_example)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.issueId, data.explanation, data.fixSuggestion || null, data.codeExample || null]
  );
  return result.rows[0];
};

export const findExplanationByIssueId = async (issueId: string): Promise<AIExplanation | null> => {
  const result = await query<AIExplanation>(
    'SELECT * FROM ai_explanations WHERE issue_id = $1',
    [issueId]
  );
  return result.rows[0] || null;
};

export const findExplanationsByScanId = async (scanId: string): Promise<AIExplanation[]> => {
  const result = await query<AIExplanation>(
    `SELECT ae.* FROM ai_explanations ae
     JOIN issues i ON ae.issue_id = i.id
     WHERE i.scan_id = $1`,
    [scanId]
  );
  return result.rows;
};

export const deleteExplanation = async (explanationId: string): Promise<void> => {
  await query('DELETE FROM ai_explanations WHERE id = $1', [explanationId]);
};
