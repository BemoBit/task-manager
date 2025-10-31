import { create } from 'zustand';
import {
  Pipeline,
  Phase,
  Task,
  ResourceUsage,
  PhaseStats,
  PipelineResult,
} from '@/types/pipeline';

interface PipelineStore {
  // State
  pipeline: Pipeline | null;
  selectedPhaseId: string | null;
  resourceUsage: ResourceUsage[];
  phaseStats: PhaseStats[];
  isExecuting: boolean;
  
  // Actions - Pipeline Management
  setPipeline: (pipeline: Pipeline) => void;
  createPipeline: (name: string, description?: string) => void;
  updatePipeline: (updates: Partial<Pipeline>) => void;
  clearPipeline: () => void;
  
  // Actions - Phase Management
  addPhase: (phase: Omit<Phase, 'id'>) => void;
  updatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  deletePhase: (phaseId: string) => void;
  reorderPhases: (sourceId: string, destinationId: string) => void;
  connectPhases: (sourceId: string, targetId: string) => void;
  disconnectPhases: (sourceId: string, targetId: string) => void;
  setSelectedPhase: (phaseId: string | null) => void;
  
  // Actions - Execution Control
  startPipeline: () => void;
  pausePipeline: () => void;
  resumePipeline: () => void;
  stopPipeline: () => void;
  retryPhase: (phaseId: string) => void;
  skipPhase: (phaseId: string) => void;
  
  // Actions - Task Management
  setTask: (task: Task) => void;
  updateTask: (updates: Partial<Task>) => void;
  
  // Actions - Monitoring
  addResourceUsage: (usage: ResourceUsage) => void;
  addPhaseStats: (stats: PhaseStats) => void;
  clearStats: () => void;
  
  // Actions - Results
  setResult: (result: PipelineResult) => void;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  // Initial State
  pipeline: null,
  selectedPhaseId: null,
  resourceUsage: [],
  phaseStats: [],
  isExecuting: false,
  
  // Pipeline Management
  setPipeline: (pipeline) => set({ pipeline }),
  
  createPipeline: (name, description) => {
    const newPipeline: Pipeline = {
      id: crypto.randomUUID(),
      name,
      description,
      status: 'idle',
      phases: [],
      createdAt: new Date(),
    };
    set({ pipeline: newPipeline });
  },
  
  updatePipeline: (updates) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      pipeline: {
        ...pipeline,
        ...updates,
      },
    });
  },
  
  clearPipeline: () => set({
    pipeline: null,
    selectedPhaseId: null,
    resourceUsage: [],
    phaseStats: [],
    isExecuting: false,
  }),
  
  // Phase Management
  addPhase: (phaseData) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    const newPhase: Phase = {
      ...phaseData,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
      order: pipeline.phases.length,
      connections: [],
    };
    
    set({
      pipeline: {
        ...pipeline,
        phases: [...pipeline.phases, newPhase],
      },
    });
  },
  
  updatePhase: (phaseId, updates) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      pipeline: {
        ...pipeline,
        phases: pipeline.phases.map((phase) =>
          phase.id === phaseId ? { ...phase, ...updates } : phase
        ),
      },
    });
  },
  
  deletePhase: (phaseId) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    // Remove connections to this phase
    const updatedPhases = pipeline.phases
      .filter((phase) => phase.id !== phaseId)
      .map((phase) => ({
        ...phase,
        connections: phase.connections.filter((id) => id !== phaseId),
      }));
    
    set({
      pipeline: {
        ...pipeline,
        phases: updatedPhases,
      },
      selectedPhaseId: get().selectedPhaseId === phaseId ? null : get().selectedPhaseId,
    });
  },
  
  reorderPhases: (sourceId, destinationId) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    const phases = [...pipeline.phases];
    const sourceIndex = phases.findIndex((p) => p.id === sourceId);
    const destIndex = phases.findIndex((p) => p.id === destinationId);
    
    if (sourceIndex === -1 || destIndex === -1) return;
    
    const [removed] = phases.splice(sourceIndex, 1);
    phases.splice(destIndex, 0, removed);
    
    // Update order property
    phases.forEach((phase, index) => {
      phase.order = index;
    });
    
    set({
      pipeline: {
        ...pipeline,
        phases,
      },
    });
  },
  
  connectPhases: (sourceId, targetId) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      pipeline: {
        ...pipeline,
        phases: pipeline.phases.map((phase) =>
          phase.id === sourceId
            ? {
                ...phase,
                connections: [...new Set([...phase.connections, targetId])],
              }
            : phase
        ),
      },
    });
  },
  
  disconnectPhases: (sourceId, targetId) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      pipeline: {
        ...pipeline,
        phases: pipeline.phases.map((phase) =>
          phase.id === sourceId
            ? {
                ...phase,
                connections: phase.connections.filter((id) => id !== targetId),
              }
            : phase
        ),
      },
    });
  },
  
  setSelectedPhase: (phaseId) => set({ selectedPhaseId: phaseId }),
  
  // Execution Control
  startPipeline: () => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      isExecuting: true,
      pipeline: {
        ...pipeline,
        status: 'running',
        startTime: new Date(),
      },
    });
    
    // TODO: Implement actual pipeline execution logic
    // This would connect to backend API
  },
  
  pausePipeline: () => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      isExecuting: false,
      pipeline: {
        ...pipeline,
        status: 'paused',
      },
    });
  },
  
  resumePipeline: () => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      isExecuting: true,
      pipeline: {
        ...pipeline,
        status: 'running',
      },
    });
  },
  
  stopPipeline: () => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      isExecuting: false,
      pipeline: {
        ...pipeline,
        status: 'idle',
        endTime: new Date(),
      },
    });
  },
  
  retryPhase: (phaseId) => {
    get().updatePhase(phaseId, {
      status: 'pending',
      progress: 0,
      errorMessage: undefined,
      startTime: undefined,
      endTime: undefined,
    });
    
    // TODO: Implement retry logic
  },
  
  skipPhase: (phaseId) => {
    get().updatePhase(phaseId, {
      status: 'skipped',
      progress: 100,
      endTime: new Date(),
    });
    
    // TODO: Move to next phase
  },
  
  // Task Management
  setTask: (task) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      pipeline: {
        ...pipeline,
        task,
      },
    });
  },
  
  updateTask: (updates) => {
    const { pipeline } = get();
    if (!pipeline || !pipeline.task) return;
    
    set({
      pipeline: {
        ...pipeline,
        task: {
          ...pipeline.task,
          ...updates,
        },
      },
    });
  },
  
  // Monitoring
  addResourceUsage: (usage) => {
    const { resourceUsage } = get();
    const maxDataPoints = 100;
    
    const newUsage = [...resourceUsage, usage].slice(-maxDataPoints);
    set({ resourceUsage: newUsage });
  },
  
  addPhaseStats: (stats) => {
    const { phaseStats } = get();
    set({
      phaseStats: [...phaseStats, stats],
    });
  },
  
  clearStats: () => set({
    resourceUsage: [],
    phaseStats: [],
  }),
  
  // Results
  setResult: (result) => {
    const { pipeline } = get();
    if (!pipeline) return;
    
    set({
      pipeline: {
        ...pipeline,
        result,
        status: 'completed',
        endTime: new Date(),
        totalDuration: result.metadata.totalDuration,
      },
    });
  },
}));
