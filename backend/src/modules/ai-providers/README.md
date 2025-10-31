# AI Providers Module

Comprehensive AI service integration layer for the Task Manager backend, providing multi-provider support, intelligent routing, monitoring, and cost management.

## Features

### ✅ Implemented

#### Multi-Provider Support
- **OpenAI** (GPT-4, GPT-3.5-turbo, etc.)
- **Anthropic** (Claude models)
- **Google** (Gemini models)
- **Custom** endpoints support

#### Provider Management
- Dynamic provider registration and configuration
- API key encryption for secure storage
- Provider health checks and status monitoring
- Enable/disable providers on-the-fly
- Priority-based provider selection

#### Request Management
- Intelligent request routing
- Load balancing across providers
- Automatic fallback on provider failure
- Exponential backoff retry logic
- Request queuing and priority handling

#### Circuit Breaker Pattern
- Automatic circuit breaking for failing providers
- State management (CLOSED, OPEN, HALF_OPEN)
- Configurable failure thresholds
- Automatic recovery attempts

#### Response Processing
- Response normalization across providers
- Streaming response support
- Token counting and usage tracking
- Response validation
- Response caching with Redis

#### Monitoring & Analytics
- Real-time usage metrics
- Cost tracking per provider
- Performance monitoring (latency, success rate)
- Error rate tracking
- Alert system for anomalies

## Architecture

```
ai-providers/
├── interfaces/
│   └── ai-provider.interface.ts    # Core interfaces and types
├── providers/
│   ├── base-ai.provider.ts         # Abstract base provider
│   ├── openai.provider.ts          # OpenAI implementation
│   ├── anthropic.provider.ts       # Anthropic implementation
│   └── gemini.provider.ts          # Google Gemini implementation
├── services/
│   ├── ai-provider-registry.service.ts    # Provider management
│   ├── ai-request-manager.service.ts      # Request routing & retry
│   ├── circuit-breaker.service.ts         # Circuit breaker
│   └── ai-monitoring.service.ts           # Metrics & analytics
├── dto/
│   └── ai-provider.dto.ts          # Data transfer objects
├── ai-providers.controller.ts      # REST API endpoints
└── ai-providers.module.ts          # Module configuration
```

## Installation

### 1. Dependencies (Already Installed ✅)

All required dependencies are included in `package.json`:

```json
{
  "dependencies": {
    "@nestjs/cache-manager": "^2.3.0",
    "cache-manager": "^5.7.6",
    "uuid": "^9.0.1",
    "openai": "^4.20.1",
    "@anthropic-ai/sdk": "^0.9.1",
    "@google/generative-ai": "^0.1.3"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.8"
  }
}
```

If not installed, run:
```bash
cd backend
npm install
```

### 2. Environment Configuration

Add to `.env`:

```env
# AI Provider Encryption (generate secure keys)
AI_ENCRYPTION_KEY=your-32-character-encryption-key
AI_ENCRYPTION_IV=your-16-character-iv-key

# Optional: Default provider API keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
```

### 3. Database Migration

The AI providers are stored in the `AIProvider` table. Run migrations:

```bash
npm run prisma:migrate
```

## Usage

### Register a Provider

```typescript
POST /api/ai-providers
Content-Type: application/json

{
  "name": "OpenAI GPT-4",
  "type": "OPENAI",
  "apiKey": "sk-...",
  "model": "gpt-4",
  "maxTokens": 2000,
  "temperature": 0.7,
  "pricing": {
    "inputTokenCost": 0.03,
    "outputTokenCost": 0.06,
    "currency": "USD"
  },
  "priority": 10,
  "isActive": true
}
```

### Send Completion Request

```typescript
POST /api/ai-providers/complete
Content-Type: application/json

{
  "prompt": "Explain microservices architecture",
  "systemPrompt": "You are a helpful software architect",
  "temperature": 0.7,
  "maxTokens": 500,
  "stream": false,
  "providerId": "optional-specific-provider-id"
}
```

### Get Provider Metrics

```typescript
GET /api/ai-providers/metrics/:providerId
```

### Get Usage Statistics

```typescript
GET /api/ai-providers/statistics/usage?startDate=2024-01-01&endDate=2024-12-31&providerId=optional
```

### Health Check

```typescript
GET /api/ai-providers/health/check
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai-providers` | Register new provider |
| GET | `/ai-providers` | List all providers |
| GET | `/ai-providers/:id` | Get provider details |
| PUT | `/ai-providers/:id` | Update provider |
| DELETE | `/ai-providers/:id` | Deactivate provider |
| GET | `/ai-providers/health/check` | Health check all providers |
| POST | `/ai-providers/complete` | Send completion request |
| GET | `/ai-providers/metrics/:id` | Get provider metrics |
| GET | `/ai-providers/metrics` | Get all metrics |
| GET | `/ai-providers/statistics/usage` | Usage statistics |
| GET | `/ai-providers/statistics/cost` | Cost breakdown |
| GET | `/ai-providers/statistics/performance` | Performance metrics |
| GET | `/ai-providers/alerts` | Get system alerts |
| GET | `/ai-providers/statistics/requests` | Request statistics |

## Configuration Options

### Provider Configuration

```typescript
{
  id: string;                    // Auto-generated UUID
  name: string;                  // Display name
  type: AIProviderType;          // OPENAI | ANTHROPIC | GOOGLE | CUSTOM
  apiKey: string;                // Encrypted API key
  endpoint?: string;             // Custom endpoint URL
  model: string;                 // Model identifier
  maxTokens: number;             // Maximum tokens per request
  temperature: number;           // 0-2, controls randomness
  topP?: number;                 // 0-1, nucleus sampling
  topK?: number;                 // Top-k sampling
  frequencyPenalty?: number;     // -2 to 2
  presencePenalty?: number;      // -2 to 2
  stopSequences?: string[];      // Stop generation sequences
  timeout?: number;              // Request timeout in ms
  retryAttempts?: number;        // Number of retry attempts
  retryDelay?: number;           // Initial retry delay
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  pricing?: {
    inputTokenCost: number;      // Cost per 1K tokens
    outputTokenCost: number;     // Cost per 1K tokens
    currency: string;
  };
  priority?: number;             // Higher = preferred
  isActive: boolean;             // Enable/disable
}
```

### Circuit Breaker Configuration

Located in `circuit-breaker.service.ts`:

```typescript
{
  failureThreshold: 5,           // Failures before opening circuit
  successThreshold: 2,           // Successes in half-open to close
  timeout: 60000,                // Time before retry (ms)
  monitoringPeriod: 120000       // Time window for failures (ms)
}
```

### Retry Configuration

Located in `ai-request-manager.service.ts`:

```typescript
{
  maxAttempts: 3,                // Maximum retry attempts
  initialDelay: 1000,            // Initial delay (ms)
  maxDelay: 10000,               // Maximum delay (ms)
  backoffMultiplier: 2           // Exponential backoff multiplier
}
```

## Programmatic Usage

### From Other Services

```typescript
import { AIRequestManagerService } from '@modules/ai-providers/services/ai-request-manager.service';

@Injectable()
export class MyService {
  constructor(
    private readonly aiRequestManager: AIRequestManagerService,
  ) {}

  async generateContent() {
    const response = await this.aiRequestManager.complete({
      prompt: 'Generate a task description',
      systemPrompt: 'You are a helpful assistant',
      temperature: 0.7,
      maxTokens: 500,
    });

    return response.content;
  }

  async *streamContent() {
    for await (const chunk of this.aiRequestManager.streamComplete({
      prompt: 'Generate a long document',
      stream: true,
    })) {
      yield chunk.content;
    }
  }
}
```

## Monitoring

### Metrics Available

- `totalRequests`: Total number of requests
- `successfulRequests`: Number of successful requests
- `failedRequests`: Number of failed requests
- `averageLatency`: Average response time in ms
- `totalTokensUsed`: Total tokens consumed
- `totalCost`: Total cost in configured currency
- `errorRate`: Percentage of failed requests
- `uptime`: Provider uptime percentage

### Alerts

Automatic alerts are generated for:
- Error rate > 50% (Critical)
- Error rate > 20% (Warning)
- Average latency > 10 seconds (Warning)
- Total cost > $100 (Info)

## Best Practices

### 1. Provider Priority

Set higher priority for faster/cheaper providers:

```typescript
{
  name: "GPT-3.5 Turbo",
  priority: 10,  // Try this first
}
{
  name: "GPT-4",
  priority: 5,   // Fallback to this
}
```

### 2. Cost Management

Configure pricing for accurate cost tracking:

```typescript
{
  pricing: {
    inputTokenCost: 0.03,
    outputTokenCost: 0.06,
    currency: "USD"
  }
}
```

### 3. Rate Limiting

Set rate limits to avoid API quota issues:

```typescript
{
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 90000
  }
}
```

### 4. Fallback Strategy

Register multiple providers for reliability:
- Primary: Fast, cost-effective provider
- Secondary: Reliable, higher-quality provider
- Tertiary: Backup provider

## Security

### API Key Encryption

API keys are encrypted using AES-256-CBC before storage:
- Keys are never stored in plain text
- Encryption keys should be in environment variables
- Use proper key management in production

### Environment Variables

Never commit API keys to version control:
- Use `.env` files (gitignored)
- Use secret management in production (AWS Secrets Manager, Azure Key Vault)
- Rotate keys regularly

## Troubleshooting

### Circuit Breaker Keeps Opening

Check:
- Provider API status
- API key validity
- Rate limits not exceeded
- Network connectivity

### High Latency

Solutions:
- Increase timeout settings
- Use faster models
- Enable caching for repeated requests
- Check network issues

### High Costs

Monitor:
- Token usage per request
- Switch to cheaper models
- Implement request caching
- Set cost alerts

## Future Enhancements

- [ ] WebSocket streaming for real-time responses
- [ ] Request queue with Bull
- [ ] Advanced prompt optimization
- [ ] Fine-tuning integration
- [ ] Embeddings support for all providers
- [ ] Multi-modal support (images, audio)
- [ ] Custom model hosting integration
- [ ] A/B testing for prompts
- [ ] Prompt template management
- [ ] Usage-based auto-scaling

## License

MIT License

---

**Ready for Production** ✅

This module is production-ready with:
- ✅ Comprehensive error handling
- ✅ Circuit breaker pattern
- ✅ Retry logic with exponential backoff
- ✅ Response caching
- ✅ Usage monitoring and cost tracking
- ✅ API key encryption
- ✅ Health checks
- ✅ Load balancing
- ✅ Detailed logging
