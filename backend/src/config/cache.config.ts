import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  // Redis cache configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour default
    max: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  },

  // Multi-level caching strategy
  strategy: {
    levels: ['memory', 'redis', 'database'],
    memoryTtl: parseInt(process.env.CACHE_MEMORY_TTL || '300', 10), // 5 minutes
    redisTtl: parseInt(process.env.CACHE_REDIS_TTL || '3600', 10), // 1 hour
    enableStaleWhileRevalidate: process.env.CACHE_SWR_ENABLED === 'true',
    staleTimeout: parseInt(process.env.CACHE_STALE_TIMEOUT || '60', 10), // seconds
  },

  // Cache invalidation
  invalidation: {
    patterns: {
      tasks: ['task:*', 'tasks:*', 'pipeline:*'],
      templates: ['template:*', 'templates:*'],
      aiProviders: ['ai-provider:*', 'ai-providers:*'],
      users: ['user:*', 'users:*'],
    },
    cascading: process.env.CACHE_CASCADING_INVALIDATION === 'true',
  },

  // Query result caching
  queryCache: {
    enabled: process.env.QUERY_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.QUERY_CACHE_TTL || '600', 10), // 10 minutes
    maxSize: parseInt(process.env.QUERY_CACHE_MAX_SIZE || '100', 10), // MB
    excludePatterns: ['*password*', '*token*', '*secret*'],
  },

  // Response caching
  responseCache: {
    enabled: process.env.RESPONSE_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.RESPONSE_CACHE_TTL || '300', 10), // 5 minutes
    methods: ['GET', 'HEAD'],
    excludePaths: ['/health', '/metrics', '/auth/login', '/auth/refresh'],
    includeQuery: process.env.RESPONSE_CACHE_INCLUDE_QUERY === 'true',
  },

  // Compression
  compression: {
    enabled: process.env.CACHE_COMPRESSION_ENABLED === 'true',
    threshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD || '1024', 10), // bytes
    algorithm: process.env.CACHE_COMPRESSION_ALGORITHM || 'gzip', // gzip, deflate, br
  },
}));
