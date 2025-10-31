import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TaskStatus } from '@prisma/client';

export interface CreateSimpleTaskDto {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in-progress' | 'completed' | 'failed';
  tags?: string[];
  assignedTo?: string;
}

@Injectable()
export class SimpleTaskService {
  private readonly logger = new Logger(SimpleTaskService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSimpleTask(userId: string, dto: CreateSimpleTaskDto) {
    this.logger.log(`Creating simple task: ${dto.title} for user: ${userId}`);

    // Priority mapping
    const priorityMap = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    };

    // Status mapping
    const statusMap = {
      'pending': TaskStatus.PENDING,
      'in-progress': TaskStatus.IN_PROGRESS,
      'completed': TaskStatus.COMPLETED,
      'failed': TaskStatus.FAILED,
    };

    // Find or create a default phase for standalone tasks
    let defaultPhase = await this.prisma.phase.findFirst({
      where: {
        name: 'Standalone Tasks',
      },
    });

    if (!defaultPhase) {
      // Get the default template
      const defaultTemplate = await this.prisma.template.findFirst({
        where: {
          type: 'DECOMPOSITION',
          accessLevel: 'PUBLIC',
        },
      });

      if (!defaultTemplate) {
        throw new Error('No default template found. Please run database seeding.');
      }

      // Get default AI provider
      const defaultAIProvider = await this.prisma.aIProvider.findFirst({
        where: { isActive: true },
      });

      if (!defaultAIProvider) {
        throw new Error('No active AI provider found. Please run database seeding.');
      }

      // Create default phase
      defaultPhase = await this.prisma.phase.create({
        data: {
          name: 'Standalone Tasks',
          description: 'Default phase for standalone task creation',
          order: 0,
          template: {
            connect: { id: defaultTemplate.id },
          },
          aiProvider: {
            connect: { id: defaultAIProvider.id },
          },
          config: {},
        },
      });
    }

    // Ensure user exists
    let validUserId = userId;
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      this.logger.warn(`User ${userId} not found, using admin user`);
      const adminUser = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
      if (adminUser) {
        validUserId = adminUser.id;
      }
    }

    // Create the task
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        status: dto.status ? statusMap[dto.status] : TaskStatus.PENDING,
        priority: dto.priority ? priorityMap[dto.priority] : 2,
        phaseId: defaultPhase.id,
        assignedTo: dto.assignedTo || validUserId,
        inputData: {
          tags: dto.tags || [],
          createdVia: 'simple-api',
        },
      },
      include: {
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Task created successfully: ${task.id}`);
    return task;
  }

  async getAllTasks(userId: string) {
    this.logger.log(`Fetching all tasks for user: ${userId}`);

    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { assignedTo: userId },
          {
            phase: {
              template: {
                accessLevel: 'PUBLIC',
              },
            },
          },
        ],
      },
      include: {
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks;
  }

  async getTaskById(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        phase: true,
        assignee: true,
        subtasks: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return task;
  }

  async updateTask(taskId: string, updates: Partial<CreateSimpleTaskDto>) {
    const task = await this.getTaskById(taskId);

    const statusMap = {
      'PENDING': TaskStatus.PENDING,
      'IN_PROGRESS': TaskStatus.IN_PROGRESS,
      'COMPLETED': TaskStatus.COMPLETED,
      'FAILED': TaskStatus.FAILED,
      // Also support lowercase for backwards compatibility
      'pending': TaskStatus.PENDING,
      'in-progress': TaskStatus.IN_PROGRESS,
      'completed': TaskStatus.COMPLETED,
      'failed': TaskStatus.FAILED,
    };

    const priorityMap = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      // Also support string values
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    };

    const updateData: any = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status) {
      const mappedStatus = statusMap[updates.status];
      if (mappedStatus) updateData.status = mappedStatus;
    }
    if (updates.priority) {
      const mappedPriority = priorityMap[updates.priority];
      if (mappedPriority) updateData.priority = mappedPriority;
    }

    console.log('Updating task:', { taskId, updates, updateData });

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        phase: true,
        assignee: true,
        subtasks: true,
      },
    });
  }

  async deleteTask(taskId: string) {
    await this.getTaskById(taskId); // Check if exists
    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }
}
