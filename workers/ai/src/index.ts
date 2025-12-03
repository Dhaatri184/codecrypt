import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import Bull, { Job } from 'bull';
import { logger } from './utils/logger';
import { generateExplanation } from './templates';
import { Pool } from 'pg';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create AI queue connection
const aiQueue = new Bull('ai-jobs', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

interface AIJobData {
  issueId: string;
  scanId: string;
}

// Helper functions to interact with database
async function findIssueById(issueId: string) {
  const result = await pool.query(
    'SELECT * FROM issues WHERE id = $1',
    [issueId]
  );
  return result.rows[0];
}

async function createAIExplanation(data: {
  issueId: string;
  explanation: string;
  fixSuggestion?: string;
  codeExample?: string;
}) {
  const result = await pool.query(
    `INSERT INTO ai_explanations (issue_id, explanation, fix_suggestion, code_example, generated_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [data.issueId, data.explanation, data.fixSuggestion, data.codeExample]
  );
  return result.rows[0];
}

// Process AI explanation jobs
aiQueue.process(async (job: Job<AIJobData>) => {
  const { issueId } = job.data;

  try {
    logger.info('Processing AI explanation job', { issueId });

    // Get the issue
    const issue = await findIssueById(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    // Generate explanation using templates
    // TODO: Replace with real OpenAI API call when ready
    const explanation = generateExplanation(issue.haunting_type, issue.message);

    // Store explanation in database
    await createAIExplanation({
      issueId: issue.id,
      explanation: explanation.explanation,
      fixSuggestion: explanation.fixSuggestion,
      codeExample: explanation.codeExample,
    });

    logger.info('AI explanation generated', { issueId });

    return {
      success: true,
      issueId,
    };
  } catch (error) {
    logger.error('AI explanation job failed', { issueId, error });
    throw error;
  }
});

logger.info('AI Worker started');
logger.info('Listening for AI explanation jobs');

export default aiQueue;
