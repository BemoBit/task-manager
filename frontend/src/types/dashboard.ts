// Dashboard Types
export interface TaskStatistics {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  pending: number;
}

export interface AIUsageMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  requestsByProvider: Record<string, number>;
  tokensByProvider: Record<string, number>;
  costsByProvider: Record<string, number>;
  averageResponseTime: number;
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_failed' | 'template_updated' | 'ai_request' | 'report_generated' | 'task' | 'audit';
  title?: string;
  action?: string;
  description: string;
  user?: string;
  timestamp: string | Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetric {
  timestamp: Date;
  value: number;
  label: string;
}

export interface TaskTrend {
  date: string;
  completed: number;
  created: number;
  failed: number;
}

export interface ProviderPerformance {
  providerId: string;
  providerName: string;
  successRate: number;
  averageResponseTime: number;
  totalRequests: number;
  totalCost: number;
}

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface UserActivityData {
  userId: string;
  username: string;
  tasksCreated: number;
  tasksCompleted: number;
  lastActive: Date;
}

export interface CostAnalysis {
  period: string;
  totalCost: number;
  breakdown: {
    providerId: string;
    providerName: string;
    cost: number;
    percentage: number;
  }[];
}

export interface ROIMetric {
  period: string;
  timeSaved: number; // in hours
  costIncurred: number;
  tasksCompleted: number;
  roi: number; // percentage
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  dependencies: string[];
  phaseId?: string;
  templateId?: string;
  progress: number;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  type: 'data-model' | 'service' | 'http-api' | 'testing' | 'other';
  prompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
}

export interface CalendarEvent {
  id: string;
  taskId: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  assignee?: string;
}

// Report Types
export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'task-summary' | 'ai-usage' | 'cost-analysis' | 'performance' | 'custom';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    enabled: boolean;
  };
  recipients: string[];
  format: 'pdf' | 'excel' | 'json' | 'csv';
  filters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  lastGenerated?: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  customizable: boolean;
}

export interface ReportSection {
  id: string;
  type: 'chart' | 'table' | 'text' | 'metrics';
  title: string;
  config: Record<string, unknown>;
}

// Collaboration Types
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  username: string;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  replies: Comment[];
}

export interface Cursor {
  userId: string;
  username: string;
  position: { x: number; y: number };
  color: string;
  lastUpdate: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'task_assigned' | 'task_completed' | 'comment' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

// Filter and Sort Types
export interface TaskFilter {
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}
