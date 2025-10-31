import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from '../database/database.module';
import { AIProvidersController } from './ai-providers.controller';
import { AIProviderRegistryService } from './services/ai-provider-registry.service';
import { AIRequestManagerService } from './services/ai-request-manager.service';
import { AIMonitoringService } from './services/ai-monitoring.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';

/**
 * AIProvidersModule - AI Service Integration Layer
 *
 * Provides comprehensive AI provider management with:
 * - Multi-provider support (OpenAI, Anthropic, Google, Custom)
 * - Dynamic provider registration and configuration
 * - Intelligent request routing and load balancing
 * - Fallback mechanism with circuit breaker pattern
 * - Retry logic with exponential backoff
 * - Response normalization and validation
 * - Streaming response support
 * - Token counting and usage tracking
 * - Cost monitoring and analytics
 * - Performance metrics and alerting
 */
@Module({
  imports: [
    DatabaseModule,
    CacheModule.register({
      ttl: 3600000, // 1 hour cache TTL
      max: 1000, // Maximum cached items
    }),
  ],
  controllers: [AIProvidersController],
  providers: [
    AIProviderRegistryService,
    AIRequestManagerService,
    AIMonitoringService,
    CircuitBreakerService,
  ],
  exports: [AIProviderRegistryService, AIRequestManagerService, AIMonitoringService],
})
export class AIProvidersModule {}
