import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SimpleTaskService, CreateSimpleTaskDto } from '../services/simple-task.service';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * Simple Task Controller
 * Provides straightforward CRUD operations for tasks without complex pipeline logic
 */
@ApiTags('Simple Tasks')
@Public()
@Controller('tasks')
// Auth temporarily disabled for development
// @UseGuards(JwtAuthGuard)
export class SimpleTaskController {
  constructor(private readonly simpleTaskService: SimpleTaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new simple task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(@Body() dto: CreateSimpleTaskDto) {
    // For development, use a default user ID
    const userId = 'dev-user-id';
    return this.simpleTaskService.createSimpleTask(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async getAllTasks() {
    // For development, use a default user ID
    const userId = 'dev-user-id';
    return this.simpleTaskService.getAllTasks(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(@Param('id') id: string) {
    return this.simpleTaskService.getTaskById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTask(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSimpleTaskDto>,
  ) {
    return this.simpleTaskService.updateTask(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteTask(@Param('id') id: string) {
    await this.simpleTaskService.deleteTask(id);
    return null;
  }
}
