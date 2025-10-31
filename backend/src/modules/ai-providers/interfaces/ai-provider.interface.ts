/**
 * Core interfaces for AI provider abstraction
 */

export enum AIProviderType {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE = 'GOOGLE',
  CUSTOM = 'CUSTOM',
}

export enum AIProviderStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}

export interface AIProviderConfig {
  id: string;
  name: string;
  type: AIProviderType;
  apiKey: string;
  endpoint?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  customHeaders?: Record<string, string>;
  customParameters?: Record<string, unknown>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  pricing?: {
    inputTokenCost: number; // Cost per 1K tokens
    outputTokenCost: number; // Cost per 1K tokens
    currency: string;
  };
  priority?: number;
  isActive: boolean;
  status: AIProviderStatus;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  messages?: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  functionCalls?: AIFunction[];
  responseFormat?: 'text' | 'json' | 'json_object';
  stop?: string[];
  userId?: string;
  metadata?: Record<string, unknown>;
  priority?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AIResponse {
  id: string;
  providerId: string;
  providerType: AIProviderType;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  };
  latency: number; // milliseconds
  cached: boolean;
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface AIStreamChunk {
  id: string;
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProviderMetrics {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalTokensUsed: number;
  totalCost: number;
  lastUsed: Date;
  errorRate: number;
  uptime: number;
}

export interface CircuitBreakerState {
  providerId: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
}

/**
 * Abstract interface that all AI providers must implement
 */
export interface IAIProvider {
  readonly config: AIProviderConfig;
  readonly type: AIProviderType;
  
  /**
   * Initialize the provider with configuration
   */
  initialize(): Promise<void>;
  
  /**
   * Send a completion request to the AI provider
   */
  complete(request: AIRequest): Promise<AIResponse>;
  
  /**
   * Send a streaming completion request
   */
  streamComplete(request: AIRequest): AsyncGenerator<AIStreamChunk, void, unknown>;
  
  /**
   * Generate embeddings for text
   */
  generateEmbeddings(text: string | string[]): Promise<number[][]>;
  
  /**
   * Validate the provider configuration
   */
  validateConfig(): Promise<boolean>;
  
  /**
   * Get current provider health status
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
  
  /**
   * Count tokens in text (provider-specific)
   */
  countTokens(text: string): Promise<number>;
  
  /**
   * Optimize prompt for the provider
   */
  optimizePrompt(prompt: string): Promise<string>;
}

export interface AIProviderFactory {
  create(config: AIProviderConfig): IAIProvider;
  supports(type: AIProviderType): boolean;
}
