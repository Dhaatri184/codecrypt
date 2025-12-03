import { Scan, ScanStatus } from '@codecrypt/shared';
import { query } from '../index';

export const createScan = async (repositoryId: string, commitSha?: string): Promise<Scan> => {
  const result = await query<Scan>(
    `INSERT INTO scans (repository_id, status, commit_sha)
     VALUES ($1, 'pending', $2)
     RETURNING *`,
    [repositoryId, commitSha || null]
  );
  return result.rows[0];
};

export const findScanById = async (id: string): Promise<Scan | null> => {
  const result = await query<Scan>(
    'SELECT * FROM scans WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const findScansByRepositoryId = async (
  repositoryId: string,
  limit: number = 10
): Promise<Scan[]> => {
  const result = await query<Scan>(
    'SELECT * FROM scans WHERE repository_id = $1 ORDER BY started_at DESC LIMIT $2',
    [repositoryId, limit]
  );
  return result.rows;
};

export const findMostRecentScan = async (repositoryId: string): Promise<Scan | null> => {
  const result = await query<Scan>(
    `SELECT * FROM scans 
     WHERE repository_id = $1 AND status = 'completed'
     ORDER BY started_at DESC 
     LIMIT 1`,
    [repositoryId]
  );
  return result.rows[0] || null;
};

export const updateScanStatus = async (
  scanId: string,
  status: ScanStatus,
  errorMessage?: string
): Promise<Scan> => {
  const completedAt = ['completed', 'failed'].includes(status) ? 'NOW()' : 'NULL';
  const result = await query<Scan>(
    `UPDATE scans 
     SET status = $1, 
         error_message = $2,
         completed_at = ${completedAt}
     WHERE id = $3
     RETURNING *`,
    [status, errorMessage || null, scanId]
  );
  return result.rows[0];
};

export const updateScanResults = async (
  scanId: string,
  data: {
    totalFiles: number;
    totalIssues: number;
    hauntingLevel: string;
  }
): Promise<Scan> => {
  const result = await query<Scan>(
    `UPDATE scans 
     SET total_files = $1,
         total_files_discovered = $1,
         files_processed = $1,
         progress_percentage = 100,
         total_issues = $2,
         haunting_level = $3,
         status = 'completed',
         completed_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [data.totalFiles, data.totalIssues, data.hauntingLevel, scanId]
  );
  return result.rows[0];
};

export const deleteScan = async (scanId: string): Promise<void> => {
  await query('DELETE FROM scans WHERE id = $1', [scanId]);
};

// Progress tracking functions
export const updateScanProgress = async (
  scanId: string,
  data: {
    progressPercentage: number;
    filesProcessed: number;
    totalFilesDiscovered: number;
    currentStatusMessage?: string;
  }
): Promise<Scan> => {
  const result = await query<Scan>(
    `UPDATE scans 
     SET progress_percentage = $1,
         files_processed = $2,
         total_files_discovered = $3,
         current_status_message = $4
     WHERE id = $5
     RETURNING *`,
    [
      data.progressPercentage,
      data.filesProcessed,
      data.totalFilesDiscovered,
      data.currentStatusMessage || null,
      scanId,
    ]
  );
  return result.rows[0];
};

export const getScanProgress = async (scanId: string): Promise<{
  progressPercentage: number;
  filesProcessed: number;
  totalFilesDiscovered: number;
  currentStatusMessage?: string;
} | null> => {
  const result = await query<Scan>(
    `SELECT progress_percentage, files_processed, total_files_discovered, current_status_message
     FROM scans 
     WHERE id = $1`,
    [scanId]
  );
  
  if (!result.rows[0]) {
    return null;
  }

  return {
    progressPercentage: result.rows[0].progressPercentage,
    filesProcessed: result.rows[0].filesProcessed,
    totalFilesDiscovered: result.rows[0].totalFilesDiscovered,
    currentStatusMessage: result.rows[0].currentStatusMessage,
  };
};

// Throttled progress update - only updates if enough time has passed
const progressUpdateCache = new Map<string, number>();
const PROGRESS_UPDATE_THROTTLE_MS = 1000; // 1 second

export const updateScanProgressThrottled = async (
  scanId: string,
  data: {
    progressPercentage: number;
    filesProcessed: number;
    totalFilesDiscovered: number;
    currentStatusMessage?: string;
  }
): Promise<Scan | null> => {
  const now = Date.now();
  const lastUpdate = progressUpdateCache.get(scanId) || 0;
  
  // Only update if more than 1 second has passed since last update
  if (now - lastUpdate < PROGRESS_UPDATE_THROTTLE_MS) {
    return null; // Skip this update
  }
  
  progressUpdateCache.set(scanId, now);
  return updateScanProgress(scanId, data);
};

// Cancel scan
export const cancelScan = async (scanId: string): Promise<Scan> => {
  const result = await query<Scan>(
    `UPDATE scans 
     SET status = 'cancelled',
         cancelled_at = NOW(),
         completed_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [scanId]
  );
  return result.rows[0];
};
