import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  tags?: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

@Injectable()
export class MultiLevelCacheService {
  private readonly logger = new Logger(MultiLevelCacheService.name);
  private readonly memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly redis: Redis;
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    // Initialize Redis connection
    const redisConfig = this.configService.get('cache.redis');
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    // Start periodic cleanup for memory cache
    this.startMemoryCacheCleanup();
  }

  /**
   * Get value from multi-level cache (memory -> redis -> miss)
   */
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Level 2: Redis cache
    const redisResult = await this.getFromRedis<T>(key);
    if (redisResult !== null) {
      // Populate memory cache
      const memoryTtl = this.configService.get('cache.strategy.memoryTtl');
      this.setInMemory(key, redisResult, memoryTtl);
      return redisResult;
    }

    return null;
  }

  /**
   * Set value in multi-level cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = (options?.ttl || this.configService.get<number>('cache.redis.ttl')) as number;
    const memoryTtl = this.configService.get<number>('cache.strategy.memoryTtl') as number;
    const tags = options?.tags || [];

    // Store in memory cache
    this.setInMemory(key, value, memoryTtl, tags);

    // Store in Redis
    await this.setInRedis(key, value, ttl, options?.compress, tags);
  }

  /**
   * Delete from all cache levels
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redis.del(key);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    let count = 0;

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // Clear from Redis using SCAN
    const keys = await this.scanKeys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      count += keys.length;
    }

    this.logger.log(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
    return count;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;

    // Clear from memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // For Redis, we store tag -> keys mapping
    const tagKey = `tag:${tag}`;
    const keys = await this.redis.smembers(tagKey);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      await this.redis.del(tagKey);
      count += keys.length;
    }

    this.logger.log(`Invalidated ${count} cache entries with tag: ${tag}`);
    return count;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: { size: number; hits: number; misses: number };
    redis: { size: number; memoryUsage: string };
  }> {
    const memorySize = this.memoryCache.size;
    const redisInfo = await this.redis.info('memory');
    const memoryUsage = this.parseRedisMemoryUsage(redisInfo);

    return {
      memory: {
        size: memorySize,
        hits: 0, // TODO: Implement hit tracking
        misses: 0, // TODO: Implement miss tracking
      },
      redis: {
        size: await this.redis.dbsize(),
        memoryUsage,
      },
    };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.redis.flushdb();
    this.logger.log('All caches cleared');
  }

  /**
   * Wrap a function with caching
   */
  async wrap<T>(key: string, fn: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  // Private helper methods

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setInMemory<T>(key: string, value: T, ttl: number, tags?: string[]): void {
    const maxItems = this.configService.get('cache.redis.max');
    
    // Simple LRU: remove oldest if at capacity
    if (this.memoryCache.size >= maxItems) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
      tags,
    });
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }

      // Check if compressed
      if (value.startsWith('gzip:')) {
        const compressed = Buffer.from(value.substring(5), 'base64');
        const decompressed = await gunzip(compressed);
        return JSON.parse(decompressed.toString());
      }

      return JSON.parse(value);
    } catch (error) {
      this.logger.error(
        `Error getting from Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  private async setInRedis<T>(
    key: string,
    value: T,
    ttl: number,
    compress?: boolean,
    tags?: string[],
  ): Promise<void> {
    try {
      let serialized = JSON.stringify(value);
      const compressionConfig = this.configService.get('cache.compression');

      // Compress if enabled and data exceeds threshold
      if (
        (compress || compressionConfig.enabled) &&
        serialized.length > compressionConfig.threshold
      ) {
        const compressed = await gzip(Buffer.from(serialized));
        serialized = `gzip:${compressed.toString('base64')}`;
      }

      await this.redis.setex(key, ttl, serialized);

      // Store tag mappings
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await this.redis.sadd(`tag:${tag}`, key);
          await this.redis.expire(`tag:${tag}`, ttl);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error setting in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  private parseRedisMemoryUsage(info: string): string {
    const match = info.match(/used_memory_human:(.+)/);
    return match ? match[1].trim() : 'unknown';
  }

  private startMemoryCacheCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp > entry.ttl * 1000) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.debug(`Cleaned up ${cleaned} expired entries from memory cache`);
      }
    }, 300000); // 5 minutes
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    await this.redis.quit();
  }
}
