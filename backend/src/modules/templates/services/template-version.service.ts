import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IVersionDiff, IMergeResult, ITemplateContent } from '../interfaces/template.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class TemplateVersionService {
  private readonly logger = new Logger(TemplateVersionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all versions of a template
   */
  async getVersions(templateId: string, branchName?: string) {
    const where: Prisma.TemplateVersionWhereInput = {
      templateId,
      ...(branchName && { branchName }),
    };

    return this.prisma.templateVersion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string) {
    const version = await this.prisma.templateVersion.findUnique({
      where: { id: versionId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    return version;
  }

  /**
   * Create a new branch
   */
  async createBranch(templateId: string, branchName: string, fromVersion: string, userId: string) {
    // Check if branch already exists
    const existing = await this.prisma.templateVersion.findFirst({
      where: {
        templateId,
        branchName,
      },
    });

    if (existing) {
      throw new BadRequestException(`Branch ${branchName} already exists`);
    }

    // Get the source version
    const sourceVersion = await this.prisma.templateVersion.findFirst({
      where: {
        templateId,
        version: fromVersion,
      },
    });

    if (!sourceVersion) {
      throw new NotFoundException(`Source version ${fromVersion} not found`);
    }

    // Create new branch version
    const newVersion = await this.prisma.templateVersion.create({
      data: {
        templateId,
        version: `${branchName}-1.0.0`,
        content: sourceVersion.content as Prisma.InputJsonValue,
        changeLog: `Created branch ${branchName} from version ${fromVersion}`,
        branchName,
        parentId: sourceVersion.id,
        createdBy: userId,
      },
    });

    return newVersion;
  }

  /**
   * Merge a branch into main
   */
  async mergeBranch(
    templateId: string,
    sourceBranch: string,
    targetBranch: string,
    userId: string,
  ): Promise<IMergeResult> {
    // Get latest versions from both branches
    const [sourceVersion, targetVersion] = await Promise.all([
      this.prisma.templateVersion.findFirst({
        where: { templateId, branchName: sourceBranch },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.templateVersion.findFirst({
        where: { templateId, branchName: targetBranch },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!sourceVersion || !targetVersion) {
      throw new NotFoundException('Branch not found');
    }

    // Perform three-way merge
    const mergeResult = this.performMerge(
      sourceVersion.content as unknown as ITemplateContent,
      targetVersion.content as unknown as ITemplateContent,
    );

    if (!mergeResult.success) {
      return mergeResult;
    }

    // Create merged version
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const [major, minor] = template.version.split('.').map(Number);
    const newVersion = `${major}.${minor + 1}.0`;

    await this.prisma.templateVersion.create({
      data: {
        templateId,
        version: newVersion,
        content: mergeResult.content as unknown as Prisma.InputJsonValue,
        changeLog: `Merged ${sourceBranch} into ${targetBranch}`,
        branchName: targetBranch,
        isMerged: true,
        mergedAt: new Date(),
        createdBy: userId,
      },
    });

    // Update template with merged content
    await this.prisma.template.update({
      where: { id: templateId },
      data: {
        content: mergeResult.content as unknown as Prisma.InputJsonValue,
        version: newVersion,
      },
    });

    // Mark source branch as merged
    await this.prisma.templateVersion.updateMany({
      where: {
        templateId,
        branchName: sourceBranch,
      },
      data: {
        isMerged: true,
        mergedAt: new Date(),
      },
    });

    return mergeResult;
  }

  /**
   * Rollback to a specific version
   */
  async rollback(templateId: string, versionId: string, userId: string, reason?: string) {
    const version = await this.getVersion(versionId);

    if (version.templateId !== templateId) {
      throw new BadRequestException('Version does not belong to this template');
    }

    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Create new version with rollback content
    const [major, minor, patch] = template.version.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;

    await this.prisma.templateVersion.create({
      data: {
        templateId,
        version: newVersion,
        content: version.content as Prisma.InputJsonValue,
        changeLog: reason || `Rolled back to version ${version.version}`,
        branchName: version.branchName || 'main',
        parentId: versionId,
        createdBy: userId,
      },
    });

    // Update template
    const updated = await this.prisma.template.update({
      where: { id: templateId },
      data: {
        content: version.content as Prisma.InputJsonValue,
        version: newVersion,
      },
    });

    this.logger.log(`Rolled back template ${templateId} to version ${version.version}`);

    return updated;
  }

  /**
   * Compare two versions and get diff
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<IVersionDiff> {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1),
      this.getVersion(versionId2),
    ]);

    const content1 = version1.content as unknown as ITemplateContent;
    const content2 = version2.content as unknown as ITemplateContent;

    return this.calculateDiff(content1, content2);
  }

  /**
   * Calculate diff between two template contents
   */
  private calculateDiff(content1: ITemplateContent, content2: ITemplateContent): IVersionDiff {
    const diff: IVersionDiff = {
      added: [],
      removed: [],
      modified: [],
    };

    // Compare sections
    const sections1Map = new Map(content1.sections.map((s) => [s.id, s]));
    const sections2Map = new Map(content2.sections.map((s) => [s.id, s]));

    // Find added sections
    for (const [id, section] of sections2Map) {
      if (!sections1Map.has(id)) {
        diff.added.push(`section:${id}:${section.title}`);
      }
    }

    // Find removed and modified sections
    for (const [id, section] of sections1Map) {
      if (!sections2Map.has(id)) {
        diff.removed.push(`section:${id}:${section.title}`);
      } else {
        const section2 = sections2Map.get(id)!;
        if (JSON.stringify(section) !== JSON.stringify(section2)) {
          diff.modified.push({
            path: `sections.${id}`,
            oldValue: section,
            newValue: section2,
          });
        }
      }
    }

    // Compare variables
    const vars1Map = new Map(content1.globalVariables.map((v) => [v.id, v]));
    const vars2Map = new Map(content2.globalVariables.map((v) => [v.id, v]));

    for (const [id, variable] of vars2Map) {
      if (!vars1Map.has(id)) {
        diff.added.push(`variable:${id}:${variable.name}`);
      }
    }

    for (const [id, variable] of vars1Map) {
      if (!vars2Map.has(id)) {
        diff.removed.push(`variable:${id}:${variable.name}`);
      } else {
        const variable2 = vars2Map.get(id)!;
        if (JSON.stringify(variable) !== JSON.stringify(variable2)) {
          diff.modified.push({
            path: `variables.${id}`,
            oldValue: variable,
            newValue: variable2,
          });
        }
      }
    }

    return diff;
  }

  /**
   * Perform three-way merge
   */
  private performMerge(source: ITemplateContent, target: ITemplateContent): IMergeResult {
    const conflicts: IMergeResult['conflicts'] = [];
    const merged: ITemplateContent = {
      sections: [...target.sections],
      globalVariables: [...target.globalVariables],
      metadata: {
        version: target.metadata?.version || '1.0.0',
        schemaVersion: target.metadata?.schemaVersion || '1.0.0',
        ...target.metadata,
      },
    };

    // Merge sections
    const targetSectionMap = new Map(target.sections.map((s) => [s.id, s]));

    for (const sourceSection of source.sections) {
      const targetSection = targetSectionMap.get(sourceSection.id);

      if (!targetSection) {
        // Section only in source - add it
        merged.sections.push(sourceSection);
      } else {
        // Section in both - check for conflicts
        if (JSON.stringify(sourceSection) !== JSON.stringify(targetSection)) {
          conflicts.push({
            path: `sections.${sourceSection.id}`,
            base: targetSection,
            ours: targetSection,
            theirs: sourceSection,
          });
        }
      }
    }

    // Merge variables
    const targetVarMap = new Map(target.globalVariables.map((v) => [v.id, v]));

    for (const sourceVar of source.globalVariables) {
      const targetVar = targetVarMap.get(sourceVar.id);

      if (!targetVar) {
        merged.globalVariables.push(sourceVar);
      } else {
        if (JSON.stringify(sourceVar) !== JSON.stringify(targetVar)) {
          conflicts.push({
            path: `variables.${sourceVar.id}`,
            base: targetVar,
            ours: targetVar,
            theirs: sourceVar,
          });
        }
      }
    }

    return {
      success: conflicts.length === 0,
      content: merged,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  /**
   * Get version history tree
   */
  async getVersionTree(templateId: string) {
    const versions = await this.prisma.templateVersion.findMany({
      where: { templateId },
      orderBy: { createdAt: 'asc' },
    });

    // Build tree structure
    const tree: Record<
      string,
      Array<{
        id: string;
        version: string;
        changeLog: string | null;
        createdAt: Date;
        isMerged: boolean;
        mergedAt: Date | null;
      }>
    > = {};

    for (const version of versions) {
      const branch = version.branchName || 'main';
      if (!tree[branch]) {
        tree[branch] = [];
      }
      tree[branch].push({
        id: version.id,
        version: version.version,
        changeLog: version.changeLog,
        createdAt: version.createdAt,
        isMerged: version.isMerged,
        mergedAt: version.mergedAt,
      });
    }

    return tree;
  }
}
