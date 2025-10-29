// Environment configuration schema
export interface EnvironmentVariables {
  // Application
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_TTL: number;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRATION: string;
  
  // Security
  BCRYPT_ROUNDS: number;
  RATE_LIMIT_TTL: number;
  RATE_LIMIT_MAX: number;
  
  // CORS
  CORS_ORIGIN: string;
  
  // AI Providers
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  
  // Email (optional)
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  
  // Logging
  LOG_LEVEL: string;
  LOG_DIR: string;
}
