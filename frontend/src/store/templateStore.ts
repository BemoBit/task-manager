/**
 * Template Editor Store
 * Manages template state with undo/redo, auto-save, and conflict resolution
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { Template, Section, Variable, EditorState, HistoryState } from '@/types/template';

interface TemplateStore {
  // State
  history: HistoryState;
  editorState: EditorState;
  autoSaveEnabled: boolean;
  lastAutoSave: Date | null;
  
  // Template Actions
  setTemplate: (template: Template) => void;
  updateTemplate: (updater: (draft: Template) => void) => void;
  
  // Section Actions
  addSection: (section: Omit<Section, 'id' | 'order'>) => void;
  updateSection: (sectionId: string, updater: (draft: Section) => void) => void;
  deleteSection: (sectionId: string) => void;
  reorderSections: (sectionIds: string[]) => void;
  toggleSectionCollapse: (sectionId: string) => void;
  
  // Variable Actions
  addVariable: (variable: Omit<Variable, 'id'>) => void;
  updateVariable: (variableId: string, updater: (draft: Variable) => void) => void;
  deleteVariable: (variableId: string) => void;
  
  // Editor Actions
  setSelectedSection: (sectionId: string | null) => void;
  setSelectedElement: (elementId: string | null) => void;
  togglePreviewMode: () => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Auto-save Actions
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => Promise<void>;
  
  // Conflict Resolution
  resolveConflict: (serverTemplate: Template, resolution: 'local' | 'server' | 'merge') => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createEmptyTemplate = (): Template => ({
  id: generateId(),
  name: 'New Template',
  description: '',
  category: 'general',
  tags: [],
  sections: [],
  globalVariables: [],
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'current-user', // Will be replaced with actual user
  isPublic: false,
  permissions: [],
});

const addToHistory = (
  history: HistoryState,
  newPresent: Template
): HistoryState => {
  const newPast = [...history.past, history.present];
  // Limit history to last 50 states
  if (newPast.length > 50) {
    newPast.shift();
  }
  
  return {
    past: newPast,
    present: newPresent,
    future: [],
  };
};

export const useTemplateStore = create<TemplateStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      history: {
        past: [],
        present: createEmptyTemplate(),
        future: [],
      },
      editorState: {
        selectedSectionId: null,
        selectedElementId: null,
        isPreviewMode: false,
        isDirty: false,
        lastSaved: null,
      },
      autoSaveEnabled: true,
      lastAutoSave: null,

      // Template Actions
      setTemplate: (template) =>
        set((state) => ({
          history: {
            past: [],
            present: template,
            future: [],
          },
          editorState: {
            ...state.editorState,
            isDirty: false,
            lastSaved: new Date(),
          },
        })),

      updateTemplate: (updater) =>
        set((state) => {
          const newTemplate = produce(state.history.present, updater);
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      // Section Actions
      addSection: (section) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            const newSection: Section = {
              ...section,
              id: generateId(),
              order: draft.sections.length,
            };
            draft.sections.push(newSection);
            draft.updatedAt = new Date();
          });
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      updateSection: (sectionId, updater) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            const section = draft.sections.find((s) => s.id === sectionId);
            if (section) {
              updater(section);
              draft.updatedAt = new Date();
            }
          });
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      deleteSection: (sectionId) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            draft.sections = draft.sections.filter((s) => s.id !== sectionId);
            // Reorder remaining sections
            draft.sections.forEach((s, index) => {
              s.order = index;
            });
            draft.updatedAt = new Date();
          });
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
              selectedSectionId:
                state.editorState.selectedSectionId === sectionId
                  ? null
                  : state.editorState.selectedSectionId,
            },
          };
        }),

      reorderSections: (sectionIds) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            const sectionsMap = new Map(draft.sections.map((s) => [s.id, s]));
            draft.sections = sectionIds
              .map((id) => sectionsMap.get(id))
              .filter((s): s is Section => s !== undefined)
              .map((s, index) => ({ ...s, order: index }));
            draft.updatedAt = new Date();
          });
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      toggleSectionCollapse: (sectionId) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            const section = draft.sections.find((s) => s.id === sectionId);
            if (section) {
              section.isCollapsed = !section.isCollapsed;
            }
          });
          return {
            history: addToHistory(state.history, newTemplate),
          };
        }),

      // Variable Actions
      addVariable: (variable) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            const newVariable: Variable = {
              ...variable,
              id: generateId(),
            };
            draft.globalVariables.push(newVariable);
            draft.updatedAt = new Date();
          });
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      updateVariable: (variableId, updater) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            const variable = draft.globalVariables.find((v) => v.id === variableId);
            if (variable) {
              updater(variable);
              draft.updatedAt = new Date();
            }
          });
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      deleteVariable: (variableId) =>
        set((state) => {
          const newTemplate = produce(state.history.present, (draft) => {
            draft.globalVariables = draft.globalVariables.filter(
              (v) => v.id !== variableId
            );
            draft.updatedAt = new Date();
          });
          return {
            history: addToHistory(state.history, newTemplate),
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      // Editor Actions
      setSelectedSection: (sectionId) =>
        set((state) => ({
          editorState: {
            ...state.editorState,
            selectedSectionId: sectionId,
          },
        })),

      setSelectedElement: (elementId) =>
        set((state) => ({
          editorState: {
            ...state.editorState,
            selectedElementId: elementId,
          },
        })),

      togglePreviewMode: () =>
        set((state) => ({
          editorState: {
            ...state.editorState,
            isPreviewMode: !state.editorState.isPreviewMode,
          },
        })),

      // History Actions
      undo: () =>
        set((state) => {
          if (state.history.past.length === 0) return state;

          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          return {
            history: {
              past: newPast,
              present: previous,
              future: [state.history.present, ...state.history.future],
            },
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      redo: () =>
        set((state) => {
          if (state.history.future.length === 0) return state;

          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          return {
            history: {
              past: [...state.history.past, state.history.present],
              present: next,
              future: newFuture,
            },
            editorState: {
              ...state.editorState,
              isDirty: true,
            },
          };
        }),

      canUndo: () => get().history.past.length > 0,

      canRedo: () => get().history.future.length > 0,

      // Auto-save Actions
      enableAutoSave: () => set({ autoSaveEnabled: true }),

      disableAutoSave: () => set({ autoSaveEnabled: false }),

      triggerAutoSave: async () => {
        const state = get();
        if (!state.autoSaveEnabled || !state.editorState.isDirty) return;

        try {
          // TODO: Implement actual API call to save template
          console.log('Auto-saving template...', state.history.present);
          
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          set({
            editorState: {
              ...state.editorState,
              isDirty: false,
              lastSaved: new Date(),
            },
            lastAutoSave: new Date(),
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      },

      // Conflict Resolution
      resolveConflict: (serverTemplate, resolution) =>
        set((state) => {
          let resolvedTemplate: Template;

          switch (resolution) {
            case 'local':
              // Keep local changes
              resolvedTemplate = state.history.present;
              break;
            case 'server':
              // Accept server version
              resolvedTemplate = serverTemplate;
              break;
            case 'merge':
              // Simple merge: take server version but keep local sections that are newer
              resolvedTemplate = produce(serverTemplate, (draft) => {
                const localSections = state.history.present.sections;
                const serverSections = serverTemplate.sections;

                // Merge sections (simplified - can be more sophisticated)
                const mergedSections = [...serverSections];
                localSections.forEach((localSection) => {
                  const serverSection = serverSections.find(
                    (s) => s.id === localSection.id
                  );
                  if (!serverSection) {
                    mergedSections.push(localSection);
                  }
                });

                draft.sections = mergedSections;
              });
              break;
            default:
              resolvedTemplate = state.history.present;
          }

          return {
            history: {
              past: [],
              present: resolvedTemplate,
              future: [],
            },
            editorState: {
              ...state.editorState,
              isDirty: false,
              lastSaved: new Date(),
            },
          };
        }),
    }),
    { name: 'TemplateStore' }
  )
);

// Auto-save hook with debouncing
let autoSaveTimeout: NodeJS.Timeout | null = null;

export const setupAutoSave = (interval = 30000) => {
  const store = useTemplateStore.getState();

  const scheduleAutoSave = () => {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    autoSaveTimeout = setTimeout(async () => {
      await store.triggerAutoSave();
      scheduleAutoSave();
    }, interval);
  };

  scheduleAutoSave();

  return () => {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  };
};
