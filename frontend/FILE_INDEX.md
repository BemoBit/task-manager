# 📑 Template Editor Frontend - File Index

## Quick Navigation

### 📖 Documentation
- [`README.md`](./README.md) - Project overview and setup instructions
- [`GUIDE.md`](./GUIDE.md) - Complete user and developer guide
- [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - Quick commands and shortcuts
- [`../FRONTEND_IMPLEMENTATION_SUMMARY.md`](../FRONTEND_IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [`../PHASE_2_1_COMPLETION_REPORT.md`](../PHASE_2_1_COMPLETION_REPORT.md) - Completion report

### 🚀 Scripts
- [`start.sh`](./start.sh) - Quick start development server
- `package.json` - Dependencies and scripts

---

## 📂 Source Code Structure

### Core Application (`src/app/`)
- `page.tsx` - Homepage with hero and features
- `editor/page.tsx` - Main template editor interface
- `layout.tsx` - Root layout with fonts
- `globals.css` - Global styles and TipTap customization

### Components (`src/components/`)

#### Template Editor (`template-editor/`)
1. **TemplateTreeView.tsx**
   - Hierarchical section navigation
   - Collapsible tree structure
   - Drag handles for sections
   - Selection management

2. **PropertiesPanel.tsx**
   - Context-sensitive properties
   - Section editing (title, type, content)
   - Statistics display
   - Advanced options

3. **SectionBuilder.tsx**
   - Drag-and-drop section management
   - Default section templates
   - Custom section creation
   - Section reordering with @dnd-kit

4. **RichTextEditor.tsx**
   - TipTap integration
   - Formatting toolbar
   - Code highlighting
   - Table/image support
   - Variable insertion

5. **VariableManager.tsx**
   - Variable CRUD operations
   - Type selection
   - Scope management
   - Form validation

#### UI Components (`ui/`)
16 Shadcn/UI components:
- `button.tsx` - Button variants
- `card.tsx` - Card layouts
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Text inputs
- `label.tsx` - Form labels
- `textarea.tsx` - Multi-line inputs
- `select.tsx` - Dropdown selects
- `dropdown-menu.tsx` - Context menus
- `sheet.tsx` - Side panels
- `tabs.tsx` - Tab navigation
- `separator.tsx` - Visual dividers
- `scroll-area.tsx` - Scrollable containers
- `badge.tsx` - Status badges
- `tooltip.tsx` - Hover tooltips
- `accordion.tsx` - Collapsible sections
- `alert-dialog.tsx` - Confirmation dialogs

### State Management (`src/store/`)
- **templateStore.ts**
  - Zustand store with DevTools
  - Template CRUD operations
  - Section management (add, update, delete, reorder)
  - Variable management
  - Undo/redo with 50-state history
  - Auto-save with debouncing
  - Conflict resolution strategies
  - Editor state (selection, preview mode)

### Type Definitions (`src/types/`)
- **template.ts**
  - `Template` - Main template structure
  - `Section` - Section with subsections
  - `Variable` - Typed variables
  - `VariableType` - string | number | boolean | array | object
  - `VariableScope` - global | section
  - `ConditionalLogic` - IF-THEN-ELSE rules
  - `Condition` - Individual conditions
  - `SectionField` - Custom fields
  - `EditorState` - UI state
  - `HistoryState` - Undo/redo state

### Utilities (`src/lib/`)
- **utils.ts** - Utility functions (cn for className merging)

---

## 📊 Component Relationships

```
App Layout
├── Homepage
│   ├── Hero Section
│   ├── Feature Cards
│   ├── Feature Details
│   └── Quick Start
│
└── Editor Page
    ├── Toolbar (actions)
    ├── TemplateTreeView (left)
    │   └── Recursive TreeNode
    ├── Main Content (center)
    │   ├── SectionBuilder Tab
    │   │   └── SortableSection
    │   ├── RichTextEditor Tab
    │   │   └── MenuButton toolbar
    │   └── Preview Tab
    ├── PropertiesPanel (right)
    └── VariableManager Modal
```

---

## 🔄 State Flow

```
User Interaction
    ↓
Component Handler
    ↓
Zustand Action (templateStore)
    ↓
Immer Draft Modification
    ↓
History Update (past/present/future)
    ↓
Component Re-render
    ↓
Auto-save Trigger (debounced 30s)
```

---

## 🎨 Styling System

```
Tailwind CSS v4
    ↓
CSS Variables (globals.css)
    ↓
Shadcn/UI Theme
    ↓
Component-level Styles
    ↓
Dark Mode Support
```

---

## 📦 Dependencies Overview

### Core Framework
- `next` ^16.0.1 - React framework
- `react` ^19.0.0 - UI library
- `typescript` ^5 - Type safety

### State Management
- `zustand` - Global state store
- `immer` - Immutable updates

### UI Components
- `@radix-ui/*` - Headless components
- `lucide-react` - Icon library
- `tailwindcss` - CSS framework

### Rich Text Editor
- `@tiptap/react` - Editor framework
- `@tiptap/starter-kit` - Basic extensions
- `@tiptap/extension-*` - Additional features
- `lowlight` - Syntax highlighting

### Drag & Drop
- `@dnd-kit/core` - Core drag-drop
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - Helper functions

### Utilities
- `date-fns` - Date formatting
- `js-yaml` - YAML support
- `class-variance-authority` - Variant styles
- `clsx` - Conditional classes
- `tailwind-merge` - Class merging

---

## 🧪 Testing Structure (Future)

```
__tests__/
├── components/
│   ├── TemplateTreeView.test.tsx
│   ├── SectionBuilder.test.tsx
│   └── RichTextEditor.test.tsx
├── store/
│   └── templateStore.test.ts
└── utils/
    └── helpers.test.ts
```

---

## 🔧 Configuration Files

- `components.json` - Shadcn/UI configuration
- `tailwind.config.ts` - Tailwind CSS settings
- `tsconfig.json` - TypeScript compiler options
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - Linting rules
- `.gitignore` - Git exclusions

---

## 📝 File Statistics

| Category | Count | Purpose |
|----------|-------|---------|
| Pages | 2 | Homepage, Editor |
| Custom Components | 5 | Template editor features |
| UI Components | 16 | Shadcn/UI base |
| Store Files | 1 | State management |
| Type Files | 1 | TypeScript definitions |
| Documentation | 5 | Guides and references |
| Config Files | 6 | Build and tools |
| **Total** | **36+** | Complete application |

---

## 🎯 Key Files for Development

### Starting Point
1. `src/app/editor/page.tsx` - Main editor UI
2. `src/store/templateStore.ts` - State management
3. `src/types/template.ts` - Type definitions

### Feature Development
4. `src/components/template-editor/*` - Add/modify features
5. `src/components/ui/*` - Customize UI components
6. `src/app/globals.css` - Style adjustments

### Documentation
7. `README.md` - Update project info
8. `GUIDE.md` - Update guides
9. `QUICK_REFERENCE.md` - Add shortcuts

---

## 🚀 Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Start production server
npm start

# Quick start script
./start.sh
```

---

## 📚 Learning Resources

### Official Documentation
- [Next.js 14](https://nextjs.org/docs)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Libraries Used
- [Zustand](https://github.com/pmndrs/zustand)
- [TipTap](https://tiptap.dev/docs)
- [DnD Kit](https://dndkit.com/)
- [Shadcn/UI](https://ui.shadcn.com/)

---

## 🎯 Where to Start

### For Users
1. Read [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)
2. Run `npm run dev`
3. Open http://localhost:3000
4. Follow quick start guide

### For Developers
1. Read [`README.md`](./README.md) - Setup
2. Read [`GUIDE.md`](./GUIDE.md) - Architecture
3. Explore `src/` - Code structure
4. Check [`FRONTEND_IMPLEMENTATION_SUMMARY.md`](../FRONTEND_IMPLEMENTATION_SUMMARY.md) - Details

### For Reviewers
1. Read [`PHASE_2_1_COMPLETION_REPORT.md`](../PHASE_2_1_COMPLETION_REPORT.md)
2. Check completion metrics
3. Review known limitations
4. Test the application

---

**Last Updated**: 2025-10-29  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
