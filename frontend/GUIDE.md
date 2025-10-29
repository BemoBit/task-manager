# 🎨 Template Editor Frontend - Complete Guide

## 📖 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Architecture](#architecture)
5. [User Guide](#user-guide)
6. [Developer Guide](#developer-guide)
7. [API Integration](#api-integration)
8. [Deployment](#deployment)

---

## 🎯 Overview

A sophisticated visual template editor for creating structured project templates with:
- Drag-and-drop section management
- Rich text editing with markdown
- Variable system with type validation
- Auto-save and version control
- Preview mode and export capabilities

**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI, Zustand, TipTap

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Run Development Server

```bash
# Option 1: npm command
npm run dev

# Option 2: Using start script
./start.sh
```

Visit: http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

---

## ✨ Features

### 1. Template Builder Interface

**Three-Panel Layout**:
- **Left Sidebar**: Template structure tree view
- **Center Panel**: Builder/Editor/Preview tabs
- **Right Sidebar**: Properties panel

**Top Toolbar**:
- Template name editing
- Save button (manual + auto-save)
- Undo/Redo buttons
- Variable manager
- Preview toggle
- Import/Export
- Settings

### 2. Section Management

**Default Section Templates**:
1. **Data Model Definition**: Database schema, entities, relationships
2. **Services Architecture**: Module structure, dependencies
3. **HTTP/API Requests**: Endpoints, request/response formats
4. **Test Scenarios**: Test cases, validation rules

**Custom Sections**: Create your own section types

**Operations**:
- Add sections (default or custom)
- Drag-and-drop reordering
- Nested subsections
- Collapse/expand
- Delete sections

### 3. Rich Text Editor

**TipTap-based editor** with:
- **Formatting**: Bold, Italic, Code
- **Lists**: Bullet points, Numbered lists
- **Blockquotes**: Quote styling
- **Code Blocks**: Syntax highlighting (TypeScript, JavaScript, Python, JSON)
- **Tables**: Resizable, with headers
- **Images**: Inline image insertion
- **Variables**: Insert `{{variableName}}` syntax
- **Undo/Redo**: Independent editor history

### 4. Variable System

**Variable Types**:
- String
- Number
- Boolean
- Array
- Object

**Variable Scopes**:
- **Global**: Available throughout template
- **Section**: Limited to specific section

**Features**:
- Type validation
- Default values
- Required fields
- Description/documentation
- Autocomplete in editor

### 5. State Management

**Zustand Store** with:
- 50-state undo/redo history
- Auto-save every 30 seconds
- Conflict resolution strategies
- Immutable updates (Immer)
- DevTools integration

### 6. Template Management

**Operations**:
- Create new templates
- Save/Load templates
- Export to JSON
- Import from JSON
- Version control (ready for backend)
- Template categorization
- Tag management

---

## 🏗️ Architecture

### Component Structure

```
App
├── HomePage (/)                          # Landing page
└── EditorPage (/editor)                  # Main editor
    ├── Toolbar                           # Top action bar
    ├── TemplateTreeView                  # Left sidebar
    │   └── TreeNode (recursive)          # Section nodes
    ├── Main Content Area
    │   ├── SectionBuilder                # Drag-drop builder
    │   ├── RichTextEditor                # TipTap editor
    │   └── Preview                       # Read-only view
    ├── PropertiesPanel                   # Right sidebar
    └── VariableManager                   # Modal dialog
```

### State Flow

```
User Action
    ↓
Event Handler
    ↓
Zustand Action
    ↓
Immer Update (immutable)
    ↓
History Management
    ↓
Component Re-render
    ↓
Auto-save (debounced)
```

### Data Model

```typescript
Template {
  id: string
  name: string
  description: string
  sections: Section[]
  globalVariables: Variable[]
  version: number
  createdAt: Date
  updatedAt: Date
}

Section {
  id: string
  title: string
  type: 'data-model' | 'services' | 'http-api' | 'tests' | 'custom'
  content: string (HTML from TipTap)
  subsections: Section[]
  variables: Variable[]
  conditionalLogic: ConditionalLogic[]
  order: number
}

Variable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  scope: 'global' | 'section'
  defaultValue: unknown
  required: boolean
  validation: {...}
}
```

---

## 📚 User Guide

### Creating Your First Template

#### Step 1: Open Editor
Navigate to http://localhost:3000 and click "Open Editor"

#### Step 2: Set Template Name
Click on "New Template" in the top toolbar and enter your template name

#### Step 3: Add Sections
1. Click "Add Section" button in Section Builder
2. Choose from default templates or "Custom Section"
3. Select section appears in the tree view

#### Step 4: Configure Section
1. Click section in tree view to select
2. Edit properties in right sidebar:
   - Title
   - Type
   - Description

#### Step 5: Add Content
1. Switch to "Editor" tab
2. Use rich text editor to write content
3. Insert variables with `{{variableName}}`
4. Add formatting, code blocks, tables

#### Step 6: Define Variables
1. Click Variable icon in toolbar
2. Click "Add" in Variable Manager
3. Fill in:
   - Variable name
   - Type (string, number, etc.)
   - Scope (global/section)
   - Description
   - Default value

#### Step 7: Reorder Sections
1. Go to "Builder" tab
2. Drag section by grip handle
3. Drop in new position

#### Step 8: Preview
Click "Preview" tab to see final template rendering

#### Step 9: Save
- Click "Save" button (or wait for auto-save)
- Export to JSON for backup

### Advanced Features

#### Nested Subsections
1. Select parent section
2. Add new section
3. Drag to nest under parent

#### Collapsible Sections
Click chevron icon next to section name to collapse/expand

#### Undo/Redo
- Use toolbar buttons
- Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)

#### Template Export
1. Click Export icon
2. JSON file downloads
3. Contains full template structure

#### Template Import
1. Click Import icon
2. Select JSON file
3. Template loads into editor

---

## 👨‍💻 Developer Guide

### Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── editor/page.tsx       # Editor page
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── ui/                   # Shadcn components
│   │   └── template-editor/      # Custom components
│   ├── store/
│   │   └── templateStore.ts      # Zustand store
│   ├── types/
│   │   └── template.ts           # TypeScript types
│   └── lib/
│       └── utils.ts              # Utilities
├── public/                       # Static files
└── package.json
```

### Adding New Features

#### 1. Add New Section Type

**types/template.ts**:
```typescript
export type DefaultSectionType = 
  | 'data-model' 
  | 'services' 
  | 'http-api' 
  | 'tests'
  | 'new-type'; // Add here
```

**SectionBuilder.tsx**:
```typescript
const DEFAULT_SECTIONS = [
  // ... existing sections
  {
    type: 'new-type',
    title: 'New Section Type',
    content: 'Description here',
  },
];
```

#### 2. Add Store Action

**store/templateStore.ts**:
```typescript
interface TemplateStore {
  // ... existing actions
  customAction: (param: string) => void;
}

// In create function
customAction: (param) => {
  set((state) => {
    const newTemplate = produce(state.history.present, (draft) => {
      // Modify draft here
    });
    return {
      history: addToHistory(state.history, newTemplate),
    };
  });
},
```

#### 3. Add New Component

**components/template-editor/NewComponent.tsx**:
```typescript
'use client';

import { useTemplateStore } from '@/store/templateStore';

export const NewComponent = () => {
  const { template, updateTemplate } = useTemplateStore();
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

#### 4. Add TipTap Extension

**RichTextEditor.tsx**:
```typescript
import { CustomExtension } from '@tiptap/extension-custom';

const editor = useEditor({
  extensions: [
    // ... existing extensions
    CustomExtension.configure({
      // options
    }),
  ],
});
```

### Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Debugging

**Zustand DevTools**:
- Install Redux DevTools browser extension
- Store actions visible in DevTools
- Time-travel debugging available

**Console Logging**:
```typescript
console.log('Current template:', useTemplateStore.getState().history.present);
```

---

## 🔌 API Integration

### Environment Setup

**.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
NEXT_PUBLIC_AUTO_SAVE_INTERVAL=30000
```

### API Service

**lib/api.ts** (create this):
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const templateApi = {
  async save(template: Template) {
    const response = await fetch(`${API_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    return response.json();
  },

  async load(id: string) {
    const response = await fetch(`${API_URL}/templates/${id}`);
    return response.json();
  },

  async list() {
    const response = await fetch(`${API_URL}/templates`);
    return response.json();
  },
};
```

### Update Store

**store/templateStore.ts**:
```typescript
import { templateApi } from '@/lib/api';

// In triggerAutoSave
triggerAutoSave: async () => {
  const state = get();
  if (!state.autoSaveEnabled || !state.editorState.isDirty) return;

  try {
    await templateApi.save(state.history.present);
    
    set({
      editorState: {
        ...state.editorState,
        isDirty: false,
        lastSaved: new Date(),
      },
    });
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
},
```

### Authentication

**With JWT**:
```typescript
export const apiClient = {
  async request(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },
};
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

**Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Build and run**:
```bash
docker build -t template-editor-frontend .
docker run -p 3000:3000 template-editor-frontend
```

### Traditional Hosting

```bash
# Build
npm run build

# Files in .next/ and public/
# Copy to server
# Run with PM2 or similar
pm2 start npm --name "template-editor" -- start
```

---

## 🎓 Best Practices

### Performance
- Use React.memo for expensive components
- Debounce auto-save
- Virtualize large lists
- Lazy load heavy components

### State Management
- Keep store actions pure
- Use Immer for complex updates
- Limit history size (currently 50)
- Clean up subscriptions

### Type Safety
- Use TypeScript strict mode
- Define interfaces for all data
- Type all props
- Use type guards

### Code Organization
- One component per file
- Group related features
- Separate UI from logic
- Use barrel exports

---

## 📞 Support

For issues or questions:
1. Check the README.md
2. Review implementation summary
3. Check console for errors
4. Enable DevTools for state debugging

---

## 🎉 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [TipTap](https://tiptap.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Shadcn/UI](https://ui.shadcn.com/)
- [DnD Kit](https://dndkit.com/)

---

**Happy Template Building! 🚀**
