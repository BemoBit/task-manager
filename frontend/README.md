# Template Editor Frontend

A sophisticated template editor built with Next.js 14, featuring drag-and-drop sections, rich text editing, variables, and conditional logic.

## 🚀 Features

### Core Capabilities

- **Drag-and-Drop Section Builder**: Create and reorder template sections with intuitive drag-and-drop
- **Rich Text Editor (TipTap)**: Full-featured editor with markdown, code highlighting, tables, and media
- **Variable System**: Define typed variables with validation, defaults, and `{{variable}}` syntax
- **Conditional Logic**: Visual rule builder for IF-THEN-ELSE conditions
- **Template Management**: Version control, auto-save, import/export (JSON/YAML)

### Default Section Templates

- Data Model Definition
- Services Architecture
- HTTP/API Requests
- Test Scenarios
- Custom Sections

### Editor Features

- ✅ Undo/Redo with full history
- ✅ Auto-save with debouncing (30s interval)
- ✅ Preview mode toggle
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Real-time state management (Zustand)
- ✅ Conflict resolution
- ✅ Template tree view
- ✅ Properties panel
- ✅ Variable manager

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **State Management**: Zustand
- **Rich Text**: TipTap
- **Drag & Drop**: @dnd-kit
- **Syntax Highlighting**: Lowlight
- **Utilities**: date-fns, immer, js-yaml

## 📦 Installation

```bash
cd frontend
npm install
```

## 🏃 Running the App

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Homepage
│   │   ├── editor/
│   │   │   └── page.tsx          # Template Editor page
│   │   ├── globals.css           # Global styles
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── ui/                   # Shadcn/UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   └── template-editor/      # Custom components
│   │       ├── TemplateTreeView.tsx
│   │       ├── PropertiesPanel.tsx
│   │       ├── SectionBuilder.tsx
│   │       ├── RichTextEditor.tsx
│   │       └── VariableManager.tsx
│   ├── store/
│   │   └── templateStore.ts      # Zustand store
│   ├── types/
│   │   └── template.ts           # TypeScript types
│   └── lib/
│       └── utils.ts              # Utility functions
├── public/                       # Static assets
├── components.json               # Shadcn config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

## 🎨 Key Components

### Template Editor (`/editor`)

Main editor interface with:
- Left sidebar: Template structure tree
- Center panel: Section builder/editor with tabs
- Right sidebar: Properties panel
- Top toolbar: Actions (save, undo/redo, variables, preview, etc.)

### Template Tree View

Displays template structure hierarchically:
- Collapsible sections
- Drag handles for reordering
- Selection indicator
- Quick actions (delete)

### Section Builder

Drag-and-drop interface for:
- Adding default section templates
- Creating custom sections
- Reordering sections
- Section management

### Rich Text Editor

TipTap-based editor with:
- Markdown support
- Code blocks with syntax highlighting
- Tables
- Images
- Variable insertion (`{{variable}}`)
- Formatting toolbar

### Variable Manager

Modal interface for:
- Creating/editing variables
- Type specification (string, number, boolean, array, object)
- Scope management (global/section)
- Validation rules
- Default values

### Properties Panel

Context-sensitive panel showing:
- Selected section properties
- Basic information (title, type, description)
- Statistics (subsections, variables, rules)
- Advanced options

## 🔧 State Management

The app uses Zustand for state management with:

- **History**: Undo/redo with past/present/future states
- **Auto-save**: Debounced auto-save every 30 seconds
- **Conflict Resolution**: Handles concurrent edits
- **Immutable Updates**: Uses Immer for safe state updates

```typescript
// Example store usage
const { template, addSection, updateSection } = useTemplateStore();

// Add a section
addSection({
  title: 'New Section',
  type: 'custom',
  content: '',
  subsections: [],
});

// Update a section
updateSection(sectionId, (draft) => {
  draft.title = 'Updated Title';
});
```

## 📝 Type System

Comprehensive TypeScript types for:

- **Template**: Main template structure
- **Section**: Template sections with subsections
- **Variable**: Typed variables with validation
- **ConditionalLogic**: IF-THEN-ELSE rules
- **EditorState**: UI state management

## 🎯 Future Enhancements

### Phase 1 Additions
- [ ] Template versioning UI with diff viewer
- [ ] Collaborative editing with real-time sync
- [ ] Template marketplace
- [ ] Advanced search and filtering

### Phase 2 Additions
- [ ] Conditional logic builder UI
- [ ] Template testing framework
- [ ] Export to multiple formats (PDF, MD, HTML)
- [ ] Template analytics

### Phase 3 Additions
- [ ] AI-powered template suggestions
- [ ] Template validation engine
- [ ] Custom field types
- [ ] Integration with backend API

## 🔌 API Integration

To connect with the backend:

1. Set environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

2. Update `templateStore.ts` to use actual API calls in the `triggerAutoSave` method.

## 📄 License

Part of the Task Manager System project.
