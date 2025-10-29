# Template Management System - Backend

## 📋 Overview

A comprehensive template management system built with NestJS that provides CRUD operations, version control, validation, rendering, sharing, and real-time collaboration features.

## ✨ Features

### 1. Template CRUD Operations
- **Create** templates with structured content (sections, variables, conditional logic)
- **Read** templates with pagination, filtering, and sorting
- **Update** templates with automatic versioning
- **Delete** templates (soft delete with recovery option)
- **Fork** templates to create customized versions
- **Rate** templates with comments

### 2. Version Control System
- **Automatic Versioning**: Every save creates a new version
- **Branching**: Create branches for experimental changes
- **Merging**: Three-way merge with conflict detection
- **Rollback**: Revert to any previous version
- **Version Comparison**: Diff between any two versions
- **Version Tree**: Visualize branch history

### 3. Template Validation Engine
- **JSON Schema Validation**: Validate template structure
- **Variable Reference Checking**: Detect unresolved variable references
- **Syntax Validation**: Validate template expressions
- **Custom Validation Rules**: Regex, range, length, enum validators
- **Conditional Logic Validation**: Validate conditional rules

### 4. Template Rendering Engine
- **Variable Interpolation**: Replace `{{variableName}}` with actual values
- **Conditional Sections**: Show/hide sections based on conditions
- **Handlebars Helpers**: 30+ built-in helpers (uppercase, lowercase, date format, etc.)
- **Custom Helpers**: Register your own helper functions
- **Nested Subsections**: Recursive rendering support

### 5. Template Sharing System
- **Permission Levels**: VIEW, EDIT, ADMIN
- **Access Levels**: PRIVATE, SHARED, PUBLIC
- **Share Management**: Grant/revoke access to users
- **Ownership Transfer**: Transfer template ownership
- **Expiration**: Set expiration dates for shared access
- **Shared Templates List**: View templates shared with you

### 6. Template Marketplace
- **Public Templates**: Browse public templates
- **Template Ratings**: Rate and review templates
- **Usage Analytics**: Track views, forks, and usage
- **Category & Tags**: Organize templates
- **Search & Filter**: Find templates by name, category, tags

### 7. Real-time Collaboration (WebSocket)
- **Live Editing**: Multiple users editing simultaneously
- **User Presence**: See who's currently editing
- **Cursor Tracking**: See others' cursor positions
- **Selection Highlighting**: See what others are selecting
- **Change Broadcasting**: Real-time content updates
- **Comments**: Add inline comments
- **Locking**: Request exclusive edit access to sections
- **Save Notifications**: Get notified when others save

## 🏗️ Architecture

### Directory Structure

```
src/modules/templates/
├── dto/                                 # Data Transfer Objects
│   ├── create-template.dto.ts          # Create template
│   ├── update-template.dto.ts          # Update template
│   ├── query-templates.dto.ts          # Query with filters
│   ├── validate-template.dto.ts        # Validation request
│   ├── render-template.dto.ts          # Render request
│   └── template-actions.dto.ts         # Fork, share, rate
├── interfaces/
│   └── template.interface.ts           # TypeScript interfaces
├── services/
│   ├── template.service.ts             # CRUD operations
│   ├── template-version.service.ts     # Version control
│   ├── template-validation.service.ts  # Validation engine
│   ├── template-render.service.ts      # Rendering engine
│   └── template-sharing.service.ts     # Sharing & permissions
├── gateways/
│   └── template-collaboration.gateway.ts # WebSocket gateway
├── guards/
│   └── template-permission.guard.ts    # Permission guard
├── decorators/
│   ├── require-permission.decorator.ts # Permission decorator
│   └── template.decorators.ts          # Utility decorators
├── templates.controller.ts             # REST API endpoints
└── templates.module.ts                 # Module definition
```

### Database Schema

```prisma
// Main template model
model Template {
  id           String              @id @default(uuid())
  name         String
  description  String?
  type         TemplateType        // DECOMPOSITION, ENRICHMENT, CUSTOM
  version      String              @default("1.0.0")
  content      Json                // Template structure
  accessLevel  TemplateAccessLevel // PRIVATE, SHARED, PUBLIC
  category     String?
  tags         String[]
  forkCount    Int                 @default(0)
  usageCount   Int                 @default(0)
  rating       Float?
  ratingCount  Int                 @default(0)
  forkedFrom   String?
  createdBy    String
  // Relations...
}

// Version history
model TemplateVersion {
  id          String   @id @default(uuid())
  templateId  String
  version     String
  content     Json
  changeLog   String?
  branchName  String?  @default("main")
  parentId    String?
  isMerged    Boolean  @default(false)
  createdBy   String
  // Relations...
}

// Sharing & permissions
model TemplateShare {
  id          String             @id @default(uuid())
  templateId  String
  userId      String
  permission  TemplatePermission // VIEW, EDIT, ADMIN
  sharedBy    String
  expiresAt   DateTime?
  // Relations...
}

// Usage analytics
model TemplateAnalytics {
  id          String   @id @default(uuid())
  templateId  String
  event       String   // view, fork, use, rate, etc.
  userId      String?
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

## 🚀 API Endpoints

### Template CRUD

```http
POST   /api/templates                    # Create template
GET    /api/templates                    # List templates (with pagination)
GET    /api/templates/:id                # Get template by ID
PUT    /api/templates/:id                # Update template
DELETE /api/templates/:id                # Delete template (soft)
```

### Version Control

```http
GET    /api/templates/:id/versions           # Get all versions
GET    /api/templates/:id/versions/:versionId # Get specific version
POST   /api/templates/:id/versions/branch    # Create branch
POST   /api/templates/:id/versions/merge     # Merge branches
POST   /api/templates/:id/versions/compare   # Compare versions
GET    /api/templates/:id/versions/tree      # Get version tree
POST   /api/templates/:id/rollback           # Rollback to version
```

### Validation & Rendering

```http
POST   /api/templates/:id/validate       # Validate template
POST   /api/templates/:id/render         # Render with variables
```

### Template Actions

```http
POST   /api/templates/:id/fork           # Fork template
POST   /api/templates/:id/rate           # Rate template
GET    /api/templates/:id/stats          # Get statistics
```

### Sharing

```http
POST   /api/templates/:id/share              # Share with user
DELETE /api/templates/:id/share/:userId      # Revoke access
GET    /api/templates/:id/shared-users       # Get shared users
GET    /api/templates/shared/with-me         # Get shared templates
PUT    /api/templates/:id/access-level       # Update access level
POST   /api/templates/:id/transfer-ownership # Transfer ownership
```

## 📡 WebSocket Events

### Client → Server

```typescript
// Join editing session
socket.emit('join-template', {
  templateId: string,
  userId: string,
  userName: string
});

// Cursor movement
socket.emit('cursor-move', {
  templateId: string,
  sectionId: string,
  position: number
});

// Content edit
socket.emit('edit-content', {
  templateId: string,
  sectionId: string,
  content: string,
  version: number
});

// Add comment
socket.emit('add-comment', {
  templateId: string,
  sectionId: string,
  text: string,
  position?: number
});
```

### Server → Client

```typescript
// User joined
socket.on('user-joined', (presence: IUserPresence) => {});

// User left
socket.on('user-left', ({ userId, socketId }) => {});

// Cursor update
socket.on('cursor-update', ({ userId, cursor }) => {});

// Content updated
socket.on('content-updated', ({ userId, sectionId, content, version }) => {});

// Comment added
socket.on('comment-added', (comment) => {});
```

## 💻 Usage Examples

### 1. Create Template

```typescript
POST /api/templates
{
  "name": "Full-Stack App Template",
  "description": "Complete template for building full-stack applications",
  "type": "CUSTOM",
  "content": {
    "sections": [
      {
        "id": "section-1",
        "title": "Database Schema",
        "type": "data-model",
        "content": "Define your database schema here...",
        "order": 0,
        "subsections": [],
        "variables": []
      }
    ],
    "globalVariables": [
      {
        "id": "var-1",
        "name": "projectName",
        "type": "string",
        "scope": "global",
        "required": true,
        "defaultValue": "My Project"
      }
    ]
  },
  "accessLevel": "PRIVATE",
  "category": "web-development",
  "tags": ["nodejs", "react", "typescript"]
}
```

### 2. Render Template

```typescript
POST /api/templates/:id/render
{
  "variables": {
    "projectName": "TaskManager",
    "database": "PostgreSQL",
    "authentication": true
  },
  "context": {
    "options": {
      "escapeHtml": false
    }
  }
}
```

### 3. Validate Template

```typescript
POST /api/templates/:id/validate
{
  "content": {
    "sections": [...],
    "globalVariables": [...]
  }
}

// Response
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "path": "sections[0].content",
      "message": "Unresolved variable reference: {{undefinedVar}}"
    }
  ]
}
```

### 4. Create Branch

```typescript
POST /api/templates/:id/versions/branch
{
  "branchName": "feature/new-sections",
  "fromVersion": "1.0.5"
}
```

### 5. Share Template

```typescript
POST /api/templates/:id/share
{
  "userId": "user-123",
  "permission": "EDIT",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### 6. WebSocket Connection

```typescript
// Frontend
import io from 'socket.io-client';

const socket = io('http://localhost:3002/templates', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join template editing session
socket.emit('join-template', {
  templateId: 'template-123',
  userId: 'user-456',
  userName: 'John Doe'
});

// Listen for other users' cursors
socket.on('cursor-update', ({ userId, cursor }) => {
  // Update UI to show cursor
  console.log(`User ${userId} moved cursor to ${cursor.position}`);
});

// Broadcast your edits
socket.emit('edit-content', {
  templateId: 'template-123',
  sectionId: 'section-1',
  content: 'Updated content...',
  version: 5
});
```

## 🔒 Security

### Authentication
- All endpoints require JWT authentication
- Use `JwtAuthGuard` from auth module

### Authorization
- Use `@RequirePermission('EDIT')` decorator for fine-grained control
- `TemplatePermissionGuard` checks user permissions automatically

### Example with Guards

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, TemplatePermissionGuard)
@RequirePermission('VIEW')
async getTemplate(@Param('id') id: string) {
  // User has VIEW permission, proceed
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test -- templates
```

### E2E Tests
```bash
npm run test:e2e -- templates
```

## 📊 Performance

- **Pagination**: All list endpoints support pagination
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: Consider adding Redis for frequently accessed templates
- **Lazy Loading**: Version history loaded on demand

## 🛠️ Configuration

### Environment Variables

```env
# WebSocket
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager

# JWT
JWT_SECRET=your-secret-key
```

## 📝 Future Enhancements

1. **Template Marketplace**
   - Featured templates
   - Download statistics
   - Template collections

2. **AI Integration**
   - AI-powered template suggestions
   - Auto-complete for template content
   - Smart variable detection

3. **Advanced Collaboration**
   - Operational Transformation for conflict resolution
   - Video/voice chat integration
   - Change history visualization

4. **Export/Import**
   - Export to PDF, Markdown, HTML
   - Import from various formats
   - Template bundles

5. **Template Analytics Dashboard**
   - Usage trends
   - Popular templates
   - User engagement metrics

## 🤝 Contributing

When adding new features:
1. Add service methods
2. Create DTOs
3. Add controller endpoints
4. Update this README
5. Add tests

## 📄 License

Copyright © 2024 Task Manager Team
