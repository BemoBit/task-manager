import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Plugin,
  PluginContext,
  PluginHook,
  HookRegistry,
} from './plugin.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PluginManager implements OnModuleInit {
  private readonly logger = new Logger(PluginManager.name);
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<keyof HookRegistry, PluginHook[]> = new Map();
  private context: PluginContext;

  constructor(private readonly configService: ConfigService) {
    this.context = {
      logger: {
        log: (message: string) => this.logger.log(message),
        error: (message: string) => this.logger.error(message),
        warn: (message: string) => this.logger.warn(message),
      },
      config: {},
      services: {},
    };
  }

  async onModuleInit() {
    await this.loadPlugins();
  }

  /**
   * Load all plugins from the plugins directory
   */
  private async loadPlugins() {
    const pluginsDir = path.join(process.cwd(), 'plugins');

    if (!fs.existsSync(pluginsDir)) {
      this.logger.warn(`Plugins directory not found: ${pluginsDir}`);
      return;
    }

    const pluginDirs = fs
      .readdirSync(pluginsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const pluginName of pluginDirs) {
      try {
        await this.loadPlugin(path.join(pluginsDir, pluginName));
      } catch (error) {
        this.logger.error(
          `Failed to load plugin ${pluginName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    this.logger.log(`Loaded ${this.plugins.size} plugins`);
  }

  /**
   * Load a single plugin from a directory
   */
  private async loadPlugin(pluginPath: string) {
    const indexPath = path.join(pluginPath, 'index.js');

    if (!fs.existsSync(indexPath)) {
      throw new Error(`Plugin index file not found: ${indexPath}`);
    }

    // Dynamic import of the plugin
    const pluginModule = await import(indexPath);
    const plugin: Plugin = pluginModule.default || pluginModule;

    if (!plugin.metadata || !plugin.metadata.name) {
      throw new Error('Plugin metadata is missing or invalid');
    }

    // Check dependencies
    if (plugin.metadata.dependencies) {
      for (const dep of plugin.metadata.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin dependency not found: ${dep}`);
        }
      }
    }

    // Initialize the plugin
    await plugin.initialize(this.context);

    // Register hooks
    if (plugin.hooks) {
      for (const [hookName, hookFunction] of Object.entries(plugin.hooks)) {
        this.registerHook(hookName as keyof HookRegistry, hookFunction);
      }
    }

    this.plugins.set(plugin.metadata.name, plugin);
    this.logger.log(
      `Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`,
    );
  }

  /**
   * Register a plugin dynamically
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.metadata.name)) {
      throw new Error(`Plugin already registered: ${plugin.metadata.name}`);
    }

    await plugin.initialize(this.context);

    if (plugin.hooks) {
      for (const [hookName, hookFunction] of Object.entries(plugin.hooks)) {
        this.registerHook(hookName as keyof HookRegistry, hookFunction);
      }
    }

    this.plugins.set(plugin.metadata.name, plugin);
    this.logger.log(
      `Registered plugin: ${plugin.metadata.name} v${plugin.metadata.version}`,
    );
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    if (plugin.destroy) {
      await plugin.destroy();
    }

    // Remove hooks
    if (plugin.hooks) {
      for (const hookName of Object.keys(plugin.hooks)) {
        this.removeHook(hookName as keyof HookRegistry, pluginName);
      }
    }

    this.plugins.delete(pluginName);
    this.logger.log(`Unregistered plugin: ${pluginName}`);
  }

  /**
   * Register a hook function
   */
  registerHook(hookName: keyof HookRegistry, hookFunction: PluginHook): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName)!.push(hookFunction);
    this.logger.debug(`Registered hook: ${hookName}`);
  }

  /**
   * Remove hooks for a specific plugin
   */
  private removeHook(hookName: keyof HookRegistry, pluginName: string): void {
    const hooks = this.hooks.get(hookName);
    if (hooks) {
      // Note: This is simplified. In production, track which plugin owns which hook
      this.hooks.set(hookName, []);
    }
  }

  /**
   * Execute all hooks for a given hook point
   */
  async executeHooks<T>(
    hookName: keyof HookRegistry,
    data: T,
  ): Promise<T> {
    const hooks = this.hooks.get(hookName) || [];

    let result = data;
    for (const hook of hooks) {
      try {
        result = (await hook(result, this.context)) as T;
      } catch (error) {
        this.logger.error(
          `Error executing hook ${hookName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return result;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get statistics about loaded plugins
   */
  getStats(): {
    total: number;
    hooks: number;
    plugins: Array<{ name: string; version: string; hooks: number }>;
  } {
    return {
      total: this.plugins.size,
      hooks: this.hooks.size,
      plugins: Array.from(this.plugins.values()).map((plugin) => ({
        name: plugin.metadata.name,
        version: plugin.metadata.version,
        hooks: plugin.hooks ? Object.keys(plugin.hooks).length : 0,
      })),
    };
  }
}
