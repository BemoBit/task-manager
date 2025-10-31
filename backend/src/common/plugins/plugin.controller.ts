import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PluginManager } from './plugin.manager';
import { Plugin } from './plugin.interface';

@ApiTags('Plugins')
@Controller('plugins')
export class PluginController {
  constructor(private readonly pluginManager: PluginManager) {}

  @Get()
  @ApiOperation({ summary: 'Get all registered plugins' })
  getAllPlugins() {
    return this.pluginManager.getPlugins().map((plugin) => ({
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      author: plugin.metadata.author,
      description: plugin.metadata.description,
      hooks: plugin.metadata.hooks,
    }));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get plugin system statistics' })
  getStats() {
    return this.pluginManager.getStats();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get details of a specific plugin' })
  getPlugin(@Param('name') name: string) {
    const plugin = this.pluginManager.getPlugin(name);
    if (!plugin) {
      return { error: 'Plugin not found' };
    }

    return {
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      author: plugin.metadata.author,
      description: plugin.metadata.description,
      dependencies: plugin.metadata.dependencies,
      hooks: plugin.metadata.hooks,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Register a new plugin' })
  async registerPlugin(@Body() plugin: Plugin) {
    await this.pluginManager.registerPlugin(plugin);
    return { message: 'Plugin registered successfully' };
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Unregister a plugin' })
  async unregisterPlugin(@Param('name') name: string) {
    await this.pluginManager.unregisterPlugin(name);
    return { message: 'Plugin unregistered successfully' };
  }
}
