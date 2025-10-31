#!/usr/bin/env node

/**
 * Task Manager CLI Tool
 * Command-line interface for managing tasks, templates, and pipelines
 */

import { Command } from 'commander';
import axios, { AxiosInstance } from 'axios';
import * as chalk from 'chalk';
import * as Table from 'cli-table3';
import * as fs from 'fs';

class TaskManagerCLI {
  private api: AxiosInstance;
  private program: Command;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3001/api',
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
      },
    });

    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands() {
    this.program
      .name('task-cli')
      .description('Task Manager CLI Tool')
      .version('1.0.0');

    // Task commands
    const taskCmd = this.program.command('task').description('Manage tasks');

    taskCmd
      .command('list')
      .description('List all tasks')
      .option('-s, --status <status>', 'Filter by status')
      .option('-l, --limit <number>', 'Limit results', '10')
      .action(this.listTasks.bind(this));

    taskCmd
      .command('create <title>')
      .description('Create a new task')
      .option('-d, --description <desc>', 'Task description')
      .option('-p, --priority <number>', 'Priority (0-10)', '0')
      .action(this.createTask.bind(this));

    taskCmd
      .command('get <id>')
      .description('Get task details')
      .action(this.getTask.bind(this));

    taskCmd
      .command('delete <id>')
      .description('Delete a task')
      .action(this.deleteTask.bind(this));

    // Template commands
    const templateCmd = this.program.command('template').description('Manage templates');

    templateCmd
      .command('list')
      .description('List all templates')
      .action(this.listTemplates.bind(this));

    templateCmd
      .command('export <id>')
      .description('Export a template')
      .option('-f, --format <format>', 'Export format (json|yaml)', 'json')
      .option('-o, --output <file>', 'Output file')
      .action(this.exportTemplate.bind(this));

    // Pipeline commands
    const pipelineCmd = this.program.command('pipeline').description('Manage pipelines');

    pipelineCmd
      .command('execute <taskId>')
      .description('Execute pipeline for a task')
      .action(this.executePipeline.bind(this));

    // System commands
    const systemCmd = this.program.command('system').description('System management');

    systemCmd
      .command('health')
      .description('Check system health')
      .action(this.checkHealth.bind(this));

    systemCmd
      .command('stats')
      .description('Get system statistics')
      .action(this.getStats.bind(this));
  }

  // Task commands implementation
  private async listTasks(options: { status?: string; limit: string }) {
    try {
      const params: Record<string, string> = { limit: options.limit };
      if (options.status) params.status = options.status;

      const response = await this.api.get('/tasks', { params });
      const tasks = response.data.data || response.data;

      if (tasks.length === 0) {
        console.log(chalk.yellow('No tasks found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Title', 'Status', 'Priority', 'Created'],
        colWidths: [15, 30, 15, 10, 20],
      });

      tasks.forEach((task: Record<string, unknown>) => {
        table.push([
          String(task.id).substring(0, 12),
          String(task.title),
          String(task.status),
          String(task.priority),
          new Date(task.createdAt as string).toLocaleDateString(),
        ]);
      });

      console.log(table.toString());
      console.log(chalk.green(`\nTotal: ${tasks.length} tasks`));
    } catch (error) {
      this.handleError(error);
    }
  }

  private async createTask(
    title: string,
    options: { description?: string; priority: string }
  ) {
    try {
      const response = await this.api.post('/tasks', {
        title,
        description: options.description,
        priority: parseInt(options.priority, 10),
      });

      console.log(chalk.green('✓ Task created successfully'));
      console.log(`ID: ${response.data.id}`);
      console.log(`Title: ${response.data.title}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async getTask(id: string) {
    try {
      const response = await this.api.get(`/tasks/${id}`);
      const task = response.data;

      console.log(chalk.bold('\nTask Details:'));
      console.log(`ID: ${task.id}`);
      console.log(`Title: ${task.title}`);
      console.log(`Status: ${task.status}`);
      console.log(`Priority: ${task.priority}`);
      console.log(`Description: ${task.description || 'N/A'}`);
      console.log(`Created: ${new Date(task.createdAt).toLocaleString()}`);
      
      if (task.subtasks && task.subtasks.length > 0) {
        console.log(chalk.bold(`\nSubtasks (${task.subtasks.length}):`));
        task.subtasks.forEach((st: Record<string, unknown>, idx: number) => {
          console.log(`  ${idx + 1}. ${st.title} [${st.status}]`);
        });
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private async deleteTask(id: string) {
    try {
      await this.api.delete(`/tasks/${id}`);
      console.log(chalk.green('✓ Task deleted successfully'));
    } catch (error) {
      this.handleError(error);
    }
  }

  // Template commands implementation
  private async listTemplates() {
    try {
      const response = await this.api.get('/templates');
      const templates = response.data.data || response.data;

      if (templates.length === 0) {
        console.log(chalk.yellow('No templates found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Name', 'Type', 'Version', 'Active'],
        colWidths: [15, 25, 15, 10, 10],
      });

      templates.forEach((t: Record<string, unknown>) => {
        table.push([
          String(t.id).substring(0, 12),
          String(t.name),
          String(t.type),
          String(t.version),
          t.isActive ? '✓' : '✗',
        ]);
      });

      console.log(table.toString());
    } catch (error) {
      this.handleError(error);
    }
  }

  private async exportTemplate(
    id: string,
    options: { format: string; output?: string }
  ) {
    try {
      const response = await this.api.get(`/templates/${id}`);
      const template = response.data;

      let output: string;
      if (options.format === 'yaml') {
        const yaml = require('js-yaml');
        output = yaml.dump(template);
      } else {
        output = JSON.stringify(template, null, 2);
      }

      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(chalk.green(`✓ Template exported to ${options.output}`));
      } else {
        console.log(output);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Pipeline commands implementation
  private async executePipeline(taskId: string) {
    try {
      console.log(chalk.blue(`Starting pipeline execution for task ${taskId}...`));
      const response = await this.api.post(`/pipelines/execute`, { taskId });
      
      console.log(chalk.green('✓ Pipeline execution started'));
      console.log(`Pipeline ID: ${response.data.id}`);
      console.log(`Status: ${response.data.state}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // System commands implementation
  private async checkHealth() {
    try {
      const response = await this.api.get('/health');
      const health = response.data;

      console.log(chalk.bold('\nSystem Health:'));
      console.log(`Status: ${health.status === 'ok' ? chalk.green('✓ OK') : chalk.red('✗ ERROR')}`);
      
      if (health.details) {
        Object.entries(health.details).forEach(([key, value]) => {
          const status = (value as { status: string }).status;
          const icon = status === 'up' ? chalk.green('✓') : chalk.red('✗');
          console.log(`  ${icon} ${key}: ${status}`);
        });
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private async getStats() {
    try {
      const response = await this.api.get('/system/stats');
      const stats = response.data;

      console.log(chalk.bold('\nSystem Statistics:'));
      console.log(`Total Tasks: ${stats.tasks?.total || 'N/A'}`);
      console.log(`Active Tasks: ${stats.tasks?.active || 'N/A'}`);
      console.log(`Total Templates: ${stats.templates?.total || 'N/A'}`);
      console.log(`AI Requests (24h): ${stats.ai?.requests24h || 'N/A'}`);
      console.log(`Cache Hit Rate: ${stats.cache?.hitRate || 'N/A'}%`);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(chalk.red('✗ Error:'), error.response?.data?.message || error.message);
      if (error.response?.status === 401) {
        console.log(chalk.yellow('\nPlease set your API token: export API_TOKEN=your-token'));
      }
    } else {
      console.error(chalk.red('✗ Unexpected error:'), error);
    }
    process.exit(1);
  }

  run() {
    this.program.parse();
  }
}

// Run the CLI
const cli = new TaskManagerCLI();
cli.run();
