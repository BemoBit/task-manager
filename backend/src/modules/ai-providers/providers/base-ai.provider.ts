import { Logger } from '@nestjs/common';
import {
  AIProviderConfig,
  IAIProvider,
  AIProviderType,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AIProviderStatus,
} from '../interfaces/ai-provider.interface';

/**
 * Abstract base class for all AI provider implementations
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseAIProvider implements IAIProvider {
  protected readonly logger: Logger;
  protected initialized = false;
  protected requestCount = 0;
  protected lastRequestTime?: Date;

  constructor(public readonly config: AIProviderConfig) {
    this.logger = new Logger(`${this.constructor.name}:${config.name}`);
  }

  abstract get type(): AIProviderType;

  /**
   * Initialize the provider - must be implemented by subclasses
   */
  abstract initialize(): Promise<void>;

  /**
   * Send a completion request - must be implemented by subclasses
   */
  abstract complete(request: AIRequest): Promise<AIResponse>;

  /**
   * Send a streaming completion request - must be implemented by subclasses
   */
  abstract streamComplete(request: AIRequest): AsyncGenerator<AIStreamChunk, void, unknown>;

  /**
   * Generate embeddings - must be implemented by subclasses
   */
  abstract generateEmbeddings(text: string | string[]): Promise<number[][]>;

  /**
   * Provider-specific token counting
   */
  abstract countTokens(text: string): Promise<number>;

  /**
   * Validate provider configuration
   */
  async validateConfig(): Promise<boolean> {
    try {
      if (!this.config.apiKey || this.config.apiKey.length === 0) {
        this.logger.error('API key is missing');
        return false;
      }

      if (!this.config.model || this.config.model.length === 0) {
        this.logger.error('Model is not specified');
        return false;
      }

      if (this.config.maxTokens <= 0) {
        this.logger.error('Invalid max tokens configuration');
        return false;
      }

      if (this.config.temperature < 0 || this.config.temperature > 2) {
        this.logger.error('Temperature must be between 0 and 2');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Configuration validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Health check - can be overridden by subclasses
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.initialized) {
      return { healthy: false, message: 'Provider not initialized' };
    }

    if (this.config.status === AIProviderStatus.ERROR) {
      return { healthy: false, message: 'Provider in error state' };
    }

    if (this.config.status === AIProviderStatus.RATE_LIMITED) {
      return { healthy: false, message: 'Provider is rate limited' };
    }

    if (!this.config.isActive) {
      return { healthy: false, message: 'Provider is disabled' };
    }

    return { healthy: true };
  }

  /**
   * Optimize prompt for the provider - can be overridden
   */
  async optimizePrompt(prompt: string): Promise<string> {
    // Base implementation - just trim and remove extra spaces
    return prompt.trim().replace(/\s+/g, ' ');
  }

  /**
   * Merge request parameters with provider defaults
   */
  protected mergeRequestConfig(request: AIRequest): AIRequest {
    return {
      ...request,
      temperature: request.temperature ?? this.config.temperature,
      maxTokens: request.maxTokens ?? this.config.maxTokens,
      topP: request.topP ?? this.config.topP,
      stop: request.stop ?? this.config.stopSequences,
    };
  }

  /**
   * Calculate cost based on token usage
   */
  protected calculateCost(
    promptTokens: number,
    completionTokens: number,
  ): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  } {
    const pricing = this.config.pricing || {
      inputTokenCost: 0,
      outputTokenCost: 0,
      currency: 'USD',
    };

    const inputCost = (promptTokens / 1000) * pricing.inputTokenCost;
    const outputCost = (completionTokens / 1000) * pricing.outputTokenCost;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: pricing.currency,
    };
  }

  /**
   * Track request metrics
   */
  protected trackRequest(): void {
    this.requestCount++;
    this.lastRequestTime = new Date();
  }

  /**
   * Handle provider errors with appropriate logging
   */
  protected handleError(error: Error, context: string): never {
    this.logger.error(`${context}: ${error.message}`, error.stack);
    throw error;
  }

  /**
   * Validate response format
   */
  protected validateResponse(response: AIResponse): boolean {
    if (!response.content && !response.functionCall) {
      this.logger.warn('Response has no content or function call');
      return false;
    }

    if (!response.usage || response.usage.totalTokens <= 0) {
      this.logger.warn('Invalid token usage in response');
      return false;
    }

    return true;
  }

  /**
   * Get request timeout with fallback
   */
  protected getTimeout(): number {
    return this.config.timeout || 60000; // 60 seconds default
  }

  /**
   * Check if provider is ready for requests
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Provider ${this.config.name} is not initialized`);
    }

    if (!this.config.isActive) {
      throw new Error(`Provider ${this.config.name} is disabled`);
    }

    if (this.config.status === AIProviderStatus.ERROR) {
      throw new Error(`Provider ${this.config.name} is in error state`);
    }
  }

  /**
   * Format messages for API request
   */
  protected formatMessages(request: AIRequest): unknown[] {
    const messages: unknown[] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    if (request.messages && request.messages.length > 0) {
      messages.push(...request.messages);
    } else if (request.prompt) {
      messages.push({
        role: 'user',
        content: request.prompt,
      });
    }

    return messages;
  }

  /**
   * Get provider metrics
   */
  getMetrics() {
    return {
      providerId: this.config.id,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      status: this.config.status,
      isActive: this.config.isActive,
    };
  }
}
