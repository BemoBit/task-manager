/**
 * Plugin Architecture System
 * 
 * This module provides a comprehensive plugin system for extending the task manager
 * with custom functionality, phases, templates, and integrations.
 */

export interface PluginMetadata {
  name: string;
  version: string;
  author?: string;
  description?: string;
  dependencies?: string[];
  hooks?: string[];
}

export interface PluginContext {
  logger: {
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
  };
  config: Record<string, unknown>;
  services: {
    database?: unknown;
    cache?: unknown;
    ai?: unknown;
  };
}

export interface Plugin {
  metadata: PluginMetadata;
  initialize(context: PluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
  hooks?: Record<string, PluginHook>;
}

export type PluginHook = (data: unknown, context: PluginContext) => Promise<unknown> | unknown;

export interface HookRegistry {
  'task.before.create': PluginHook;
  'task.after.create': PluginHook;
  'task.before.update': PluginHook;
  'task.after.update': PluginHook;
  'task.before.delete': PluginHook;
  'task.after.delete': PluginHook;
  'template.before.render': PluginHook;
  'template.after.render': PluginHook;
  'pipeline.before.execute': PluginHook;
  'pipeline.after.execute': PluginHook;
  'phase.before.execute': PluginHook;
  'phase.after.execute': PluginHook;
  'ai.before.request': PluginHook;
  'ai.after.response': PluginHook;
}
