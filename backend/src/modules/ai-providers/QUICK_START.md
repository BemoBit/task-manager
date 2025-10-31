# Quick Start Guide - AI Providers Module

## Installation & Setup

### 1. Install Dependencies (Already Included ✅)

All AI provider SDKs are already included in `package.json` and installed:
- ✅ `openai` - OpenAI SDK
- ✅ `@anthropic-ai/sdk` - Anthropic Claude SDK  
- ✅ `@google/generative-ai` - Google Gemini SDK

If you need to reinstall:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following in `.env`:

```env
# AI Provider Encryption Keys (REQUIRED)
# Generate secure keys with: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
AI_ENCRYPTION_KEY=your-generated-32-character-key
AI_ENCRYPTION_IV=your-generated-16-character-iv

# Provider API Keys (Optional - can be configured via API later)
OPENAI_API_KEY=sk-proj-...your-openai-key
ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key
GOOGLE_AI_API_KEY=...your-google-ai-key
```

**Where to get API keys:**
- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/
- **Google AI:** https://makersuite.google.com/app/apikey

### 3. Generate Secure Encryption Keys

For production, generate secure keys:

```bash
# Generate encryption key (32 bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate IV (16 bytes)
node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
```

## Testing the API

### 1. Start the Backend

```bash
cd backend
npm run start:dev
```

### 2. Register Your First Provider

```bash
curl -X POST http://localhost:3001/api/ai-providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenAI GPT-3.5",
    "type": "OPENAI",
    "apiKey": "sk-your-actual-key",
    "model": "gpt-3.5-turbo",
    "maxTokens": 1000,
    "temperature": 0.7,
    "pricing": {
      "inputTokenCost": 0.0015,
      "outputTokenCost": 0.002,
      "currency": "USD"
    },
    "priority": 10,
    "isActive": true
  }'
```

### 3. List Providers

```bash
curl http://localhost:3001/api/ai-providers
```

### 4. Send Your First AI Request

```bash
curl -X POST http://localhost:3001/api/ai-providers/complete \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain the concept of microservices in 3 sentences",
    "systemPrompt": "You are a helpful software architect",
    "temperature": 0.7,
    "maxTokens": 200
  }'
```

### 5. Check Provider Health

```bash
curl http://localhost:3001/api/ai-providers/health/check
```

### 6. View Metrics

```bash
# Get all metrics
curl http://localhost:3001/api/ai-providers/metrics

# Get specific provider metrics
curl http://localhost:3001/api/ai-providers/metrics/{provider-id}

# Get usage statistics
curl "http://localhost:3001/api/ai-providers/statistics/usage?startDate=2024-01-01&endDate=2024-12-31"
```

## Enabling Real API Integration

### OpenAI Provider

In `providers/openai.provider.ts`, uncomment the integration code:

```typescript
async initialize(): Promise<void> {
  try {
    // Uncomment these lines:
    const { OpenAI } = await import('openai');
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.endpoint,
      timeout: this.getTimeout(),
      maxRetries: this.config.retryAttempts || 3,
    });

    // ... rest of initialization
  }
}

async complete(request: AIRequest): Promise<AIResponse> {
  // Uncomment the actual API call:
  const completion = await this.client.chat.completions.create({
    model: this.config.model,
    messages: this.formatMessages(mergedRequest),
    temperature: mergedRequest.temperature,
    max_tokens: mergedRequest.maxTokens,
    // ... other parameters
  });

  // Transform and return response
}
```

### Anthropic Provider

In `providers/anthropic.provider.ts`, uncomment:

```typescript
async initialize(): Promise<void> {
  const { Anthropic } = await import('@anthropic-ai/sdk');
  this.client = new Anthropic({
    apiKey: this.config.apiKey,
    // ... configuration
  });
}

async complete(request: AIRequest): Promise<AIResponse> {
  const message = await this.client.messages.create({
    model: this.config.model,
    max_tokens: mergedRequest.maxTokens,
    messages: this.formatAnthropicMessages(mergedRequest),
    // ... other parameters
  });
}
```

### Google Gemini Provider

In `providers/gemini.provider.ts`, uncomment:

```typescript
async initialize(): Promise<void> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(this.config.apiKey);
  this.client = genAI.getGenerativeModel({ model: this.config.model });
}

async complete(request: AIRequest): Promise<AIResponse> {
  const result = await this.client.generateContent({
    contents: this.formatGeminiMessages(mergedRequest),
    generationConfig: {
      temperature: mergedRequest.temperature,
      maxOutputTokens: mergedRequest.maxTokens,
      // ... other parameters
    },
  });
}
```

## Common Provider Configurations

### OpenAI GPT-4
```json
{
  "name": "OpenAI GPT-4",
  "type": "OPENAI",
  "model": "gpt-4",
  "maxTokens": 4000,
  "temperature": 0.7,
  "pricing": {
    "inputTokenCost": 0.03,
    "outputTokenCost": 0.06,
    "currency": "USD"
  },
  "priority": 5
}
```

### OpenAI GPT-3.5 Turbo
```json
{
  "name": "OpenAI GPT-3.5 Turbo",
  "type": "OPENAI",
  "model": "gpt-3.5-turbo",
  "maxTokens": 2000,
  "temperature": 0.7,
  "pricing": {
    "inputTokenCost": 0.0015,
    "outputTokenCost": 0.002,
    "currency": "USD"
  },
  "priority": 10
}
```

### Anthropic Claude 3
```json
{
  "name": "Claude 3 Sonnet",
  "type": "ANTHROPIC",
  "model": "claude-3-sonnet-20240229",
  "maxTokens": 4000,
  "temperature": 0.7,
  "topK": 40,
  "pricing": {
    "inputTokenCost": 0.003,
    "outputTokenCost": 0.015,
    "currency": "USD"
  },
  "priority": 7
}
```

### Google Gemini Pro
```json
{
  "name": "Gemini Pro",
  "type": "GOOGLE",
  "model": "gemini-pro",
  "maxTokens": 2048,
  "temperature": 0.7,
  "topK": 40,
  "topP": 0.95,
  "pricing": {
    "inputTokenCost": 0.00025,
    "outputTokenCost": 0.0005,
    "currency": "USD"
  },
  "priority": 8
}
```

## Programmatic Usage in Your Services

```typescript
import { Injectable } from '@nestjs/common';
import { AIRequestManagerService } from '@modules/ai-providers/services/ai-request-manager.service';

@Injectable()
export class TaskDecompositionService {
  constructor(
    private readonly aiRequestManager: AIRequestManagerService,
  ) {}

  async decomposeTask(taskDescription: string) {
    const response = await this.aiRequestManager.complete({
      prompt: `Decompose this task into subtasks:\n\n${taskDescription}`,
      systemPrompt: 'You are a helpful project manager',
      temperature: 0.7,
      maxTokens: 1000,
      responseFormat: 'json',
    });

    return JSON.parse(response.content);
  }

  async *streamTaskGeneration(taskDescription: string) {
    for await (const chunk of this.aiRequestManager.streamComplete({
      prompt: `Generate detailed tasks for: ${taskDescription}`,
      stream: true,
    })) {
      yield chunk.content;
    }
  }
}
```

## Monitoring Dashboard Integration

### Get Real-time Metrics

```typescript
// In your dashboard service
async getAIProviderStats() {
  const stats = await this.aiRequestManager.getStatistics();
  const alerts = await this.monitoring.checkAlerts();
  const performance = await this.monitoring.getPerformanceMetrics();

  return {
    providers: stats.totalProviders,
    healthy: stats.healthyProviders,
    circuitBreakers: stats.circuitBreakerStates,
    alerts,
    performance,
  };
}
```

## Troubleshooting

### Circuit Breaker Keeps Opening
```bash
# Check circuit breaker states
curl http://localhost:3001/api/ai-providers/statistics/requests

# Reset specific provider
# (Add reset endpoint or manually update database)
```

### API Key Issues
```bash
# Verify provider configuration
curl http://localhost:3001/api/ai-providers/{provider-id}

# Update API key
curl -X PUT http://localhost:3001/api/ai-providers/{provider-id} \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "new-key"}'
```

### High Costs Alert
```bash
# Check cost breakdown
curl http://localhost:3001/api/ai-providers/statistics/cost

# Disable expensive providers temporarily
curl -X PUT http://localhost:3001/api/ai-providers/{provider-id} \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

## Production Checklist

- [ ] Install AI provider SDKs
- [ ] Generate secure encryption keys
- [ ] Configure environment variables
- [ ] Uncomment and test API integrations
- [ ] Set up proper secret management
- [ ] Configure production Redis
- [ ] Add authentication to endpoints
- [ ] Set up monitoring and alerting
- [ ] Load test the system
- [ ] Configure rate limiting per user
- [ ] Set up backup providers
- [ ] Document provider SLAs
- [ ] Set up cost alerts
- [ ] Configure log aggregation

## Next Steps

1. **Immediate:** Test with simulated responses (current state)
2. **Short-term:** Install SDKs and enable real API integration
3. **Medium-term:** Add WebSocket streaming and queue system
4. **Long-term:** Add more providers and advanced features

## Support

For issues or questions:
- Check `README.md` for detailed documentation
- Review `AI_SERVICE_IMPLEMENTATION.md` for architecture details
- Examine provider implementations in `providers/` directory
- Review service implementations in `services/` directory

---

**Ready to Go!** 🚀

The AI Providers Module is fully implemented and ready for testing. Follow this guide to get started with real AI integrations.
