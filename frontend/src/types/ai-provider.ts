/**
 * AI Provider Types
 * Defines all types for AI provider configuration and management
 */

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'custom';

export type AIProviderStatus = 'active' | 'inactive' | 'error' | 'testing';

export type ModelParameterType = 'number' | 'string' | 'boolean' | 'array';

export interface ModelParameter {
  id: string;
  name: string;
  type: ModelParameterType;
  description: string;
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  displayName: string;
  description?: string;
  contextWindow: number;
  maxTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  parameters: ModelParameter[];
}

export interface ModelConfiguration {
  modelId: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json' | 'json_object';
  customParameters?: Record<string, unknown>;
}

export interface AIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  status: AIProviderStatus;
  endpoint: string;
  apiKey: string; // Will be encrypted on backend
  description?: string;
  icon?: string;
  models: AIModel[];
  defaultModelId?: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
  testResult?: {
    success: boolean;
    responseTime: number;
    error?: string;
  };
}

export interface PhaseProviderAssignment {
  phaseId: string;
  phaseName: string;
  primaryProviderId: string;
  fallbackProviderIds: string[];
  modelConfiguration: ModelConfiguration;
  systemPrompt: string;
  responseSchema?: Record<string, unknown>;
  maxRetries: number;
  timeoutMs: number;
}

export interface ProviderUsageStats {
  providerId: string;
  providerName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  totalCost: number;
  averageResponseTime: number;
  lastUsed?: Date;
}

export interface UsageAnalytics {
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
  data: {
    timestamp: string;
    requestCount: number;
    tokenCount: number;
    cost: number;
    averageResponseTime: number;
    successRate: number;
  }[];
}

export interface ProviderComparison {
  prompt: string;
  providers: {
    providerId: string;
    providerName: string;
    modelId: string;
    response: string;
    responseTime: number;
    tokensUsed: number;
    cost: number;
    timestamp: Date;
    error?: string;
  }[];
}

export interface TestConfiguration {
  prompt: string;
  providerId: string;
  modelConfiguration: ModelConfiguration;
  iterations?: number;
}

export interface BenchmarkResult {
  providerId: string;
  providerName: string;
  modelId: string;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  totalCost: number;
  timestamp: Date;
}
