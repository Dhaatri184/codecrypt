import simpleGit, { SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './utils/logger';

export class RepositoryCloner {
  private git: SimpleGit;
  private workDir: string;

  constructor(workDir: string = '/tmp/repos') {
    this.workDir = workDir;
    // simple-git will automatically find git in PATH
    // No need for explicit binary path configuration
    this.git = simpleGit();
  }

  async clone(cloneUrl: string, branch: string = 'main'): Promise<string> {
    try {
      // Create directory name based on repo (without timestamp for caching)
      const repoName = this.extractRepoName(cloneUrl);
      const repoPath = path.join(this.workDir, repoName);

      // Ensure work directory exists
      await fs.mkdir(this.workDir, { recursive: true });

      // Check if repository already exists (for caching)
      try {
        await fs.access(path.join(repoPath, '.git'));
        // Repository exists, pull latest changes instead of cloning
        logger.info('Repository exists, pulling latest changes', { repoPath, branch });
        const git = simpleGit(repoPath);
        
        try {
          await git.fetch(['origin', branch, '--depth', '1']);
          await git.reset(['--hard', `origin/${branch}`]);
          logger.info('Repository updated successfully', { repoPath });
          return repoPath;
        } catch (pullError) {
          // Pull failed, delete the directory and re-clone
          logger.warn('Failed to update repository, will re-clone', { repoPath, error: pullError.message });
          await fs.rm(repoPath, { recursive: true, force: true });
          // Fall through to clone
        }
      } catch {
        // Repository doesn't exist or was deleted, check if directory exists
        try {
          await fs.access(repoPath);
          // Directory exists but no .git - delete it
          logger.warn('Directory exists without .git, cleaning up', { repoPath });
          await fs.rm(repoPath, { recursive: true, force: true });
        } catch {
          // Directory doesn't exist, that's fine
        }
      }
      
      // Try to clone with specified branch first
      logger.info('Cloning repository', { cloneUrl, branch, repoPath });
      try {
        await this.git.clone(cloneUrl, repoPath, ['--depth', '1', '--branch', branch, '--single-branch']);
        logger.info('Repository cloned successfully', { repoPath, branch });
        return repoPath;
      } catch (branchError) {
        // Branch doesn't exist, try to detect default branch
        logger.warn('Specified branch not found, trying default branch', { branch, error: branchError.message });
        
        // Clean up failed clone attempt
        try {
          await fs.rm(repoPath, { recursive: true, force: true });
        } catch {}
        
        // Try common default branches
        const fallbackBranches = ['master', 'main', 'develop'];
        for (const fallbackBranch of fallbackBranches) {
          if (fallbackBranch === branch) continue; // Already tried this one
          
          try {
            logger.info('Trying fallback branch', { fallbackBranch, cloneUrl });
            await this.git.clone(cloneUrl, repoPath, ['--depth', '1', '--branch', fallbackBranch, '--single-branch']);
            logger.info('Repository cloned successfully with fallback branch', { repoPath, branch: fallbackBranch });
            return repoPath;
          } catch {
            // Clean up and try next branch
            try {
              await fs.rm(repoPath, { recursive: true, force: true });
            } catch {}
          }
        }
        
        // If all branches fail, clone without specifying branch (gets default)
        logger.info('Cloning without branch specification to get default', { cloneUrl });
        await this.git.clone(cloneUrl, repoPath, ['--depth', '1']);
        logger.info('Repository cloned successfully with default branch', { repoPath });
        return repoPath;
      }
    } catch (error) {
      logger.error('Error cloning repository', { cloneUrl, error });
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async pull(repoPath: string, branch: string = 'main'): Promise<void> {
    try {
      const git = simpleGit(repoPath);
      await git.pull('origin', branch);
      logger.info('Repository pulled successfully', { repoPath });
    } catch (error) {
      logger.error('Error pulling repository', { repoPath, error });
      throw new Error(`Failed to pull repository: ${error.message}`);
    }
  }

  async getCommitSha(repoPath: string): Promise<string> {
    try {
      const git = simpleGit(repoPath);
      const log = await git.log({ maxCount: 1 });
      
      // Check if repository has any commits
      if (!log.latest || !log.latest.hash) {
        logger.warn('Repository has no commits', { repoPath });
        throw new Error('Repository is empty - no commits found. Please add some code to the repository first.');
      }
      
      return log.latest.hash;
    } catch (error) {
      logger.error('Error getting commit SHA', { repoPath, error });
      
      // Provide user-friendly error message for empty repos
      if (error.message && error.message.includes('does not have any commits')) {
        throw new Error('Repository is empty - no commits found. Please add some code to the repository first.');
      }
      
      throw new Error(`Failed to get commit SHA: ${error.message}`);
    }
  }

  async cleanup(repoPath: string): Promise<void> {
    // OPTIMIZATION: Keep repositories cached for faster subsequent scans
    // Instead of deleting, we just log that scan is complete
    // The repository will be reused on next scan (much faster!)
    logger.info('Scan complete, repository cached for future scans', { repoPath });
    
    // Optional: Implement cleanup of old repos if disk space is a concern
    // For now, we keep them for performance
  }

  private extractRepoName(cloneUrl: string): string {
    // Extract repo name from URL like https://github.com/user/repo.git
    const match = cloneUrl.match(/\/([^\/]+?)(\.git)?$/);
    return match ? match[1] : 'unknown';
  }
}

export const repositoryCloner = new RepositoryCloner();
