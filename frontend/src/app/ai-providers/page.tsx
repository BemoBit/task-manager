'use client';

import React, { useEffect } from 'react';
import { AIProviderSettings } from '@/components/ai-providers';
import { DashboardLayout } from '@/components/layout';
import { useAIProviderStore } from '@/store/aiProviderStore';
import { AIProvider, ProviderUsageStats } from '@/types/ai-provider';

// Mock data for demonstration
const mockProviders: AIProvider[] = [
  {
    id: '1',
    name: 'OpenAI GPT-4',
    type: 'openai',
    status: 'active',
    endpoint: 'https://api.openai.com/v1',
    apiKey: 'sk-...',
    description: 'Latest GPT-4 model with improved reasoning',
    isEnabled: true,
    models: [
      {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo',
        providerId: '1',
        displayName: 'GPT-4 Turbo',
        description: 'Most capable model with 128k context',
        contextWindow: 128000,
        maxTokens: 4096,
        costPer1kInputTokens: 0.01,
        costPer1kOutputTokens: 0.03,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        parameters: [],
      },
      {
        id: 'gpt-4',
        name: 'gpt-4',
        providerId: '1',
        displayName: 'GPT-4',
        description: 'Standard GPT-4 model',
        contextWindow: 8192,
        maxTokens: 4096,
        costPer1kInputTokens: 0.03,
        costPer1kOutputTokens: 0.06,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        parameters: [],
      },
    ],
    defaultModelId: 'gpt-4-turbo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    lastTestedAt: new Date(),
    testResult: {
      success: true,
      responseTime: 850,
    },
  },
  {
    id: '2',
    name: 'Anthropic Claude',
    type: 'anthropic',
    status: 'active',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-...',
    description: 'Claude 3 Opus with 200k context',
    isEnabled: true,
    models: [
      {
        id: 'claude-3-opus',
        name: 'claude-3-opus',
        providerId: '2',
        displayName: 'Claude 3 Opus',
        description: 'Most powerful Claude model',
        contextWindow: 200000,
        maxTokens: 4096,
        costPer1kInputTokens: 0.015,
        costPer1kOutputTokens: 0.075,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        parameters: [],
      },
      {
        id: 'claude-3-sonnet',
        name: 'claude-3-sonnet',
        providerId: '2',
        displayName: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        contextWindow: 200000,
        maxTokens: 4096,
        costPer1kInputTokens: 0.003,
        costPer1kOutputTokens: 0.015,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        parameters: [],
      },
    ],
    defaultModelId: 'claude-3-opus',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    lastTestedAt: new Date(),
    testResult: {
      success: true,
      responseTime: 1200,
    },
  },
  {
    id: '3',
    name: 'Google Gemini',
    type: 'google',
    status: 'inactive',
    endpoint: 'https://generativelanguage.googleapis.com/v1',
    apiKey: 'AIza...',
    description: 'Google Gemini Pro model',
    isEnabled: false,
    models: [
      {
        id: 'gemini-pro',
        name: 'gemini-pro',
        providerId: '3',
        displayName: 'Gemini Pro',
        description: 'Google\'s most capable AI model',
        contextWindow: 32768,
        maxTokens: 2048,
        costPer1kInputTokens: 0.0005,
        costPer1kOutputTokens: 0.0015,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        parameters: [],
      },
    ],
    defaultModelId: 'gemini-pro',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
];

const mockUsageStats: ProviderUsageStats[] = [
  {
    providerId: '1',
    providerName: 'OpenAI GPT-4',
    totalRequests: 1250,
    successfulRequests: 1200,
    failedRequests: 50,
    totalTokensUsed: 450000,
    totalCost: 12.5,
    averageResponseTime: 850,
    lastUsed: new Date(),
  },
  {
    providerId: '2',
    providerName: 'Anthropic Claude',
    totalRequests: 800,
    successfulRequests: 780,
    failedRequests: 20,
    totalTokensUsed: 320000,
    totalCost: 8.75,
    averageResponseTime: 1200,
    lastUsed: new Date(),
  },
];

export default function AIProvidersPage() {
  const setProviders = useAIProviderStore((state) => state.setProviders);
  const setUsageStats = useAIProviderStore((state) => state.setUsageStats);
  
  useEffect(() => {
    // Load mock data
    setProviders(mockProviders);
    setUsageStats(mockUsageStats);
  }, [setProviders, setUsageStats]);
  
  return (
    <DashboardLayout>
      <AIProviderSettings />
    </DashboardLayout>
  );
}
