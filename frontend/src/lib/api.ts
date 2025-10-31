import {
  Task,
  TaskStatistics,
  AIUsageMetrics,
  Activity,
  TaskTrend,
  ProviderPerformance,
  TemplateUsage,
  CostAnalysis,
  ROIMetric,
  Report,
  Comment,
  Notification,
  Workspace,
  TaskFilter,
  SortConfig,
  PaginationConfig,
} from '@/types/dashboard';

// Template type (simplified for API use)
export interface Template {
  id: string;
  name: string;
  description: string;
  category?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  config?: Record<string, unknown>;
  usageCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base API URL - should be from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Get auth token from storage (if authentication is enabled)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  // Add authorization header if token exists
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  // Handle empty responses (like DELETE operations)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  const json = JSON.parse(text);
  // Extract data from the standardized response format
  return json.data || json;
}

// Backend response type for task statistics
interface BackendTaskStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  failedTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  completionRate: number;
  avgCompletionTime: number;
}

// Dashboard Statistics APIs
export const dashboardAPI = {
  // Get task statistics
  getTaskStatistics: async (): Promise<TaskStatistics> => {
    const data = await fetchAPI<BackendTaskStatistics>('/dashboard/statistics/tasks');
    // Map backend field names to frontend expected names
    return {
      total: data.totalTasks || 0,
      completed: data.completedTasks || 0,
      inProgress: data.inProgressTasks || 0,
      failed: data.failedTasks || 0,
      pending: data.pendingTasks || 0,
    };
  },

  // Get AI usage metrics
  getAIUsageMetrics: async (dateRange?: { start: Date; end: Date }): Promise<AIUsageMetrics> => {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('startDate', dateRange.start.toISOString());
      params.append('endDate', dateRange.end.toISOString());
    }
    const data = await fetchAPI<{
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      successRate: number;
      totalTokens: number;
      totalCost: number;
      avgDuration: number;
    }>(`/dashboard/statistics/ai-usage?${params}`);
    
    // Map backend response to frontend expected structure
    return {
      totalRequests: data.totalRequests || 0,
      totalTokens: data.totalTokens || 0,
      totalCost: data.totalCost || 0,
      requestsByProvider: {}, // Backend doesn't provide this yet
      tokensByProvider: {}, // Backend doesn't provide this yet
      costsByProvider: {}, // Backend doesn't provide this yet
      averageResponseTime: data.avgDuration || 0,
    };
  },

  // Get recent activities
  getActivities: async (limit = 50): Promise<Activity[]> => {
    return fetchAPI<Activity[]>(`/dashboard/activities?limit=${limit}`);
  },

  // Get task trends
  getTaskTrends: async (period: 'week' | 'month' | 'quarter' | 'year'): Promise<TaskTrend[]> => {
    return fetchAPI<TaskTrend[]>(`/dashboard/analytics/task-trends?period=${period}`);
  },

  // Get provider performance
  getProviderPerformance: async (): Promise<ProviderPerformance[]> => {
    return fetchAPI<ProviderPerformance[]>('/dashboard/analytics/provider-performance');
  },

  // Get template usage
  getTemplateUsage: async (): Promise<TemplateUsage[]> => {
    return fetchAPI<TemplateUsage[]>('/dashboard/analytics/template-usage');
  },

  // Get cost analysis
  getCostAnalysis: async (period: 'month' | 'quarter' | 'year'): Promise<CostAnalysis[]> => {
    return fetchAPI<CostAnalysis[]>(`/dashboard/analytics/cost-analysis?period=${period}`);
  },

  // Get ROI metrics
  getROIMetrics: async (): Promise<ROIMetric[]> => {
    return fetchAPI<ROIMetric[]>('/dashboard/analytics/roi-metrics');
  },
};

// Task Management APIs
export const taskAPI = {
  // Get all tasks with filters
  getTasks: async (
    filter?: TaskFilter,
    sort?: SortConfig,
    pagination?: PaginationConfig
  ): Promise<{ tasks: Task[]; total: number }> => {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.priority) params.append('priority', filter.priority.join(','));
      if (filter.assignedTo) params.append('assignedTo', filter.assignedTo.join(','));
      if (filter.tags) params.append('tags', filter.tags.join(','));
      if (filter.search) params.append('search', filter.search);
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start.toISOString());
        params.append('endDate', filter.dateRange.end.toISOString());
      }
    }
    
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }
    
    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());
    }
    
    const tasksArray = await fetchAPI<Task[]>(`/tasks?${params}`);
    return { tasks: Array.isArray(tasksArray) ? tasksArray : [], total: Array.isArray(tasksArray) ? tasksArray.length : 0 };
  },

  // Get single task by ID
  getTaskById: async (taskId: string): Promise<Task> => {
    return fetchAPI<Task>(`/tasks/${taskId}`);
  },

  // Create new task
  createTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    return fetchAPI<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  // Update task
  updateTask: async (taskId: string, updates: Record<string, unknown>): Promise<Task> => {
    console.log('API updateTask called with:', { taskId, updates });
    const response = await fetchAPI<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    console.log('API updateTask response:', response);
    return response;
  },

  // Delete task
  deleteTask: async (taskId: string): Promise<void> => {
    return fetchAPI<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // Bulk operations
  bulkUpdateTasks: async (taskIds: string[], updates: Partial<Task>): Promise<Task[]> => {
    return fetchAPI<Task[]>('/tasks/bulk/update', {
      method: 'PATCH',
      body: JSON.stringify({ taskIds, updates }),
    });
  },

  bulkDeleteTasks: async (taskIds: string[]): Promise<void> => {
    return fetchAPI<void>('/tasks/bulk/delete', {
      method: 'DELETE',
      body: JSON.stringify({ taskIds }),
    });
  },
};

// Report APIs
export const reportAPI = {
  // Get all reports
  getReports: async (): Promise<Report[]> => {
    return fetchAPI<Report[]>('/reports');
  },

  // Get single report
  getReportById: async (reportId: string): Promise<Report> => {
    return fetchAPI<Report>(`/reports/${reportId}`);
  },

  // Create report
  createReport: async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> => {
    return fetchAPI<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  // Update report
  updateReport: async (reportId: string, updates: Partial<Report>): Promise<Report> => {
    return fetchAPI<Report>(`/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Delete report
  deleteReport: async (reportId: string): Promise<void> => {
    return fetchAPI<void>(`/reports/${reportId}`, {
      method: 'DELETE',
    });
  },

  // Generate report
  generateReport: async (reportId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/generate`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate report');
    }
    
    return response.blob();
  },

  // Schedule report
  scheduleReport: async (reportId: string, schedule: Report['schedule']): Promise<Report> => {
    return fetchAPI<Report>(`/reports/${reportId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  },
};

// Collaboration APIs
export const collaborationAPI = {
  // Comments
  getComments: async (taskId: string): Promise<Comment[]> => {
    return fetchAPI<Comment[]>(`/tasks/${taskId}/comments`);
  },

  createComment: async (taskId: string, content: string, mentions: string[]): Promise<Comment> => {
    return fetchAPI<Comment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, mentions }),
    });
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    return fetchAPI<Comment>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  deleteComment: async (commentId: string): Promise<void> => {
    return fetchAPI<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    return fetchAPI<Notification[]>('/notifications');
  },

  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    return fetchAPI<void>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    return fetchAPI<void>('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    return fetchAPI<void>(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  // Workspaces
  getWorkspaces: async (): Promise<Workspace[]> => {
    return fetchAPI<Workspace[]>('/workspaces');
  },

  getWorkspaceById: async (workspaceId: string): Promise<Workspace> => {
    return fetchAPI<Workspace>(`/workspaces/${workspaceId}`);
  },

  createWorkspace: async (workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> => {
    return fetchAPI<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspace),
    });
  },

  updateWorkspace: async (workspaceId: string, updates: Partial<Workspace>): Promise<Workspace> => {
    return fetchAPI<Workspace>(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteWorkspace: async (workspaceId: string): Promise<void> => {
    return fetchAPI<void>(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  },

  // Workspace members
  addWorkspaceMember: async (workspaceId: string, userId: string, role: string): Promise<Workspace> => {
    return fetchAPI<Workspace>(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  removeWorkspaceMember: async (workspaceId: string, userId: string): Promise<Workspace> => {
    return fetchAPI<Workspace>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Template APIs
export const templateAPI = {
  // Get all templates
  getTemplates: async (): Promise<Template[]> => {
    return fetchAPI<Template[]>('/templates');
  },

  // Get single template
  getTemplateById: async (templateId: string): Promise<Template> => {
    return fetchAPI<Template>(`/templates/${templateId}`);
  },

  // Create template
  createTemplate: async (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
    return fetchAPI<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  // Update template
  updateTemplate: async (templateId: string, updates: Partial<Template>): Promise<Template> => {
    return fetchAPI<Template>(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete template
  deleteTemplate: async (templateId: string): Promise<void> => {
    return fetchAPI<void>(`/templates/${templateId}`, {
      method: 'DELETE',
    });
  },
};

// Export data
export const exportAPI = {
  exportTasks: async (format: 'json' | 'csv' | 'pdf', filter?: TaskFilter): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    
    if (filter) {
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.priority) params.append('priority', filter.priority.join(','));
    }
    
    const response = await fetch(`${API_BASE_URL}/export/tasks?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to export tasks');
    }
    
    return response.blob();
  },

  exportAnalytics: async (type: string, period: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/export/analytics?type=${type}&period=${period}`);
    
    if (!response.ok) {
      throw new Error('Failed to export analytics');
    }
    
    return response.blob();
  },
};
