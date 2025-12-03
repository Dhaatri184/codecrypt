import { glob } from 'glob';
import path from 'path';
import { promises as fs } from 'fs';
import { logger } from './utils/logger';

export interface DiscoveredFile {
  path: string;
  relativePath: string;
  content: string;
  size: number;
}

export class FileDiscovery {
  private patterns: string[];
  private ignorePatterns: string[];

  constructor() {
    this.patterns = [
      // JavaScript/TypeScript
      '**/*.js',
      '**/*.jsx',
      '**/*.ts',
      '**/*.tsx',
      // Java
      '**/*.java',
      // Python
      '**/*.py',
      // C/C++
      '**/*.c',
      '**/*.cpp',
      '**/*.h',
      '**/*.hpp',
      // C#
      '**/*.cs',
      // Go
      '**/*.go',
      // Ruby
      '**/*.rb',
      // PHP
      '**/*.php',
    ];

    this.ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/target/**',  // Java build output
      '**/.git/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/__tests__/**',
      '**/*.test.js',
      '**/*.test.ts',
      '**/*.spec.js',
      '**/*.spec.ts',
      '**/*.class',  // Java compiled files
      '**/vendor/**',
      '**/public/**',
      '**/assets/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/__pycache__/**',  // Python cache
      '**/bin/**',  // Binary output
      '**/obj/**',  // C# build output
    ];
  }

  async discoverFiles(repoPath: string): Promise<DiscoveredFile[]> {
    try {
      logger.info('Discovering files', { repoPath });

      const files: DiscoveredFile[] = [];

      // OPTIMIZED: Collect all file paths first, then read in parallel
      const allMatches: string[] = [];
      for (const pattern of this.patterns) {
        const matches = await glob(pattern, {
          cwd: repoPath,
          ignore: this.ignorePatterns,
          absolute: false,
        });
        allMatches.push(...matches);
      }

      // OPTIMIZED: Read files in parallel batches of 50
      const batchSize = 50;
      for (let i = 0; i < allMatches.length; i += batchSize) {
        const batch = allMatches.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (match) => {
            const fullPath = path.join(repoPath, match);
            
            try {
              const stats = await fs.stat(fullPath);
              
              // Skip files larger than 1MB
              if (stats.size > 1024 * 1024) {
                logger.warn('Skipping large file', { path: match, size: stats.size });
                return null;
              }

              const content = await fs.readFile(fullPath, 'utf-8');

              return {
                path: fullPath,
                relativePath: match,
                content,
                size: stats.size,
              };
            } catch (error) {
              logger.warn('Error reading file', { path: match, error });
              return null;
            }
          })
        );

        // Filter out null results and add to files array
        files.push(...batchResults.filter((f): f is DiscoveredFile => f !== null));
      }

      logger.info('File discovery complete', { 
        repoPath, 
        totalFiles: files.length 
      });

      return files;
    } catch (error) {
      logger.error('Error discovering files', { repoPath, error });
      throw new Error(`Failed to discover files: ${error.message}`);
    }
  }

  async findPackageJson(repoPath: string): Promise<any | null> {
    try {
      const packageJsonPath = path.join(repoPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.debug('No package.json found', { repoPath });
      return null;
    }
  }

  async findTestFiles(repoPath: string): Promise<string[]> {
    try {
      const testPatterns = [
        '**/*.test.js',
        '**/*.test.ts',
        '**/*.spec.js',
        '**/*.spec.ts',
        '**/__tests__/**/*.js',
        '**/__tests__/**/*.ts',
      ];

      const testFiles: string[] = [];

      for (const pattern of testPatterns) {
        const matches = await glob(pattern, {
          cwd: repoPath,
          ignore: this.ignorePatterns,
          absolute: false,
        });
        testFiles.push(...matches);
      }

      return testFiles;
    } catch (error) {
      logger.error('Error finding test files', { repoPath, error });
      return [];
    }
  }
}

export const fileDiscovery = new FileDiscovery();
