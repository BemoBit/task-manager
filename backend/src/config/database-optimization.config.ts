import { registerAs } from '@nestjs/config';

export default registerAs('databaseOptimization', () => ({
  // Connection pooling configuration
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
  },

  // Read replica configuration
  readReplicas: {
    enabled: process.env.DB_READ_REPLICAS_ENABLED === 'true',
    urls: process.env.DB_READ_REPLICA_URLS?.split(',').filter(Boolean) || [],
    loadBalancing: process.env.DB_READ_REPLICA_LOAD_BALANCING || 'round-robin', // round-robin, random, weighted
  },

  // Query optimization
  queryOptimization: {
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000', 10), // ms
    enableQueryLogging: process.env.DB_ENABLE_QUERY_LOGGING === 'true',
    explainAnalyze: process.env.DB_EXPLAIN_ANALYZE === 'true',
  },

  // Partitioning configuration
  partitioning: {
    enabled: process.env.DB_PARTITIONING_ENABLED === 'true',
    strategy: process.env.DB_PARTITIONING_STRATEGY || 'range', // range, list, hash
    tables: ['tasks', 'subtasks', 'ai_usage_logs', 'audit_logs', 'pipeline_events'],
  },

  // Performance monitoring
  monitoring: {
    enabled: process.env.DB_MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.DB_METRICS_INTERVAL || '60000', 10), // ms
    alertThresholds: {
      connectionPoolUtilization: parseFloat(process.env.DB_ALERT_POOL_UTILIZATION || '0.8'),
      queryDuration: parseInt(process.env.DB_ALERT_QUERY_DURATION || '5000', 10), // ms
      errorRate: parseFloat(process.env.DB_ALERT_ERROR_RATE || '0.05'),
    },
  },
}));
