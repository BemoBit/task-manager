/**
 * Pipeline Interfaces
 * Core interfaces for the task processing pipeline system
 */

export enum PipelineState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  DECOMPOSING = 'DECOMPOSING',
  ENRICHING = 'ENRICHING',
  GENERATING_PROMPTS = 'GENERATING_PROMPTS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum PhaseState {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  RETRYING = 'RETRYING',
}

export enum PipelineEventType {
  PIPELINE_STARTED = 'PIPELINE_STARTED',
  PIPELINE_COMPLETED = 'PIPELINE_COMPLETED',
  PIPELINE_FAILED = 'PIPELINE_FAILED',
  PIPELINE_PAUSED = 'PIPELINE_PAUSED',
  PIPELINE_RESUMED = 'PIPELINE_RESUMED',
  PHASE_STARTED = 'PHASE_STARTED',
  PHASE_COMPLETED = 'PHASE_COMPLETED',
  PHASE_FAILED = 'PHASE_FAILED',
  SUBTASK_GENERATED = 'SUBTASK_GENERATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  CHECKPOINT_CREATED = 'CHECKPOINT_CREATED',
}

export enum SubtaskCategory {
  DATA_MODEL = 'DATA_MODEL',
  SERVICE = 'SERVICE',
  HTTP_API = 'HTTP_API',
  TESTING = 'TESTING',
}

export interface PipelinePhase {
  id: string;
  name: string;
  order: number;
  state: PhaseState;
  templateId?: string;
  aiProviderId?: string;
  config: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface PipelineCheckpoint {
  id: string;
  pipelineId: string;
  state: PipelineState;
  currentPhase: number;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface PipelineContext {
  taskId: string;
  userId: string;
  projectRules?: Record<string, unknown>;
  codingStandards?: string[];
  techStack?: string[];
  customData?: Record<string, unknown>;
}

export interface SubtaskData {
  category: SubtaskCategory;
  title: string;
  description: string;
  requirements: string[];
  dependencies: string[];
  estimatedEffort?: string;
  priority?: number;
}

export interface PhaseResult {
  phaseId: string;
  success: boolean;
  output: Record<string, unknown>;
  error?: string;
  duration: number;
  subtasksGenerated?: SubtaskData[];
}

export interface PipelineResult {
  pipelineId: string;
  taskId: string;
  state: PipelineState;
  phases: PhaseResult[];
  subtasks: SubtaskData[];
  prompts: string[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
}

export interface PipelineEvent {
  type: PipelineEventType;
  pipelineId: string;
  taskId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface RetryStrategy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface PipelineConfig {
  enableParallelPhases: boolean;
  enableCheckpoints: boolean;
  checkpointInterval: number; // in seconds
  retryStrategy: RetryStrategy;
  timeoutMs: number;
  enableAuditLog: boolean;
}
