import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
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

interface DashboardState {
  // Statistics
  taskStatistics: TaskStatistics | null;
  aiUsageMetrics: AIUsageMetrics | null;
  activities: Activity[];
  
  // Tasks
  tasks: Task[];
  selectedTask: Task | null;
  taskFilter: TaskFilter;
  taskSort: SortConfig;
  taskPagination: PaginationConfig;
  
  // Analytics
  taskTrends: TaskTrend[];
  providerPerformance: ProviderPerformance[];
  templateUsage: TemplateUsage[];
  costAnalysis: CostAnalysis[];
  roiMetrics: ROIMetric[];
  
  // Reports
  reports: Report[];
  
  // Collaboration
  comments: Comment[];
  notifications: Notification[];
  unreadNotificationCount: number;
  currentWorkspace: Workspace | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  darkMode: boolean;
  
  // Actions
  setTaskStatistics: (stats: TaskStatistics) => void;
  setAIUsageMetrics: (metrics: AIUsageMetrics) => void;
  addActivity: (activity: Activity) => void;
  setActivities: (activities: Activity[]) => void;
  
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  resetTaskFilter: () => void;
  setTaskSort: (sort: SortConfig) => void;
  setTaskPagination: (pagination: Partial<PaginationConfig>) => void;
  
  setTaskTrends: (trends: TaskTrend[]) => void;
  setProviderPerformance: (performance: ProviderPerformance[]) => void;
  setTemplateUsage: (usage: TemplateUsage[]) => void;
  setCostAnalysis: (analysis: CostAnalysis[]) => void;
  setROIMetrics: (metrics: ROIMetric[]) => void;
  
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (reportId: string, updates: Partial<Report>) => void;
  deleteReport: (reportId: string) => void;
  
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  updateComment: (commentId: string, updates: Partial<Comment>) => void;
  deleteComment: (commentId: string) => void;
  
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  
  resetDashboard: () => void;
}

const initialTaskFilter: TaskFilter = {};
const initialTaskSort: SortConfig = { field: 'createdAt', direction: 'desc' };
const initialPagination: PaginationConfig = { page: 1, pageSize: 20, total: 0 };

export const useDashboardStore = create<DashboardState>()(
  immer((set) => ({
    // Initial State
    taskStatistics: null,
    aiUsageMetrics: null,
    activities: [],
    
    tasks: [],
    selectedTask: null,
    taskFilter: initialTaskFilter,
    taskSort: initialTaskSort,
    taskPagination: initialPagination,
    
    taskTrends: [],
    providerPerformance: [],
    templateUsage: [],
    costAnalysis: [],
    roiMetrics: [],
    
    reports: [],
    
    comments: [],
    notifications: [],
    unreadNotificationCount: 0,
    currentWorkspace: null,
    
    isLoading: false,
    error: null,
    sidebarOpen: true,
    darkMode: false,
    
    // Actions
    setTaskStatistics: (stats) => set({ taskStatistics: stats }),
    setAIUsageMetrics: (metrics) => set({ aiUsageMetrics: metrics }),
    
    addActivity: (activity) => set((state) => {
      state.activities.unshift(activity);
      if (state.activities.length > 100) {
        state.activities = state.activities.slice(0, 100);
      }
    }),
    
    setActivities: (activities) => set({ activities }),
    
    setTasks: (tasks) => set({ tasks }),
    
    addTask: (task) => set((state) => {
      state.tasks.push(task);
    }),
    
    updateTask: (taskId, updates) => set((state) => {
      const index = state.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...updates };
      }
      if (state.selectedTask?.id === taskId) {
        state.selectedTask = { ...state.selectedTask, ...updates };
      }
    }),
    
    deleteTask: (taskId) => set((state) => {
      state.tasks = state.tasks.filter(t => t.id !== taskId);
      if (state.selectedTask?.id === taskId) {
        state.selectedTask = null;
      }
    }),
    
    setSelectedTask: (task) => set({ selectedTask: task }),
    
    setTaskFilter: (filter) => set((state) => {
      state.taskFilter = { ...state.taskFilter, ...filter };
    }),
    
    resetTaskFilter: () => set({ taskFilter: initialTaskFilter }),
    
    setTaskSort: (sort) => set({ taskSort: sort }),
    
    setTaskPagination: (pagination) => set((state) => {
      state.taskPagination = { ...state.taskPagination, ...pagination };
    }),
    
    setTaskTrends: (trends) => set({ taskTrends: trends }),
    setProviderPerformance: (performance) => set({ providerPerformance: performance }),
    setTemplateUsage: (usage) => set({ templateUsage: usage }),
    setCostAnalysis: (analysis) => set({ costAnalysis: analysis }),
    setROIMetrics: (metrics) => set({ roiMetrics: metrics }),
    
    setReports: (reports) => set({ reports }),
    
    addReport: (report) => set((state) => {
      state.reports.push(report);
    }),
    
    updateReport: (reportId, updates) => set((state) => {
      const index = state.reports.findIndex(r => r.id === reportId);
      if (index !== -1) {
        state.reports[index] = { ...state.reports[index], ...updates };
      }
    }),
    
    deleteReport: (reportId) => set((state) => {
      state.reports = state.reports.filter(r => r.id !== reportId);
    }),
    
    setComments: (comments) => set({ comments }),
    
    addComment: (comment) => set((state) => {
      state.comments.push(comment);
    }),
    
    updateComment: (commentId, updates) => set((state) => {
      const index = state.comments.findIndex(c => c.id === commentId);
      if (index !== -1) {
        state.comments[index] = { ...state.comments[index], ...updates };
      }
    }),
    
    deleteComment: (commentId) => set((state) => {
      state.comments = state.comments.filter(c => c.id !== commentId);
    }),
    
    setNotifications: (notifications) => set((state) => {
      state.notifications = notifications;
      state.unreadNotificationCount = notifications.filter(n => !n.read).length;
    }),
    
    addNotification: (notification) => set((state) => {
      state.notifications.unshift(notification);
      if (!notification.read) {
        state.unreadNotificationCount += 1;
      }
    }),
    
    markNotificationAsRead: (notificationId) => set((state) => {
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1);
      }
    }),
    
    markAllNotificationsAsRead: () => set((state) => {
      state.notifications.forEach(n => { n.read = true; });
      state.unreadNotificationCount = 0;
    }),
    
    setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
    
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => { state.sidebarOpen = !state.sidebarOpen; }),
    setDarkMode: (dark) => set({ darkMode: dark }),
    toggleDarkMode: () => set((state) => { state.darkMode = !state.darkMode; }),
    
    resetDashboard: () => set({
      taskStatistics: null,
      aiUsageMetrics: null,
      activities: [],
      tasks: [],
      selectedTask: null,
      taskFilter: initialTaskFilter,
      taskSort: initialTaskSort,
      taskPagination: initialPagination,
      taskTrends: [],
      providerPerformance: [],
      templateUsage: [],
      costAnalysis: [],
      roiMetrics: [],
      reports: [],
      comments: [],
      notifications: [],
      unreadNotificationCount: 0,
      isLoading: false,
      error: null,
    }),
  }))
);
