export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';
export type SubtaskType = 'data-model' | 'service' | 'http-api' | 'test' | 'custom';

export interface PhaseConfig {
  templateId?: string;
  aiProviderId?: string;
  parameters: Record<string, unknown>;
  timeout?: number;
  retryCount?: number;
}

export interface Phase {
  id: string;
  name: string;
  description?: string;
  type: 'standard' | 'conditional' | 'loop' | 'custom';
  status: PhaseStatus;
  order: number;
  config: PhaseConfig;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  errorMessage?: string;
  progress: number;
  // For conditional/loop phases
  condition?: string;
  iterations?: number;
  currentIteration?: number;
  // For React Flow
  position: { x: number; y: number };
  connections: string[]; // IDs of connected phases
}

export interface Subtask {
  id: string;
  taskId: string;
  type: SubtaskType;
  title: string;
  description: string;
  content: Record<string, unknown>;
  prompt?: string;
  status: PhaseStatus;
  progress: number;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // For nested subtasks
  children?: Subtask[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  subtasks: Subtask[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface PipelineResult {
  id: string;
  taskId: string;
  generatedPrompts: GeneratedPrompt[];
  metadata: {
    totalDuration: number;
    phasesExecuted: number;
    tokensUsed: number;
    cost: number;
  };
  createdAt: Date;
}

export interface GeneratedPrompt {
  id: string;
  title: string;
  content: string;
  type: SubtaskType;
  language?: string;
  metadata: Record<string, unknown>;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  status: PipelineStatus;
  phases: Phase[];
  currentPhaseId?: string;
  task?: Task;
  result?: PipelineResult;
  createdAt: Date;
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  timestamp: Date;
}

export interface PhaseStats {
  phaseId: string;
  phaseName: string;
  duration: number;
  tokensUsed: number;
  cost: number;
  status: PhaseStatus;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}
