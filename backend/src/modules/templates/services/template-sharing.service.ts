import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ShareTemplateDto } from '../dto/template-actions.dto';

@Injectable()
export class TemplateSharingService {
  private readonly logger = new Logger(TemplateSharingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Share template with a user
   */
  async shareTemplate(templateId: string, userId: string, dto: ShareTemplateDto) {
    // Verify template exists and user has admin permission
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only creator or admin can share
    if (template.createdBy !== userId) {
      const existingShare = await this.prisma.templateShare.findUnique({
        where: {
          templateId_userId: {
            templateId,
            userId,
          },
        },
      });

      if (!existingShare || existingShare.permission !== 'ADMIN') {
        throw new ForbiddenException('You do not have permission to share this template');
      }
    }

    // Check if user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Create or update share
    const share = await this.prisma.templateShare.upsert({
      where: {
        templateId_userId: {
          templateId,
          userId: dto.userId,
        },
      },
      create: {
        templateId,
        userId: dto.userId,
        permission: dto.permission,
        sharedBy: userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      update: {
        permission: dto.permission,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    this.logger.log(
      `Template ${templateId} shared with user ${dto.userId} with ${dto.permission} permission`,
    );

    return share;
  }

  /**
   * Revoke template access
   */
  async revokeAccess(templateId: string, userId: string, targetUserId: string) {
    // Verify permissions
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdBy !== userId) {
      const userShare = await this.prisma.templateShare.findUnique({
        where: {
          templateId_userId: {
            templateId,
            userId,
          },
        },
      });

      if (!userShare || userShare.permission !== 'ADMIN') {
        throw new ForbiddenException('You do not have permission to revoke access');
      }
    }

    // Delete share
    await this.prisma.templateShare.delete({
      where: {
        templateId_userId: {
          templateId,
          userId: targetUserId,
        },
      },
    });

    this.logger.log(`Access revoked for user ${targetUserId} on template ${templateId}`);

    return { message: 'Access revoked successfully' };
  }

  /**
   * Get all users with access to template
   */
  async getSharedUsers(templateId: string, userId: string) {
    // Verify user has access
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdBy !== userId && template.accessLevel !== 'PUBLIC') {
      const userShare = await this.prisma.templateShare.findUnique({
        where: {
          templateId_userId: {
            templateId,
            userId,
          },
        },
      });

      if (!userShare) {
        throw new ForbiddenException('You do not have access to this template');
      }
    }

    // Get all shares
    const shares = await this.prisma.templateShare.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user details separately
    const sharesWithUsers = await Promise.all(
      shares.map(async (share) => {
        const user = await this.prisma.user.findUnique({
          where: { id: share.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });
        return {
          ...share,
          user,
        };
      }),
    );

    return sharesWithUsers;
  }

  /**
   * Get templates shared with user
   */
  async getSharedTemplates(userId: string) {
    const shares = await this.prisma.templateShare.findMany({
      where: { userId },
      include: {
        template: {
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares.map((share) => ({
      ...share.template,
      permission: share.permission,
      sharedAt: share.createdAt,
      expiresAt: share.expiresAt,
    }));
  }

  /**
   * Update access level of template
   */
  async updateAccessLevel(
    templateId: string,
    userId: string,
    accessLevel: 'PRIVATE' | 'SHARED' | 'PUBLIC',
  ) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdBy !== userId) {
      throw new ForbiddenException('Only the creator can change access level');
    }

    const updated = await this.prisma.template.update({
      where: { id: templateId },
      data: { accessLevel },
    });

    this.logger.log(`Template ${templateId} access level changed to ${accessLevel}`);

    return updated;
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    templateId: string,
    userId: string,
    requiredPermission: 'VIEW' | 'EDIT' | 'ADMIN',
  ): Promise<boolean> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return false;
    }

    // Creator has all permissions
    if (template.createdBy === userId) {
      return true;
    }

    // Public templates can be viewed
    if (template.accessLevel === 'PUBLIC' && requiredPermission === 'VIEW') {
      return true;
    }

    // Check explicit permission
    const share = await this.prisma.templateShare.findUnique({
      where: {
        templateId_userId: {
          templateId,
          userId,
        },
      },
    });

    if (!share) {
      return false;
    }

    // Check if share has expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return false;
    }

    // Permission hierarchy: ADMIN > EDIT > VIEW
    const permissionLevels: Record<string, number> = {
      VIEW: 1,
      EDIT: 2,
      ADMIN: 3,
    };

    return permissionLevels[share.permission] >= permissionLevels[requiredPermission];
  }

  /**
   * Transfer ownership of template
   */
  async transferOwnership(templateId: string, currentOwnerId: string, newOwnerId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdBy !== currentOwnerId) {
      throw new ForbiddenException('Only the owner can transfer ownership');
    }

    // Check if new owner exists
    const newOwner = await this.prisma.user.findUnique({
      where: { id: newOwnerId },
    });

    if (!newOwner) {
      throw new NotFoundException('New owner not found');
    }

    // Transfer ownership
    const updated = await this.prisma.template.update({
      where: { id: templateId },
      data: { createdBy: newOwnerId },
    });

    // Remove any existing share for new owner
    await this.prisma.templateShare.deleteMany({
      where: {
        templateId,
        userId: newOwnerId,
      },
    });

    // Create ADMIN share for previous owner
    await this.prisma.templateShare.create({
      data: {
        templateId,
        userId: currentOwnerId,
        permission: 'ADMIN',
        sharedBy: newOwnerId,
      },
    });

    this.logger.log(`Template ${templateId} ownership transferred to ${newOwnerId}`);

    return updated;
  }
}
