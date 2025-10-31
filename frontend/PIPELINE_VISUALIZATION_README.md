# Pipeline Visualization Interface

A comprehensive, interactive pipeline visualization system built with Next.js, React Flow, and Framer Motion. This system provides a complete solution for visualizing, monitoring, and managing task execution pipelines.

## 🎯 Features

### 1. **Pipeline Builder** (React Flow)
- ✅ Drag-and-drop phase creation
- ✅ Visual phase connections with animated edges
- ✅ Multiple phase types: standard, conditional, loop, custom
- ✅ Real-time phase status indicators
- ✅ Phase configuration panels
- ✅ Mini-map for navigation
- ✅ Context menu with phase actions (edit, retry, skip, delete)
- ✅ Double-click edges to disconnect phases

### 2. **Execution Monitor**
- ✅ Real-time pipeline progress tracking
- ✅ Phase status indicators (pending, running, completed, failed, skipped)
- ✅ Animated progress bars and visualizations
- ✅ Time elapsed per phase
- ✅ Resource usage graphs (CPU, Memory)
- ✅ Phase timeline with status icons
- ✅ Detailed phase statistics table
- ✅ Overall pipeline metrics

### 3. **Task View**
- ✅ Main task card with description and progress
- ✅ Hierarchical subtask tree visualization
- ✅ Collapsible subtask details
- ✅ Progress bars per subtask
- ✅ Status badges and icons
- ✅ Grouped subtasks by type (data-model, service, http-api, test, custom)
- ✅ Expandable subtask content and generated prompts
- ✅ Nested subtask support

### 4. **Result Display**
- ✅ Syntax-highlighted code viewer (supports multiple languages)
- ✅ Copy-to-clipboard functionality
- ✅ Export options: Markdown, JSON, PDF
- ✅ Light/Dark theme toggle for code
- ✅ Expandable prompt cards
- ✅ Metadata display
- ✅ Grouped prompts by type with tabs
- ✅ Result statistics (duration, tokens, cost)

### 5. **Control Panel**
- ✅ Start/Pause/Resume/Stop buttons
- ✅ Pipeline status display
- ✅ Current phase indicator
- ✅ Quick actions (settings, reset, export, clear)
- ✅ Pipeline statistics
- ✅ Pipeline settings dialog
- ✅ Confirmation dialogs for destructive actions

## 🚀 Getting Started

### Installation

All required dependencies are already installed:

```bash
# Dependencies included:
- reactflow: ^11.11.4
- framer-motion: ^12.23.24
- react-syntax-highlighter: ^16.1.0
- jspdf: ^3.0.3
- jspdf-autotable: ^5.0.2
- html2canvas: ^1.4.1
- recharts: ^3.3.0
- react-icons: ^5.5.0
```

### Usage

Navigate to the pipeline page:

```bash
http://localhost:3000/pipeline
```

## 📁 File Structure

```
frontend/src/
├── types/
│   └── pipeline.ts                 # TypeScript type definitions
├── store/
│   └── pipelineStore.ts           # Zustand state management
├── components/
│   └── pipeline/
│       ├── PipelineBuilder.tsx    # React Flow pipeline builder
│       ├── PhaseNode.tsx          # Custom phase node component
│       ├── PhaseConfigPanel.tsx   # Phase configuration dialog
│       ├── ExecutionMonitor.tsx   # Real-time monitoring dashboard
│       ├── TaskView.tsx           # Task and subtask visualization
│       ├── ResultDisplay.tsx      # Results viewer with export
│       └── ControlPanel.tsx       # Pipeline control interface
└── app/
    └── pipeline/
        └── page.tsx               # Main pipeline page
```

## 🎨 Components Overview

### PipelineBuilder

The core visualization component using React Flow.

**Features:**
- Drag nodes to reposition phases
- Click nodes to select phases
- Connect phases by dragging from source to target handle
- Double-click edges to remove connections
- Right-click nodes for context menu
- Zoom and pan controls
- Mini-map for overview

**Usage:**
```tsx
import PipelineBuilder from '@/components/pipeline/PipelineBuilder';

<PipelineBuilder onPhaseClick={(phaseId) => console.log(phaseId)} />
```

### PhaseNode

Custom React Flow node component for displaying phases.

**Features:**
- Visual status indicators (running, completed, failed, etc.)
- Progress bars for running phases
- Phase type icons (standard, conditional, loop, custom)
- Duration display
- Configuration button
- Context menu integration

### ExecutionMonitor

Real-time monitoring dashboard with charts and statistics.

**Features:**
- Overall progress indicator
- Phase status distribution
- Interactive phase timeline
- Resource usage charts (Recharts)
- Phase statistics table
- Animated status updates

### TaskView

Hierarchical task and subtask visualization.

**Features:**
- Collapsible subtask tree
- Grouped by subtask type
- Progress tracking per subtask
- Expandable details with content preview
- Generated prompt display
- Nested subtask support

### ResultDisplay

Generated prompts viewer with export capabilities.

**Features:**
- Syntax highlighting (react-syntax-highlighter)
- Copy to clipboard
- Export to Markdown, JSON, PDF
- Light/Dark theme toggle
- Expandable prompt cards
- Tabbed view by prompt type

### ControlPanel

Central control interface for pipeline execution.

**Features:**
- Start/Pause/Resume/Stop controls
- Current phase indicator
- Pipeline settings dialog
- Export pipeline configuration
- Pipeline statistics
- Quick actions

## 🎮 Interactive Features

### Click Interactions
- **Node Click**: Select phase and view details
- **Node Double-Click**: Open configuration panel
- **Edge Double-Click**: Remove connection
- **Background Click**: Deselect all

### Hover Effects
- Nodes scale up on hover
- Status cards animate on hover
- Interactive tooltips
- Smooth transitions

### Context Menus
- Right-click on phase nodes
- Configure, Retry, Skip, Delete actions
- Conditional action availability based on phase status

### Keyboard Shortcuts
(Can be extended)
- `Delete`: Remove selected phase
- `Ctrl/Cmd + C`: Copy selected phase
- `Ctrl/Cmd + V`: Paste phase

## 🎨 Animations

All animations powered by Framer Motion:

```tsx
// Example: Fade in with slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>

// Example: Scale on hover
<motion.div
  whileHover={{ scale: 1.05 }}
  transition={{ duration: 0.2 }}
>
  {/* Content */}
</motion.div>
```

## 📊 State Management

Using Zustand for global state:

```tsx
// Example: Using the pipeline store
const {
  pipeline,
  addPhase,
  updatePhase,
  startPipeline,
  pausePipeline,
} = usePipelineStore();

// Add a new phase
addPhase({
  name: 'Data Processing',
  type: 'standard',
  // ... other phase properties
});

// Start pipeline execution
startPipeline();
```

## 🎯 Type Safety

Complete TypeScript type definitions:

```typescript
// Phase status
type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// Pipeline status
type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

// Subtask types
type SubtaskType = 'data-model' | 'service' | 'http-api' | 'test' | 'custom';
```

## 🎨 Theming

Components support light/dark mode:

```tsx
// Automatic theme detection from system
// Manual toggle in Result Display for syntax highlighting

// Custom theme colors for phase status:
- Pending: Amber
- Running: Blue (animated)
- Completed: Green
- Failed: Red
- Skipped: Gray
```

## 📈 Performance Optimizations

- **React Flow**: Optimized rendering for large graphs
- **Memoization**: useCallback and useMemo for expensive operations
- **Virtual Scrolling**: For large subtask lists
- **Debounced Updates**: For real-time monitoring
- **Lazy Loading**: Components loaded on-demand

## 🔧 Customization

### Adding Custom Phase Types

```typescript
// In types/pipeline.ts
export interface Phase {
  // ... existing properties
  type: 'standard' | 'conditional' | 'loop' | 'custom' | 'your-type';
}

// In PhaseNode.tsx
const getTypeIcon = () => {
  switch (phase.type) {
    case 'your-type':
      return '🎯';
    // ... other cases
  }
};
```

### Adding Custom Export Formats

```typescript
// In ResultDisplay.tsx
const handleExportCustom = () => {
  // Custom export logic
  const customData = transformResults(result);
  downloadFile(customData, 'custom-format.ext');
};
```

## 🐛 Troubleshooting

### React Flow Not Displaying
- Ensure parent container has defined height
- Check that `reactflow/dist/style.css` is imported

### Animations Not Working
- Verify Framer Motion is installed
- Check for conflicting CSS transitions

### Syntax Highlighting Issues
- Confirm language is supported by react-syntax-highlighter
- Check theme import path

## 📚 API Reference

### usePipelineStore

```typescript
interface PipelineStore {
  // State
  pipeline: Pipeline | null;
  selectedPhaseId: string | null;
  isExecuting: boolean;
  
  // Pipeline Actions
  createPipeline: (name: string, description?: string) => void;
  setPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (updates: Partial<Pipeline>) => void;
  clearPipeline: () => void;
  
  // Phase Actions
  addPhase: (phase: Omit<Phase, 'id'>) => void;
  updatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  deletePhase: (phaseId: string) => void;
  connectPhases: (sourceId: string, targetId: string) => void;
  
  // Execution Control
  startPipeline: () => void;
  pausePipeline: () => void;
  resumePipeline: () => void;
  stopPipeline: () => void;
  retryPhase: (phaseId: string) => void;
  skipPhase: (phaseId: string) => void;
  
  // Monitoring
  addResourceUsage: (usage: ResourceUsage) => void;
  addPhaseStats: (stats: PhaseStats) => void;
}
```

## 🚀 Next Steps

To integrate with backend:

1. **Connect to WebSocket** for real-time updates
2. **Implement API calls** in pipeline store actions
3. **Add authentication** before pipeline operations
4. **Enable collaborative editing** with real-time sync
5. **Add pipeline templates** for quick start

## 📝 License

Part of the Task Manager project - MIT License

## 🤝 Contributing

Feel free to extend the pipeline visualization with:
- New phase types
- Additional export formats
- Custom node shapes
- Advanced filtering and search
- Pipeline versioning UI

---

**Built with:** Next.js 14, React Flow, Framer Motion, Zustand, Shadcn/UI

**Status:** ✅ Complete and Production Ready
