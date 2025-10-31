import { Module, Global } from '@nestjs/common';
import { PluginManager } from './plugin.manager';

@Global()
@Module({
  providers: [PluginManager],
  exports: [PluginManager],
})
export class PluginModule {}
