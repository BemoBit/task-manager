import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { QueryTemplatesDto } from '../dto/query-templates.dto';
import { ForkTemplateDto, RateTemplateDto } from '../dto/template-actions.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new template
   */
  async create(userId: string, dto: CreateTemplateDto) {
    this.logger.log(`Creating template: ${dto.name} for user: ${userId}`);

    const template = await this.prisma.template.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        content: dto.content as unknown as Prisma.InputJsonValue,
        accessLevel: dto.accessLevel || 'PRIVATE',
        category: dto.category,
        tags: dto.tags || [],
        creator: {
          connect: { id: userId },
        },
        version: '1.0.0',
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create initial version
    await this.prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: '1.0.0',
        content: template.content,
        changeLog: 'Initial version',
        branchName: 'main',
        createdBy: userId,
      },
    });

    // Track analytics
    await this.trackEvent(template.id, 'create', userId);

    return template;
  }

  /**
   * Find all templates with pagination and filtering
   */
  async findAll(userId: string, query: QueryTemplatesDto) {
    const {
      page = 1,
      limit = 20,
      category,
      tags,
      search,
      type,
      accessLevel,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = 'false',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TemplateWhereInput = {
      isDeleted: includeDeleted === 'true' ? undefined : false,
      OR: [
        { createdBy: userId },
        { accessLevel: 'PUBLIC' },
        {
          shares: {
            some: {
              userId: userId,
            },
          },
        },
      ],
    };

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type as any;
    }

    if (accessLevel) {
      where.accessLevel = accessLevel as any;
    }

    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      where.tags = {
        hasSome: tagArray,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              versions: true,
              shares: true,
              forks: true,
            },
          },
        },
      }),
      this.prisma.template.count({ where }),
    ]);

    return {
      data: templates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single template by ID
   */
  async findOne(templateId: string, userId: string, version?: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        shares: {
          where: { userId },
        },
        _count: {
          select: {
            versions: true,
            shares: true,
            forks: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Check access permissions
    await this.checkAccess(template, userId);

    // Track view event
    await this.trackEvent(templateId, 'view', userId);

    // If specific version requested, return that version's content
    if (version) {
      const versionData = await this.prisma.templateVersion.findFirst({
        where: {
          templateId,
          version,
        },
      });

      if (versionData) {
        template.content = versionData.content as any;
      }
    }

    return template;
  }

  /**
   * Update a template
   */
  async update(templateId: string, userId: string, dto: UpdateTemplateDto) {
    const template = await this.findOne(templateId, userId);

    // Check if user has edit permission
    if (template.createdBy !== userId) {
      const share = await this.prisma.templateShare.findFirst({
        where: {
          templateId,
          userId,
          permission: { in: ['EDIT', 'ADMIN'] },
        },
      });

      if (!share) {
        throw new ForbiddenException('You do not have permission to edit this template');
      }
    }

    // Increment version
    const [major, minor, patch] = template.version.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;

    const updated = await this.prisma.template.update({
      where: { id: templateId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.content && { content: dto.content as Prisma.InputJsonValue }),
        ...(dto.accessLevel && { accessLevel: dto.accessLevel }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags && { tags: dto.tags }),
        version: newVersion,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create new version record
    if (dto.content) {
      await this.prisma.templateVersion.create({
        data: {
          templateId,
          version: newVersion,
          content: dto.content as Prisma.InputJsonValue,
          changeLog: 'Template updated',
          branchName: 'main',
          createdBy: userId,
        },
      });
    }

    await this.trackEvent(templateId, 'update', userId);

    return updated;
  }

  /**
   * Soft delete a template
   */
  async remove(templateId: string, userId: string) {
    const template = await this.findOne(templateId, userId);

    if (template.createdBy !== userId) {
      throw new ForbiddenException('Only the creator can delete this template');
    }

    await this.prisma.template.update({
      where: { id: templateId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await this.trackEvent(templateId, 'delete', userId);

    return { message: 'Template deleted successfully' };
  }

  /**
   * Fork a template
   */
  async fork(templateId: string, userId: string, dto: ForkTemplateDto) {
    const original = await this.findOne(templateId, userId);

    const forked = await this.prisma.template.create({
      data: {
        name: dto.name,
        description: dto.description || `Fork of ${original.name}`,
        type: original.type,
        content: original.content,
        accessLevel: 'PRIVATE',
        category: original.category,
        tags: original.tags,
        createdBy: userId,
        forkedFrom: templateId,
        version: '1.0.0',
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create initial version for fork
    await this.prisma.templateVersion.create({
      data: {
        templateId: forked.id,
        version: '1.0.0',
        content: original.content,
        changeLog: `Forked from ${original.name}`,
        branchName: 'main',
        createdBy: userId,
      },
    });

    // Increment fork count on original
    await this.prisma.template.update({
      where: { id: templateId },
      data: {
        forkCount: { increment: 1 },
      },
    });

    await this.trackEvent(templateId, 'fork', userId);
    await this.trackEvent(forked.id, 'create', userId);

    return forked;
  }

  /**
   * Rate a template
   */
  async rate(templateId: string, userId: string, dto: RateTemplateDto) {
    const template = await this.findOne(templateId, userId);

    // Calculate new rating
    const currentTotal = (template.rating || 0) * template.ratingCount;
    const newRatingCount = template.ratingCount + 1;
    const newRating = (currentTotal + dto.rating) / newRatingCount;

    await this.prisma.template.update({
      where: { id: templateId },
      data: {
        rating: newRating,
        ratingCount: newRatingCount,
      },
    });

    await this.trackEvent(templateId, 'rate', userId, {
      rating: dto.rating,
      comment: dto.comment,
    });

    return {
      averageRating: newRating,
      totalRatings: newRatingCount,
    };
  }

  /**
   * Get template statistics
   */
  async getStats(templateId: string, userId: string) {
    const template = await this.findOne(templateId, userId);

    const analytics = await this.prisma.templateAnalytics.groupBy({
      by: ['event'],
      where: { templateId },
      _count: true,
    });

    const stats = analytics.reduce(
      (acc, item) => {
        acc[item.event] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      ...stats,
      forks: template.forkCount,
      rating: template.rating,
      ratingCount: template.ratingCount,
      shares: template._count?.shares || 0,
      versions: template._count?.versions || 0,
    };
  }

  /**
   * Check if user has access to template
   */
  private async checkAccess(template: any, userId: string) {
    if (template.isDeleted) {
      throw new NotFoundException('Template has been deleted');
    }

    // Creator always has access
    if (template.createdBy === userId) {
      return;
    }

    // Public templates are accessible
    if (template.accessLevel === 'PUBLIC') {
      return;
    }

    // Check if user has explicit share permission
    const share = await this.prisma.templateShare.findFirst({
      where: {
        templateId: template.id,
        userId,
      },
    });

    if (!share) {
      throw new ForbiddenException('You do not have access to this template');
    }

    // Check if share has expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new ForbiddenException('Your access to this template has expired');
    }
  }

  /**
   * Track analytics event
   */
  private async trackEvent(
    templateId: string,
    event: string,
    userId?: string,
    metadata?: any,
  ) {
    try {
      await this.prisma.templateAnalytics.create({
        data: {
          templateId,
          event,
          userId,
          metadata: metadata as Prisma.InputJsonValue,
        },
      });

      // Increment usage count for certain events
      if (event === 'use' || event === 'render') {
        await this.prisma.template.update({
          where: { id: templateId },
          data: {
            usageCount: { increment: 1 },
          },
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to track event: ${error}`);
    }
  }
}
