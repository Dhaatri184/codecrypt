import dotenv from 'dotenv';
dotenv.config();

import { scanner } from './scanner';
import { logger } from './utils/logger';

export { scanner, Scanner, ScanConfig, ScanResult } from './scanner';
export { repositoryCloner, RepositoryCloner } from './cloner';
export { fileDiscovery, FileDiscovery } from './fileDiscovery';
export { parser, Parser } from './parser';

// If run directly (not imported)
if (require.main === module) {
  const testConfig = {
    cloneUrl: process.env.TEST_REPO_URL || 'https://github.com/example/repo.git',
    branch: 'main',
    repositoryId: 'test-repo-id',
  };

  scanner
    .scan(testConfig)
    .then(result => {
      logger.info('Scan result', { result });
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      logger.error('Scan error', { error });
      process.exit(1);
    });
}
