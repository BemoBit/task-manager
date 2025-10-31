import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  AIProvider,
  PhaseProviderAssignment,
  ProviderUsageStats,
  UsageAnalytics,
  ProviderComparison,
  BenchmarkResult,
  ModelConfiguration,
} from '@/types/ai-provider';

interface AIProviderState {
  // Providers
  providers: AIProvider[];
  selectedProviderId: string | null;
  isLoadingProviders: boolean;
  
  // Phase Assignments
  phaseAssignments: PhaseProviderAssignment[];
  
  // Analytics
  usageStats: ProviderUsageStats[];
  analytics: UsageAnalytics | null;
  isLoadingAnalytics: boolean;
  
  // Testing
  comparisons: ProviderComparison[];
  benchmarks: BenchmarkResult[];
  isTestingProvider: boolean;
  
  // UI State
  error: string | null;
  
  // Actions - Provider Management
  setProviders: (providers: AIProvider[]) => void;
  addProvider: (provider: AIProvider) => void;
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  deleteProvider: (id: string) => void;
  selectProvider: (id: string | null) => void;
  toggleProviderStatus: (id: string) => void;
  testProviderConnection: (id: string) => Promise<void>;
  
  // Actions - Phase Assignment
  setPhaseAssignments: (assignments: PhaseProviderAssignment[]) => void;
  assignProviderToPhase: (assignment: PhaseProviderAssignment) => void;
  updatePhaseAssignment: (phaseId: string, updates: Partial<PhaseProviderAssignment>) => void;
  removePhaseAssignment: (phaseId: string) => void;
  
  // Actions - Analytics
  setUsageStats: (stats: ProviderUsageStats[]) => void;
  setAnalytics: (analytics: UsageAnalytics) => void;
  fetchAnalytics: (period: UsageAnalytics['period']) => Promise<void>;
  
  // Actions - Testing
  addComparison: (comparison: ProviderComparison) => void;
  addBenchmark: (benchmark: BenchmarkResult) => void;
  runProviderComparison: (providerIds: string[], prompt: string, config: ModelConfiguration) => Promise<void>;
  runBenchmark: (providerId: string, config: ModelConfiguration, iterations: number) => Promise<void>;
  
  // Actions - General
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAIProviderStore = create<AIProviderState>()(
  immer((set, get) => ({
    // Initial State
    providers: [],
    selectedProviderId: null,
    isLoadingProviders: false,
    phaseAssignments: [],
    usageStats: [],
    analytics: null,
    isLoadingAnalytics: false,
    comparisons: [],
    benchmarks: [],
    isTestingProvider: false,
    error: null,
    
    // Provider Management Actions
    setProviders: (providers) => set({ providers }),
    
    addProvider: (provider) => set((state) => {
      state.providers.push(provider);
    }),
    
    updateProvider: (id, updates) => set((state) => {
      const index = state.providers.findIndex(p => p.id === id);
      if (index !== -1) {
        state.providers[index] = { ...state.providers[index], ...updates };
      }
    }),
    
    deleteProvider: (id) => set((state) => {
      state.providers = state.providers.filter(p => p.id !== id);
      if (state.selectedProviderId === id) {
        state.selectedProviderId = null;
      }
      // Remove from phase assignments
      state.phaseAssignments = state.phaseAssignments.filter(
        a => a.primaryProviderId !== id && !a.fallbackProviderIds.includes(id)
      );
    }),
    
    selectProvider: (id) => set({ selectedProviderId: id }),
    
    toggleProviderStatus: (id) => set((state) => {
      const provider = state.providers.find(p => p.id === id);
      if (provider) {
        provider.isEnabled = !provider.isEnabled;
        provider.status = provider.isEnabled ? 'active' : 'inactive';
      }
    }),
    
    testProviderConnection: async (id) => {
      set({ isTestingProvider: true, error: null });
      
      try {
        const response = await fetch(`/api/ai-providers/${id}/test`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Connection test failed');
        }
        
        const result = await response.json();
        
        set((state) => {
          const provider = state.providers.find(p => p.id === id);
          if (provider) {
            provider.testResult = result;
            provider.lastTestedAt = new Date();
            provider.status = result.success ? 'active' : 'error';
          }
        });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Test failed' });
      } finally {
        set({ isTestingProvider: false });
      }
    },
    
    // Phase Assignment Actions
    setPhaseAssignments: (assignments) => set({ phaseAssignments: assignments }),
    
    assignProviderToPhase: (assignment) => set((state) => {
      const index = state.phaseAssignments.findIndex(a => a.phaseId === assignment.phaseId);
      if (index !== -1) {
        state.phaseAssignments[index] = assignment;
      } else {
        state.phaseAssignments.push(assignment);
      }
    }),
    
    updatePhaseAssignment: (phaseId, updates) => set((state) => {
      const index = state.phaseAssignments.findIndex(a => a.phaseId === phaseId);
      if (index !== -1) {
        state.phaseAssignments[index] = { ...state.phaseAssignments[index], ...updates };
      }
    }),
    
    removePhaseAssignment: (phaseId) => set((state) => {
      state.phaseAssignments = state.phaseAssignments.filter(a => a.phaseId !== phaseId);
    }),
    
    // Analytics Actions
    setUsageStats: (stats) => set({ usageStats: stats }),
    
    setAnalytics: (analytics) => set({ analytics }),
    
    fetchAnalytics: async (period) => {
      set({ isLoadingAnalytics: true, error: null });
      
      try {
        const response = await fetch(`/api/ai-providers/analytics?period=${period}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const analytics = await response.json();
        set({ analytics });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to load analytics' });
      } finally {
        set({ isLoadingAnalytics: false });
      }
    },
    
    // Testing Actions
    addComparison: (comparison) => set((state) => {
      state.comparisons.unshift(comparison);
      // Keep only last 10 comparisons
      if (state.comparisons.length > 10) {
        state.comparisons = state.comparisons.slice(0, 10);
      }
    }),
    
    addBenchmark: (benchmark) => set((state) => {
      state.benchmarks.unshift(benchmark);
      // Keep only last 20 benchmarks
      if (state.benchmarks.length > 20) {
        state.benchmarks = state.benchmarks.slice(0, 20);
      }
    }),
    
    runProviderComparison: async (providerIds, prompt, config) => {
      set({ isTestingProvider: true, error: null });
      
      try {
        const response = await fetch('/api/ai-providers/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerIds, prompt, config }),
        });
        
        if (!response.ok) {
          throw new Error('Comparison failed');
        }
        
        const comparison = await response.json();
        get().addComparison(comparison);
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Comparison failed' });
      } finally {
        set({ isTestingProvider: false });
      }
    },
    
    runBenchmark: async (providerId, config, iterations) => {
      set({ isTestingProvider: true, error: null });
      
      try {
        const response = await fetch('/api/ai-providers/benchmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId, config, iterations }),
        });
        
        if (!response.ok) {
          throw new Error('Benchmark failed');
        }
        
        const benchmark = await response.json();
        get().addBenchmark(benchmark);
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Benchmark failed' });
      } finally {
        set({ isTestingProvider: false });
      }
    },
    
    // General Actions
    setError: (error) => set({ error }),
    
    clearError: () => set({ error: null }),
    
    reset: () => set({
      providers: [],
      selectedProviderId: null,
      isLoadingProviders: false,
      phaseAssignments: [],
      usageStats: [],
      analytics: null,
      isLoadingAnalytics: false,
      comparisons: [],
      benchmarks: [],
      isTestingProvider: false,
      error: null,
    }),
  }))
);
