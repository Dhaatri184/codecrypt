import { HauntingType, Issue } from '@codecrypt/shared';
import { repositoryCloner } from './cloner';
import { fileDiscovery, DiscoveredFile } from './fileDiscovery';
import { parser } from './parser';
import { logger } from './utils/logger';

export interface ScanConfig {
  cloneUrl: string;
  branch?: string;
  repositoryId: string;
  scanId?: string; // Optional for backward compatibility
}

export interface ProgressUpdate {
  scanId: string;
  filesProcessed: number;
  totalFiles: number;
  progressPercentage: number;
  statusMessage: string;
}

export interface ScannerCallbacks {
  onProgress?: (update: ProgressUpdate) => Promise<void>;
  shouldCancel?: () => Promise<boolean>;
}

export interface ScanResult {
  repositoryId: string;
  commitSha: string;
  totalFiles: number;
  totalIssues: number;
  issuesByType: Record<HauntingType, number>;
  hauntingLevel: string;
  issues: Array<Omit<Issue, 'id' | 'scanId' | 'createdAt'>>;
  scannedAt: Date;
}

export class Scanner {
  // OPTIMIZED: Cache rules to avoid repeated imports
  private rulesCache: any[] | null = null;

  private async getRules() {
    if (!this.rulesCache) {
      const { allRules } = await import('./rules');
      this.rulesCache = allRules;
    }
    return this.rulesCache;
  }

  async scan(config: ScanConfig, callbacks?: ScannerCallbacks): Promise<ScanResult> {
    let repoPath: string | null = null;
    let lastProgressUpdate = 0;
    const PROGRESS_UPDATE_INTERVAL_MS = 1000; // Update every 1 second
    
    // Use scanId if provided, otherwise fall back to repositoryId
    const scanId = config.scanId || config.repositoryId;

    try {
      logger.info('Starting scan', { config, scanId });

      // Report: Cloning repository
      if (callbacks?.onProgress) {
        await callbacks.onProgress({
          scanId,
          filesProcessed: 0,
          totalFiles: 0,
          progressPercentage: 0,
          statusMessage: 'Cloning repository...',
        });
      }

      // Clone repository
      repoPath = await repositoryCloner.clone(config.cloneUrl, config.branch || 'main');

      // Get commit SHA
      const commitSha = await repositoryCloner.getCommitSha(repoPath);

      // Report: Discovering files
      if (callbacks?.onProgress) {
        await callbacks.onProgress({
          scanId,
          filesProcessed: 0,
          totalFiles: 0,
          progressPercentage: 0,
          statusMessage: 'Discovering files...',
        });
      }

      // Discover files
      const files = await fileDiscovery.discoverFiles(repoPath);
      const totalFiles = files.length;

      // Handle edge case: zero files
      if (totalFiles === 0) {
        if (callbacks?.onProgress) {
          await callbacks.onProgress({
            scanId,
            filesProcessed: 0,
            totalFiles: 0,
            progressPercentage: 100,
            statusMessage: 'No files to scan',
          });
        }
      }

      // Scan files in parallel (much faster!)
      const issues: Array<Omit<Issue, 'id' | 'scanId' | 'createdAt'>> = [];
      
      // OPTIMIZED: Increased batch size to 100 for better throughput
      // Larger batches = fewer progress updates = faster scanning
      // Adjust based on available memory (100 works well for most repos)
      const batchSize = 100;
      for (let i = 0; i < files.length; i += batchSize) {
        // Check for cancellation
        if (callbacks?.shouldCancel && await callbacks.shouldCancel()) {
          logger.info('Scan cancelled by user', { config });
          throw new Error('SCAN_CANCELLED');
        }

        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(file => this.scanFile(file))
        );
        
        // OPTIMIZED: Use spread operator for better performance
        for (const fileIssues of batchResults) {
          issues.push(...fileIssues);
        }
        
        const filesProcessed = Math.min(i + batchSize, files.length);
        const progressPercentage = Math.floor((filesProcessed / totalFiles) * 100);

        // Report progress (throttled)
        const now = Date.now();
        if (callbacks?.onProgress && (now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL_MS || filesProcessed === totalFiles)) {
          await callbacks.onProgress({
            scanId,
            filesProcessed,
            totalFiles,
            progressPercentage,
            statusMessage: `Scanning files... ${filesProcessed} of ${totalFiles}`,
          });
          lastProgressUpdate = now;
        }
      }

      // Calculate metrics
      const issuesByType = this.calculateIssuesByType(issues);
      const hauntingLevel = this.calculateHauntingLevel(issues);

      const result: ScanResult = {
        repositoryId: config.repositoryId,
        commitSha,
        totalFiles: files.length,
        totalIssues: issues.length,
        issuesByType,
        hauntingLevel,
        issues,
        scannedAt: new Date(),
      };

      logger.info('Scan complete', {
        repositoryId: config.repositoryId,
        totalFiles: result.totalFiles,
        totalIssues: result.totalIssues,
      });

      return result;
    } catch (error) {
      logger.error('Scan failed', { config, error });
      throw error;
    } finally {
      // Cleanup
      if (repoPath) {
        await repositoryCloner.cleanup(repoPath);
      }
    }
  }

  private async scanFile(
    file: DiscoveredFile
  ): Promise<Array<Omit<Issue, 'id' | 'scanId' | 'createdAt'>>> {
    const issues: Array<Omit<Issue, 'id' | 'scanId' | 'createdAt'>> = [];

    try {
      // Parse file
      const parseResult = parser.parse(file.content, file.relativePath);

      if (!parseResult.success) {
        // Add parse error as an issue
        issues.push({
          hauntingType: 'monster',
          severity: 'medium',
          filePath: file.relativePath,
          startLine: 1,
          endLine: 1,
          codeSnippet: file.content.substring(0, 100),
          ruleId: 'parse-error',
          message: `Failed to parse file: ${parseResult.error}`,
        });
        return issues;
      }

      // OPTIMIZED: Use cached rules
      const allRules = await this.getRules();
      const ruleContext = {
        ast: parseResult.ast,
        filePath: file.relativePath,
        content: file.content,
      };

      // OPTIMIZED: Apply all rules and collect issues
      for (const rule of allRules) {
        const ruleIssues = rule.detect(ruleContext);
        // Add filePath to each issue
        for (const issue of ruleIssues) {
          issues.push({
            ...issue,
            filePath: file.relativePath,
          });
        }
      }

    } catch (error) {
      logger.error('Error scanning file', { file: file.relativePath, error });
    }

    return issues;
  }

  private calculateIssuesByType(
    issues: Array<Omit<Issue, 'id' | 'scanId' | 'createdAt'>>
  ): Record<HauntingType, number> {
    const counts: Record<HauntingType, number> = {
      ghost: 0,
      zombie: 0,
      vampire: 0,
      skeleton: 0,
      monster: 0,
    };

    for (const issue of issues) {
      counts[issue.hauntingType]++;
    }

    return counts;
  }

  private calculateHauntingLevel(
    issues: Array<Omit<Issue, 'id' | 'scanId' | 'createdAt'>>
  ): string {
    const totalIssues = issues.length;
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;

    if (totalIssues === 0) {
      return 'Blessed';
    } else if (criticalCount > 0 || highCount > 5) {
      return 'Severely Cursed';
    } else if (totalIssues > 20) {
      return 'Heavily Haunted';
    } else if (totalIssues > 10) {
      return 'Moderately Haunted';
    } else {
      return 'Mildly Cursed';
    }
  }
}

export const scanner = new Scanner();
