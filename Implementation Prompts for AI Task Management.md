# Professional Implementation Prompts for AI-Powered Task Manager

## Phase 1: Core Backend Infrastructure Setup

### Prompt 1.1 - Initial Project Structure
```
Create a production-ready NestJS application with the following specifications:

Project Structure:
- Use NestJS CLI to generate a new project with TypeScript strict mode enabled
- Implement a modular architecture with these core modules:
  * AuthModule (JWT authentication, role-based access)
  * TemplatesModule (template CRUD operations and versioning)
  * TasksModule (task management and decomposition)
  * AIProvidersModule (AI service integration)
  * ConfigModule (environment configuration)
  * DatabaseModule (Prisma ORM setup)
  * CacheModule (Redis integration)

Technical Requirements:
- Configure Prisma ORM with PostgreSQL
- Setup Redis for caching with cache-manager
- Implement global exception filters and logging interceptors
- Add request validation using class-validator and class-transformer
- Configure CORS, helmet, and rate limiting for security
- Setup Winston for structured logging
- Implement health checks endpoint
- Add Swagger documentation for all API endpoints

Database Schema:
[Include the Prisma schema from the architecture document]

Docker Setup:
- Create multi-stage Dockerfile for optimized production builds
- Setup docker-compose.yml with PostgreSQL, Redis, and app services
- Include environment variable management with .env files
- Add volume mounting for development hot-reload

Testing Setup:
- Configure Jest for unit and integration testing
- Add e2e testing configuration
- Setup test database with migrations
- Include coverage reporting

Generate complete code with best practices, error handling, and comprehensive comments.
```

### Prompt 1.2 - Authentication and Authorization
```
Implement a comprehensive authentication and authorization system in NestJS:

Requirements:
1. JWT-based authentication with refresh tokens
2. Role-based access control (Admin, Manager, User)
3. Permission-based authorization for resources
4. Session management with Redis
5. Password hashing with bcrypt
6. Two-factor authentication support (TOTP)
7. API key authentication for external services
8. Rate limiting per user/IP

Features to implement:
- User registration with email verification
- Login/logout endpoints
- Password reset functionality
- Refresh token rotation
- JWT blacklisting on logout
- Guard decorators for role/permission checking
- User profile management
- Audit logging for auth events

Security measures:
- Implement proper password policies
- Add brute force protection
- Setup CSRF protection
- Implement secure headers
- Add input sanitization
- Setup security monitoring

Provide complete implementation with DTOs, guards, decorators, and services.
```

## Phase 2: Template Management System

### Prompt 2.1 - Visual Template Editor Frontend
```
Build a sophisticated template editor using Next.js 14 App Router and Shadcn/UI:

Core Features:
1. Template Builder Interface:
   - Drag-and-drop section builder with these default sections:
     * Data Model Definition
     * Services Architecture
     * HTTP/API Requests
     * Test Scenarios
   - Custom section creation with configurable fields
   - Nested subsection support
   - Section reordering and deletion

2. Variable System:
   - Variable definition panel with type specification
   - {{variable}} syntax with autocomplete
   - Variable validation rules
   - Default values and constraints
   - Variable scope management (global/section)

3. Rich Text Editor (using TipTap):
   - Markdown support
   - Code syntax highlighting
   - Table creation
   - Image/media embedding
   - Custom formatting toolbar
   - Template variable insertion

4. Conditional Logic Builder:
   - Visual rule builder interface
   - IF-THEN-ELSE conditions
   - Multiple condition support (AND/OR)
   - Variable-based conditions
   - Section visibility control

5. Template Management:
   - Version control with diff viewer
   - Template categorization and tagging
   - Search and filter functionality
   - Import/export (JSON, YAML)
   - Template duplication
   - Template sharing with permissions

UI Components needed:
- Sidebar with template tree view
- Main editor canvas
- Properties panel for selected elements
- Preview mode toggle
- Settings modal for template configuration
- Variable manager modal
- Version history drawer

State Management:
- Use Zustand for template editor state
- Implement undo/redo functionality
- Auto-save with debouncing
- Conflict resolution for concurrent edits

Provide complete implementation with responsive design and accessibility features.
```

### Prompt 2.2 - Template API and Storage
```
Implement the backend template management system in NestJS:

Template Service Features:
1. Template CRUD operations with validation
2. Version control system:
   - Automatic versioning on save
   - Branching and merging support
   - Rollback functionality
   - Change tracking with user attribution

3. Template Validation Engine:
   - JSON schema validation
   - Custom validation rules
   - Variable reference checking
   - Syntax validation for template expressions

4. Template Rendering Engine:
   - Variable interpolation
   - Conditional section processing
   - Loop/iteration support
   - Function/helper support
   - Output formatting

5. Template Sharing System:
   - Permission management
   - Public/private templates
   - Template marketplace endpoints
   - Usage analytics

API Endpoints:
- GET /templates (with pagination, filtering, sorting)
- GET /templates/:id (with version parameter)
- POST /templates (create new template)
- PUT /templates/:id (update template)
- DELETE /templates/:id (soft delete)
- POST /templates/:id/fork (create fork)
- GET /templates/:id/versions (version history)
- POST /templates/:id/rollback (rollback to version)
- POST /templates/:id/validate (validate template)
- POST /templates/:id/render (render with sample data)

Include WebSocket support for real-time collaboration on templates.
```

## Phase 3: AI Integration Layer

### Prompt 3.1 - AI Service Manager
```
Create a robust AI service integration layer in NestJS:

Multi-Provider Support:
1. Implement adapter pattern for different AI providers:
   - OpenAI (GPT-4, GPT-3.5)
   - Anthropic (Claude)
   - Google (Gemini)
   - Custom endpoint support
   
2. Provider Configuration:
   - Dynamic provider registration
   - API key management with encryption
   - Model selection per provider
   - Token limits and pricing tracking
   - Custom headers and parameters

3. Request Management:
   - Intelligent request routing
   - Load balancing across providers
   - Fallback mechanism on failure
   - Retry logic with exponential backoff
   - Request queuing system
   - Priority-based processing

4. Response Processing:
   - Response normalization across providers
   - Streaming response support
   - Response validation against schema
   - Token counting and usage tracking
   - Response caching strategy

5. Advanced Features:
   - Prompt optimization per provider
   - Context window management
   - Conversation memory handling
   - Function calling support
   - Embedding generation
   - Fine-tuning integration

Error Handling:
- Provider-specific error mapping
- Graceful degradation
- Circuit breaker pattern
- Detailed error logging
- User-friendly error messages

Monitoring:
- Request/response logging
- Performance metrics
- Cost tracking
- Usage analytics
- Alert system for failures

Provide complete implementation with interfaces, services, and decorators.
```

### Prompt 3.2 - AI Configuration UI
```
Build an AI provider configuration interface in Next.js:

Settings Dashboard Components:
1. Provider Management:
   - Provider list with status indicators
   - Add/edit/delete provider forms
   - API key secure input with validation
   - Test connection button
   - Enable/disable toggle

2. Model Configuration:
   - Model selection dropdown per provider
   - Parameter adjustment (temperature, top_p, etc.)
   - Token limit settings
   - Cost per token configuration
   - Response format specification

3. Phase Assignment:
   - Drag-and-drop provider assignment to phases
   - Primary and fallback provider selection
   - Phase-specific prompt templates
   - Response schema definition per phase

4. Usage Analytics Dashboard:
   - Real-time usage charts (Chart.js/Recharts)
   - Cost breakdown by provider
   - Success/failure rates
   - Average response times
   - Token usage trends

5. Testing Interface:
   - Prompt playground
   - Provider comparison tool
   - Response preview
   - Performance benchmarking
   - A/B testing setup

Create reusable components with proper error handling and loading states.
```

## Phase 4: Task Processing Pipeline

### Prompt 4.1 - Pipeline Engine Implementation
```
Implement a sophisticated task processing pipeline in NestJS:

Core Pipeline System:
1. Pipeline Architecture:
   - Phase-based execution model
   - State machine implementation
   - Transaction support for atomicity
   - Checkpoint and recovery system
   - Parallel phase execution where possible

2. Task Decomposition (Phase 1):
   - Parse main task description
   - Apply decomposition template
   - Generate subtask structure:
     * Data Model subtasks
     * Service subtasks
     * HTTP/API subtasks
     * Testing subtasks
   - Validate subtask completeness
   - Maintain task hierarchy

3. Task Enrichment (Phase 2):
   - Apply project-specific rules
   - Inject coding standards
   - Add technology stack details
   - Include best practices
   - Generate implementation prompts

4. Queue Management (using Bull):
   - Priority queue implementation
   - Job scheduling and delays
   - Concurrent job processing
   - Job progress tracking
   - Failed job handling
   - Dead letter queue

5. State Management:
   - Pipeline state persistence
   - Progress tracking
   - Rollback capability
   - State recovery after failure
   - Audit trail generation

WebSocket Events:
- Pipeline started
- Phase completed
- Subtask generated
- Error occurred
- Pipeline completed

Error Handling:
- Retry strategies per phase
- Compensation transactions
- Error categorization
- Alert system for critical failures
- Manual intervention support

Provide complete implementation with queue workers and state management.
```

### Prompt 4.2 - Pipeline Visualization UI
```
Create an interactive pipeline visualization interface in Next.js:

Visual Components:
1. Pipeline Builder:
   - Drag-and-drop phase creation
   - Phase connection lines
   - Conditional branching support
   - Loop/iteration nodes
   - Custom phase creation
   - Phase configuration panels

2. Execution Monitor:
   - Real-time pipeline progress
   - Phase status indicators (pending, running, completed, failed)
   - Animated flow visualization
   - Time elapsed per phase
   - Resource usage graphs

3. Task View Components:
   - Main task card with description
   - Subtask tree visualization
   - Collapsible subtask details
   - Progress bars per subtask
   - Status badges and icons

4. Result Display:
   - Generated prompts viewer
   - Syntax highlighting for code
   - Copy-to-clipboard functionality
   - Export options (MD, JSON, PDF)
   - Diff viewer for changes

5. Control Panel:
   - Start/pause/stop buttons
   - Retry failed phases
   - Skip phase option
   - Manual override capability
   - Parameter adjustment on-the-fly

Interactive Features:
- Click to view phase details
- Hover for quick stats
- Drag to reorder phases
- Double-click to edit
- Right-click context menus

Use Framer Motion for animations and React Flow for pipeline visualization.
```

## Phase 5: Advanced Features and Polish

### Prompt 5.1 - Dashboard and Analytics
```
Build a comprehensive dashboard system in Next.js:

Dashboard Components:
1. Main Dashboard:
   - Task statistics cards (total, completed, in-progress, failed)
   - AI usage metrics (requests, tokens, costs)
   - Recent activity timeline
   - Performance charts
   - Quick action buttons

2. Task Management View:
   - Kanban board with drag-and-drop
   - List view with advanced filtering
   - Calendar view for scheduled tasks
   - Gantt chart for dependencies
   - Bulk operations support

3. Analytics Dashboard:
   - Task completion trends
   - AI provider performance comparison
   - Template usage statistics
   - User activity heatmap
   - Cost analysis charts
   - ROI calculations

4. Report Generation:
   - Custom report builder
   - Scheduled report generation
   - Multiple export formats
   - Email delivery system
   - Report templates

5. Collaboration Features:
   - Real-time cursor tracking
   - Comments and mentions
   - Activity feed
   - Team workspaces
   - Notification center

Implement with:
- Server-side data fetching for performance
- Optimistic updates for better UX
- Infinite scrolling where appropriate
- Virtual scrolling for large lists
- Responsive grid layouts
- Dark mode support

Include comprehensive filtering, sorting, and search capabilities.
```

### Prompt 5.2 - System Optimization and Extensions
```
Implement advanced system optimizations and extensibility features:

Performance Optimizations:
1. Database Optimization:
   - Index optimization strategy
   - Query performance monitoring
   - Connection pooling configuration
   - Read replica support
   - Database partitioning for scale

2. Caching Strategy:
   - Multi-level caching (Redis, CDN, browser)
   - Cache invalidation logic
   - Partial response caching
   - Query result caching
   - Static asset optimization

3. API Optimization:
   - Response compression
   - Field selection (GraphQL-like)
   - Pagination optimization
   - Batch request support
   - Response streaming

Extension System:
1. Plugin Architecture:
   - Plugin registration system
   - Hook system for extensibility
   - Custom phase creation API
   - Template extension points
   - UI component injection

2. Integration Framework:
   - Webhook system implementation
   - External API connectors
   - OAuth integration support
   - Import/export adapters
   - Event bus for decoupling

3. CLI Tool Development:
   - Task creation from terminal
   - Template management commands
   - Pipeline execution
   - System monitoring
   - Bulk operations

Monitoring and Maintenance:
1. Health Monitoring:
   - System health dashboard
   - Automated health checks
   - Performance profiling
   - Resource usage tracking
   - Anomaly detection

2. Backup and Recovery:
   - Automated backup system
   - Point-in-time recovery
   - Disaster recovery plan
   - Data migration tools
   - Archive system

Provide implementation with focus on maintainability and scalability.
```

## Deployment and DevOps

### Prompt 5.3 - Production Deployment
```
Setup complete production deployment pipeline:

CI/CD Pipeline:
1. GitHub Actions workflow for:
   - Automated testing on PR
   - Code quality checks (ESLint, Prettier)
   - Security scanning (Snyk)
   - Docker image building
   - Automated deployment to staging/production

2. Kubernetes Deployment:
   - Deployment manifests for all services
   - ConfigMaps and Secrets management
   - Horizontal Pod Autoscaling
   - Ingress configuration
   - Service mesh setup (Istio/Linkerd)

3. Infrastructure as Code:
   - Terraform configurations for cloud resources
   - Ansible playbooks for server configuration
   - Environment provisioning scripts
   - Database migration automation

Monitoring Setup:
1. Observability Stack:
   - Prometheus for metrics
   - Grafana for visualization
   - ELK stack for logging
   - Jaeger for distributed tracing
   - Alertmanager for notifications

2. Production Configurations:
   - Environment-specific configs
   - SSL/TLS certificate management
   - CDN configuration
   - Load balancer setup
   - Auto-scaling policies

Provide complete DevOps setup with security best practices.
```

These prompts will help you implement each phase of your task management system professionally. Each prompt is designed to generate production-ready code that follows best practices and includes all necessary features for a scalable, maintainable system.