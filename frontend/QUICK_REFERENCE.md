# 🚀 Template Editor - Quick Reference

## Start Development Server
```bash
cd frontend
npm run dev
# Or
./start.sh
```
**URL**: http://localhost:3000

---

## Key URLs
- **Homepage**: http://localhost:3000
- **Editor**: http://localhost:3000/editor

---

## Keyboard Shortcuts
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Cmd/Ctrl + S`: Save (browser default, triggers auto-save)

---

## Core Features

### 1. Create Template
1. Open `/editor`
2. Enter name in toolbar
3. Add sections
4. Edit content
5. Save

### 2. Add Section
- Click "Add Section" button
- Choose: Data Model, Services, HTTP/API, Tests, or Custom
- Drag to reorder

### 3. Edit Content
- Select section in tree
- Switch to "Editor" tab
- Use rich text editor
- Insert variables with toolbar button

### 4. Manage Variables
- Click Variables icon in toolbar
- Add/Edit/Delete variables
- Set type, scope, defaults
- Variables: `{{variableName}}`

### 5. Preview
- Click "Preview" tab
- See rendered template
- Toggle preview mode (eye icon)

### 6. Save & Export
- Click "Save" button
- Auto-saves every 30s
- Export JSON with export button

---

## Component Locations

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   └── editor/page.tsx       # Main editor
├── components/template-editor/
│   ├── TemplateTreeView.tsx  # Left sidebar
│   ├── PropertiesPanel.tsx   # Right sidebar
│   ├── SectionBuilder.tsx    # Drag-drop builder
│   ├── RichTextEditor.tsx    # TipTap editor
│   └── VariableManager.tsx   # Variable modal
├── store/
│   └── templateStore.ts      # Zustand store
└── types/
    └── template.ts           # TypeScript types
```

---

## Store Actions

```typescript
const {
  // Template
  setTemplate,
  updateTemplate,
  
  // Sections
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
  
  // Variables
  addVariable,
  updateVariable,
  deleteVariable,
  
  // History
  undo,
  redo,
  canUndo,
  canRedo,
  
  // UI
  togglePreviewMode,
  setSelectedSection,
} = useTemplateStore();
```

---

## Common Tasks

### Add Custom Section
```typescript
addSection({
  title: 'My Section',
  type: 'custom',
  content: 'Content here',
  subsections: [],
});
```

### Update Section
```typescript
updateSection(sectionId, (draft) => {
  draft.title = 'New Title';
  draft.content = 'New content';
});
```

### Add Variable
```typescript
addVariable({
  name: 'projectName',
  type: 'string',
  scope: 'global',
  required: true,
  defaultValue: 'My Project',
});
```

---

## Build & Deploy

```bash
# Production build
npm run build

# Start production
npm start

# Lint
npm run lint
```

---

## File Structure

```
frontend/
├── src/                  # Source code
├── public/              # Static files
├── README.md            # Project overview
├── GUIDE.md             # Full guide
├── start.sh             # Quick start
└── package.json         # Dependencies
```

---

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v4
- Shadcn/UI
- Zustand + Immer
- TipTap
- @dnd-kit

---

## Default Section Types
1. **data-model**: Data Model Definition
2. **services**: Services Architecture
3. **http-api**: HTTP/API Requests
4. **tests**: Test Scenarios
5. **custom**: Custom Section

---

## Variable Types
- `string`
- `number`
- `boolean`
- `array`
- `object`

---

## Variable Scopes
- `global`: Available everywhere
- `section`: Section-specific

---

## Documentation
- `README.md`: Setup and overview
- `GUIDE.md`: Complete user/developer guide
- `FRONTEND_IMPLEMENTATION_SUMMARY.md`: Technical details
- `PHASE_2_1_COMPLETION_REPORT.md`: Implementation report

---

## Troubleshooting

### Build fails
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Port in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Reset state
- Clear browser localStorage
- Refresh page

---

## Quick Links
- [Next.js Docs](https://nextjs.org/docs)
- [TipTap Docs](https://tiptap.dev/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Shadcn/UI](https://ui.shadcn.com/)

---

## Support
Check documentation files or review code comments for detailed explanations.

**Happy Building! 🎉**
