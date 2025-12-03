import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class CacheService {
  private client: RedisClientType | null = null;
  private connected: boolean = false;

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err });
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      this.connected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.connected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error('Cache invalidate pattern error', { pattern, error });
      return 0;
    }
  }

  // Cache GitHub API responses
  async cacheGitHubResponse(endpoint: string, data: any, ttl: number = 300) {
    const key = `github:${endpoint}`;
    await this.set(key, data, ttl);
  }

  async getGitHubResponse<T>(endpoint: string): Promise<T | null> {
    const key = `github:${endpoint}`;
    return this.get<T>(key);
  }

  // Cache scan results
  async cacheScanResults(scanId: string, results: any, ttl: number = 3600) {
    const key = `scan:${scanId}:results`;
    await this.set(key, results, ttl);
  }

  async getScanResults(scanId: string): Promise<any | null> {
    const key = `scan:${scanId}:results`;
    return this.get(key);
  }

  async invalidateScanCache(repositoryId: string) {
    await this.invalidatePattern(`scan:*:${repositoryId}:*`);
  }

  // Scan cancellation flags
  async setCancellationFlag(scanId: string, ttl: number = 3600): Promise<boolean> {
    const key = `scan:${scanId}:cancel`;
    if (!this.connected || !this.client) {
      logger.warn('Redis not connected, cannot set cancellation flag');
      return false;
    }

    try {
      await this.client.setEx(key, ttl, '1');
      logger.info('Cancellation flag set', { scanId });
      return true;
    } catch (error) {
      logger.error('Failed to set cancellation flag', { scanId, error });
      return false;
    }
  }

  async checkCancellationFlag(scanId: string): Promise<boolean> {
    const key = `scan:${scanId}:cancel`;
    if (!this.connected || !this.client) {
      // Fallback: if Redis is down, check database status
      logger.warn('Redis not connected, cannot check cancellation flag');
      return false;
    }

    try {
      const value = await this.client.get(key);
      return value === '1';
    } catch (error) {
      logger.error('Failed to check cancellation flag', { scanId, error });
      return false;
    }
  }

  async clearCancellationFlag(scanId: string): Promise<boolean> {
    const key = `scan:${scanId}:cancel`;
    return this.del(key);
  }

  // Progress caching for faster reads
  async cacheProgress(scanId: string, progress: {
    progressPercentage: number;
    filesProcessed: number;
    totalFilesDiscovered: number;
    currentStatusMessage?: string;
  }, ttl: number = 3600): Promise<boolean> {
    const key = `scan:${scanId}:progress`;
    return this.set(key, progress, ttl);
  }

  async getProgress(scanId: string): Promise<{
    progressPercentage: number;
    filesProcessed: number;
    totalFilesDiscovered: number;
    currentStatusMessage?: string;
  } | null> {
    const key = `scan:${scanId}:progress`;
    return this.get(key);
  }
}

export const cacheService = new CacheService();
