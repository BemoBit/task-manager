import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AIProviderRegistryService } from './ai-provider-registry.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import {
  AIRequest,
  AIResponse,
  AIStreamChunk,
  IAIProvider,
} from '../interfaces/ai-provider.interface';
import { createHash } from 'crypto';

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * AI Request Manager with intelligent routing, load balancing, retries, and caching
 */
@Injectable()
export class AIRequestManagerService {
  private readonly logger = new Logger(AIRequestManagerService.name);
  private readonly retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  constructor(
    private readonly providerRegistry: AIProviderRegistryService,
    private readonly circuitBreaker: CircuitBreakerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Send a completion request with automatic provider selection and failover
   */
  async complete(request: AIRequest, providerId?: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Check cache first
      if (!request.stream) {
        const cached = await this.getCachedResponse(request);
        if (cached) {
          this.logger.debug('Returning cached response');
          return { ...cached, cached: true, latency: Date.now() - startTime };
        }
      }

      // Select provider(s) for the request
      const providers = providerId
        ? [this.providerRegistry.getProvider(providerId)]
        : await this.selectProviders(request);

      if (providers.length === 0) {
        throw new Error('No available AI providers');
      }

      // Try each provider with circuit breaker and retries
      let lastError: Error | null = null;

      for (const provider of providers) {
        try {
          const response = await this.executeWithRetry(provider, request);

          // Cache successful response
          if (!request.stream) {
            await this.cacheResponse(request, response);
          }

          return response;
        } catch (error) {
          lastError = error;
          this.logger.warn(`Provider ${provider.config.name} failed: ${error.message}`);
          await this.circuitBreaker.recordFailure(provider.config.id, error);
        }
      }

      throw lastError || new Error('All providers failed');
    } catch (error) {
      this.logger.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stream completion with automatic provider selection
   */
  async *streamComplete(
    request: AIRequest,
    providerId?: string,
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const providers = providerId
      ? [this.providerRegistry.getProvider(providerId)]
      : await this.selectProviders(request);

    if (providers.length === 0) {
      throw new Error('No available AI providers');
    }

    // Try streaming from first available provider
    for (const provider of providers) {
      try {
        const canProceed = await this.circuitBreaker.shouldAllowRequest(provider.config.id);
        if (!canProceed) {
          continue;
        }

        yield* provider.streamComplete(request);

        // Record success if stream completed
        await this.circuitBreaker.recordSuccess(provider.config.id);
        return;
      } catch (error) {
        this.logger.warn(`Provider ${provider.config.name} stream failed: ${error.message}`);
        await this.circuitBreaker.recordFailure(provider.config.id, error);
      }
    }

    throw new Error('All providers failed for streaming');
  }

  /**
   * Execute request with exponential backoff retry
   */
  private async executeWithRetry(provider: IAIProvider, request: AIRequest): Promise<AIResponse> {
    let attempt = 0;
    let delay = this.retryConfig.initialDelay;

    while (attempt < this.retryConfig.maxAttempts) {
      try {
        // Check circuit breaker
        const canProceed = await this.circuitBreaker.shouldAllowRequest(provider.config.id);
        if (!canProceed) {
          throw new Error(`Circuit breaker open for ${provider.config.name}`);
        }

        const response = await provider.complete(request);

        // Record success
        await this.circuitBreaker.recordSuccess(provider.config.id);

        return response;
      } catch (error) {
        attempt++;

        if (attempt >= this.retryConfig.maxAttempts) {
          throw error;
        }

        // Exponential backoff
        this.logger.warn(`Retry attempt ${attempt} for ${provider.config.name} after ${delay}ms`);

        await this.sleep(delay);
        delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelay);
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Select best providers for request based on load balancing and priority
   */
  private async selectProviders(_request: AIRequest): Promise<IAIProvider[]> {
    const allProviders = await this.providerRegistry.getHealthyProviders();

    if (allProviders.length === 0) {
      return [];
    }

    // Filter by circuit breaker state
    const availableProviders: IAIProvider[] = [];
    for (const provider of allProviders) {
      const canProceed = await this.circuitBreaker.shouldAllowRequest(provider.config.id);
      if (canProceed) {
        availableProviders.push(provider);
      }
    }

    // Sort by priority (higher first)
    availableProviders.sort((a, b) => {
      const priorityDiff = (b.config.priority || 0) - (a.config.priority || 0);
      return priorityDiff;
    });

    return availableProviders;
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(request: AIRequest): string {
    const key = JSON.stringify({
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      messages: request.messages,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });

    return `ai_response:${createHash('sha256').update(key).digest('hex')}`;
  }

  /**
   * Get cached response if available
   */
  private async getCachedResponse(request: AIRequest): Promise<AIResponse | null> {
    try {
      const cacheKey = this.getCacheKey(request);
      const cached = await this.cacheManager.get<AIResponse>(cacheKey);
      return cached || null;
    } catch (error) {
      this.logger.warn(`Cache get failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache response for future requests
   */
  private async cacheResponse(request: AIRequest, response: AIResponse): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(request);
      // Cache for 1 hour
      await this.cacheManager.set(cacheKey, response, 3600000);
    } catch (error) {
      this.logger.warn(`Cache set failed: ${error.message}`);
    }
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get request statistics
   */
  async getStatistics(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    circuitBreakerStates: unknown[];
  }> {
    const allProviders = this.providerRegistry.getAllProviders();
    const healthyProviders = await this.providerRegistry.getHealthyProviders();
    const circuitBreakerStates = this.circuitBreaker.getAllStates();

    return {
      totalProviders: allProviders.length,
      healthyProviders: healthyProviders.length,
      circuitBreakerStates,
    };
  }
}
