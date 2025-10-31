# AI Provider Configuration Interface

A comprehensive Next.js interface for managing AI providers, configuring models, assigning phases, monitoring usage, and testing provider performance.

## 📋 Overview

This implementation provides a complete settings dashboard for AI provider management with the following features:

### ✅ 1. Provider Management
- **Provider List**: Display all configured AI providers with search and filtering
- **Status Indicators**: Visual status badges (Active, Inactive, Error, Testing)
- **Add/Edit Forms**: Secure forms with validation for provider configuration
- **API Key Security**: Password-masked input with show/hide toggle
- **Connection Testing**: Test provider connectivity with response time tracking
- **Enable/Disable Toggle**: Quick provider activation controls

### ✅ 2. Model Configuration
- **Model Selection**: Dropdown with all available models per provider
- **Parameter Adjustments**:
  - Temperature slider (0-2)
  - Top P slider (0-1)
  - Max Tokens input (1-context window)
  - Frequency Penalty (-2 to 2)
  - Presence Penalty (-2 to 2)
- **Token Limits**: Visual slider with numeric input
- **Cost Configuration**: Display cost per 1k tokens (input/output)
- **Response Format**: Text, JSON, or JSON Object selection
- **Cost Estimation**: Real-time cost calculation per request

### ✅ 3. Phase Assignment
- **Drag-and-Drop Interface**: Reorder phase assignments using @dnd-kit
- **Primary Provider Selection**: Assign main AI provider to each phase
- **Fallback Providers**: Multiple fallback options with visual badges
- **Phase-Specific Prompts**: System prompt editor per phase
- **Response Schema**: JSON schema definition for structured outputs
- **Retry Configuration**: Max retries and timeout settings
- **Model Configuration**: Per-phase model parameter overrides

### ✅ 4. Usage Analytics Dashboard
- **Real-Time Charts**: Built with Recharts library
  - Request distribution pie chart
  - Request trends line chart
  - Success vs failed bar chart
  - Response time analysis
  - Cost breakdown
  - Token usage trends
- **Summary Cards**:
  - Total requests with success/failure counts
  - Success rate percentage
  - Average response time
  - Total cost with token usage
- **Period Selection**: Last 24 hours, 7 days, or 30 days
- **Provider Comparison**: Side-by-side performance metrics

### ✅ 5. Testing Interface
- **Prompt Playground**: Interactive testing environment
- **Provider Selection**: Choose provider and model for testing
- **Template Library**: Pre-built prompt templates
- **Parameter Controls**: Adjust model parameters in real-time
- **Test Results Display**:
  - Response time tracking
  - Token usage monitoring
  - Cost calculation
  - Error handling with detailed messages
- **Response Actions**: Copy to clipboard functionality
- **Test History**: View all previous test runs

## 🏗️ Architecture

### File Structure
```
frontend/src/
├── types/
│   └── ai-provider.ts                    # TypeScript type definitions
├── store/
│   └── aiProviderStore.ts                # Zustand state management
├── components/
│   ├── ui/                               # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   ├── alert-dialog.tsx
│   │   └── tooltip.tsx
│   └── ai-providers/
│       ├── index.ts                      # Export file
│       ├── ai-provider-settings.tsx      # Main container
│       ├── provider-list.tsx             # Provider list view
│       ├── provider-card.tsx             # Provider display card
│       ├── provider-form-dialog.tsx      # Add/edit provider form
│       ├── model-configuration-panel.tsx # Model config UI
│       ├── phase-assignment-manager.tsx  # Phase management
│       ├── phase-assignment-card.tsx     # Phase display card
│       ├── phase-assignment-dialog.tsx   # Phase config form
│       ├── usage-analytics-dashboard.tsx # Analytics charts
│       └── provider-testing-playground.tsx # Testing interface
└── app/
    └── ai-providers/
        └── page.tsx                      # Demo page with mock data
```

### Type Definitions

#### Core Types
```typescript
type AIProviderType = 'openai' | 'anthropic' | 'google' | 'custom';
type AIProviderStatus = 'active' | 'inactive' | 'error' | 'testing';
```

#### Main Interfaces
- `AIProvider`: Provider configuration and metadata
- `AIModel`: Model specifications and pricing
- `ModelConfiguration`: Runtime model parameters
- `PhaseProviderAssignment`: Phase-to-provider mapping
- `ProviderUsageStats`: Usage metrics per provider
- `UsageAnalytics`: Time-series analytics data
- `ProviderComparison`: Multi-provider test results
- `BenchmarkResult`: Performance benchmark data

### State Management

The application uses Zustand for state management with the following store:

**AIProviderStore**:
- Provider CRUD operations
- Phase assignment management
- Analytics data handling
- Testing results storage
- Error state management

## 🚀 Getting Started

### Prerequisites
```bash
# Required packages are already installed
- @radix-ui/* (UI primitives)
- @dnd-kit/* (Drag and drop)
- recharts (Charts)
- zustand (State management)
- lucide-react (Icons)
```

### Running the Demo

1. **Start the development server**:
```bash
cd frontend
npm run dev
```

2. **Navigate to the AI Providers page**:
```
http://localhost:3000/ai-providers
```

3. **Explore the features**:
   - View pre-loaded mock providers
   - Test adding/editing providers
   - Configure model parameters
   - Assign providers to phases
   - View analytics dashboard
   - Test providers in playground

## 📊 Component Details

### 1. Provider Management

**ProviderList**
- Displays all providers in a responsive grid
- Search functionality
- Empty state with call-to-action
- Opens form dialog for add/edit

**ProviderCard**
- Status badge with color coding
- Provider type badge
- Model count display
- Last tested timestamp
- Test result metrics
- Action buttons (Test, Enable/Disable, Edit, Delete)
- Confirmation dialog for deletion

**ProviderFormDialog**
- Provider type selection (auto-populates endpoint)
- Name and endpoint validation
- Secure API key input
- Description field
- URL validation
- Create/Update modes

### 2. Model Configuration

**ModelConfigurationPanel**
- Model selection dropdown
- Model details display (context window, costs)
- Parameter sliders:
  - Temperature (creativity control)
  - Top P (nucleus sampling)
  - Max Tokens (response length)
  - Frequency Penalty (repetition control)
  - Presence Penalty (topic diversity)
- Response format selection
- Stop sequences configuration
- Real-time cost estimation
- Save/Reset buttons

### 3. Phase Assignment

**PhaseAssignmentManager**
- Drag-and-drop phase reordering
- Assigned phases display
- Unassigned phases section
- Create assignment button

**PhaseAssignmentCard**
- Sortable with drag handle
- Primary provider badge
- Fallback providers display
- Model configuration summary
- System prompt preview
- Edit/Delete actions

**PhaseAssignmentDialog**
- Three-tab interface:
  1. **Provider Tab**: Primary/fallback selection, retry settings
  2. **Model Config Tab**: Model and parameter selection
  3. **Prompt Tab**: System prompt editor
- Phase selection (for new assignments)
- Fallback provider management
- Form validation

### 4. Usage Analytics

**UsageAnalyticsDashboard**
- Period selector (24h, 7d, 30d)
- Summary cards with metrics
- Three-tab layout:
  1. **Overview**: Distribution and trends
  2. **Performance**: Response time analysis
  3. **Costs**: Cost breakdown and trends
- Interactive charts:
  - Pie chart (request distribution)
  - Line chart (trends over time)
  - Bar chart (success vs failed)
- Loading states
- Empty states

### 5. Testing Interface

**ProviderTestingPlayground**
- Provider and model selection
- Prompt text area
- Template quick-load dropdown
- Two-tab parameter controls:
  1. **Basic**: Temperature and max tokens
  2. **Advanced**: Top P and response format
- Run test button
- Test results history
- Result cards with:
  - Provider name and status
  - Timestamp
  - Response time, tokens, cost
  - Prompt/response display
  - Copy to clipboard
  - Error handling

## 🎨 Styling

All components use:
- **Tailwind CSS** for styling
- **Shadcn/UI** component library
- **Lucide React** for icons
- **CSS variables** for theming
- **Responsive design** (mobile, tablet, desktop)
- **Dark mode support** (via Shadcn)

## 🔌 API Integration

The components are designed to integrate with a backend API. Update these methods in `aiProviderStore.ts`:

```typescript
// Test provider connection
testProviderConnection: async (id: string) => {
  const response = await fetch(`/api/ai-providers/${id}/test`, {
    method: 'POST',
  });
  // Handle response
}

// Fetch analytics
fetchAnalytics: async (period) => {
  const response = await fetch(`/api/ai-providers/analytics?period=${period}`);
  // Handle response
}

// Run comparison
runProviderComparison: async (providerIds, prompt, config) => {
  const response = await fetch('/api/ai-providers/compare', {
    method: 'POST',
    body: JSON.stringify({ providerIds, prompt, config }),
  });
  // Handle response
}
```

## 🧪 Testing

The system includes:
- **Manual testing**: Via playground interface
- **Provider testing**: Connection and response validation
- **Comparison testing**: Multi-provider performance comparison
- **Benchmark testing**: Automated performance testing

## 🔒 Security Features

1. **API Key Protection**:
   - Password-masked input
   - Show/hide toggle
   - Stored encrypted on backend

2. **Input Validation**:
   - URL format validation
   - Required field checking
   - Type safety with TypeScript

3. **Error Handling**:
   - Global error state
   - User-friendly error messages
   - Retry mechanisms

## 📱 Responsive Design

All components are fully responsive:
- **Mobile**: Single column, stacked layout
- **Tablet**: 2-column grid where appropriate
- **Desktop**: Full 3-column grid, optimal spacing

## 🎯 Future Enhancements

Potential additions:
- [ ] Provider usage quotas and limits
- [ ] Custom model fine-tuning UI
- [ ] A/B testing between providers
- [ ] Cost budget alerts
- [ ] Usage forecasting
- [ ] Provider health monitoring
- [ ] Automated failover configuration
- [ ] Export analytics reports
- [ ] Webhook configuration
- [ ] Prompt template library
- [ ] Response caching configuration
- [ ] Multi-tenant support

## 📝 Usage Examples

### Adding a New Provider
```typescript
const newProvider = {
  id: crypto.randomUUID(),
  name: 'My OpenAI Instance',
  type: 'openai',
  endpoint: 'https://api.openai.com/v1',
  apiKey: 'sk-...',
  status: 'inactive',
  models: [],
  isEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

addProvider(newProvider);
```

### Assigning Provider to Phase
```typescript
const assignment = {
  phaseId: '1',
  phaseName: 'Task Decomposition',
  primaryProviderId: 'provider-1',
  fallbackProviderIds: ['provider-2'],
  modelConfiguration: {
    modelId: 'gpt-4-turbo',
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 2048,
    responseFormat: 'json',
  },
  systemPrompt: 'You are a task decomposition expert...',
  maxRetries: 3,
  timeoutMs: 30000,
};

assignProviderToPhase(assignment);
```

## 🤝 Contributing

When adding new features:
1. Follow existing component patterns
2. Add TypeScript types
3. Include error handling
4. Update documentation
5. Test responsive design
6. Consider accessibility

## 📄 License

Part of the AI-Powered Task Manager project.

---

**Built with**: Next.js 14, React 19, TypeScript, Tailwind CSS, Shadcn/UI, Zustand, Recharts, @dnd-kit

**Status**: ✅ Complete and ready for backend integration
