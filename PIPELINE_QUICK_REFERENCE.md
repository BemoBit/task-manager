# Pipeline Visualization - Quick Reference

## 🚀 Quick Start

```bash
# Navigate to pipeline page
http://localhost:3000/pipeline

# Create new pipeline
Click "Create New Pipeline" → Enter name → Done!
```

## 📍 Navigation

### Main Tabs
- **Builder** - Visual pipeline designer (React Flow)
- **Monitor** - Real-time execution monitoring
- **Tasks** - Task and subtask details
- **Results** - Generated prompts with export

## ⌨️ Keyboard & Mouse Actions

### Pipeline Builder
| Action | Effect |
|--------|--------|
| **Drag node** | Reposition phase |
| **Click node** | Select phase |
| **Right-click node** | Open context menu |
| **Double-click node** | Open configuration |
| **Double-click edge** | Remove connection |
| **Drag from handle** | Create connection |
| **Mouse wheel** | Zoom in/out |
| **Click + drag background** | Pan canvas |

### Context Menu (Right-click)
- ⚙️ **Configure** - Open settings
- 🔄 **Retry** - Retry failed phase
- ⏭️ **Skip** - Skip phase
- 🗑️ **Delete** - Remove phase

## 🎮 Control Panel Actions

```
Start Pipeline    → Begin execution
Pause             → Temporarily halt
Resume            → Continue from pause
Stop              → Cancel execution
Settings          → Edit pipeline details
Export            → Download as JSON
Clear             → Remove pipeline
```

## 📊 Phase Types

| Type | Icon | Use Case |
|------|------|----------|
| **Standard** | 📋 | Sequential execution |
| **Conditional** | 🔀 | If-then logic |
| **Loop** | 🔁 | Multiple iterations |
| **Custom** | ⚙️ | User-defined |

## 🎨 Status Colors

| Status | Color | Icon |
|--------|-------|------|
| **Pending** | 🟡 Amber | ⏰ |
| **Running** | 🔵 Blue | ▶️ (animated) |
| **Completed** | 🟢 Green | ✓ |
| **Failed** | 🔴 Red | ✗ |
| **Skipped** | ⚫ Gray | ⏭️ |

## 📤 Export Options

### Result Display
- **Markdown** (.md) - Text format with code blocks
- **JSON** (.json) - Structured data export
- **PDF** (.pdf) - Professional document

### Control Panel
- **Export Pipeline** - Save configuration as JSON

## 🔧 Configuration Quick Guide

### Phase Settings
```
Name            → Phase identifier
Description     → Purpose/notes
Type            → standard/conditional/loop/custom
Template ID     → AI template reference
AI Provider ID  → AI service to use
Timeout         → Max execution time (seconds)
Retry Count     → Failed attempt retries
```

### Loop Phase
```
Iterations      → Number of times to repeat
Current         → Current iteration (read-only)
```

### Conditional Phase
```
Condition       → JavaScript expression
                  e.g., task.status === 'completed'
```

## 📱 Mobile/Tablet Usage

- Tap node to select
- Long-press for context menu
- Pinch to zoom
- Two-finger drag to pan
- Swipe tabs to navigate

## 🎯 Common Workflows

### 1. Create Simple Pipeline
```
1. Create Pipeline
2. Add Phase (Standard)
3. Configure phase
4. Add more phases
5. Connect phases
6. Start execution
```

### 2. Add Conditional Branch
```
1. Add Phase (Conditional)
2. Set condition
3. Connect to different paths
4. Configure success/failure routes
```

### 3. Monitor Execution
```
1. Start pipeline
2. Switch to Monitor tab
3. Watch real-time progress
4. View resource usage
5. Check phase statistics
```

### 4. Export Results
```
1. Wait for completion
2. Go to Results tab
3. Choose export format
4. Click export button
5. File downloads automatically
```

## 🐛 Troubleshooting

### Pipeline Won't Start
- ✓ Check all phases are configured
- ✓ Verify phases are connected
- ✓ Ensure no circular dependencies

### Node Not Moving
- ✓ Click and hold to drag
- ✓ Check if node is locked
- ✓ Verify not in execution mode

### Export Not Working
- ✓ Complete pipeline execution first
- ✓ Check browser download settings
- ✓ Ensure popup blockers are disabled

### Progress Not Updating
- ✓ Check network connection
- ✓ Verify WebSocket connection (when integrated)
- ✓ Refresh page if needed

## 💡 Pro Tips

1. **Use Mini-Map** - Navigate large pipelines easily
2. **Double-click Edges** - Quick way to disconnect
3. **Right-click Nodes** - Fastest access to actions
4. **Save Configurations** - Export before major changes
5. **Group by Type** - Organize phases logically
6. **Use Descriptions** - Document phase purposes
7. **Monitor Tab** - Best for tracking execution
8. **Copy Prompts** - One-click clipboard copy

## 🎨 Customization

### Theme Toggle
Results tab → Click sun/moon icon → Switch theme

### Phase Colors
Automatic based on status - see Status Colors table

### Layout
Drag phases anywhere → Auto-saves position

## 📞 Component API

### usePipelineStore Hook
```typescript
const {
  pipeline,          // Current pipeline
  addPhase,          // Add new phase
  updatePhase,       // Modify phase
  startPipeline,     // Begin execution
  pausePipeline,     // Pause execution
} = usePipelineStore();
```

### Common Actions
```typescript
// Add phase
addPhase({
  name: 'My Phase',
  type: 'standard',
  // ... config
});

// Update phase
updatePhase(phaseId, {
  status: 'completed',
  progress: 100
});

// Connect phases
connectPhases(sourceId, targetId);
```

## 📚 Learn More

- Full Documentation: `PIPELINE_VISUALIZATION_README.md`
- Implementation Details: `PIPELINE_VISUALIZATION_COMPLETE.md`
- System Architecture: `Task Manager System Architecture - AI Design.md`

## 🆘 Need Help?

1. Check documentation files
2. Review type definitions in `src/types/pipeline.ts`
3. Explore example usage in `src/app/pipeline/page.tsx`
4. Inspect component props and interfaces

---

**Quick Access:** `/pipeline` → Start building! 🚀
