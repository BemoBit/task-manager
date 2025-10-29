import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TemplateSharingService } from '../services/template-sharing.service';
import { REQUIRED_PERMISSION } from '../decorators/require-permission.decorator';

@Injectable()
export class TemplatePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sharingService: TemplateSharingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<'VIEW' | 'EDIT' | 'ADMIN'>(
      REQUIRED_PERMISSION,
      context.getHandler(),
    );

    if (!requiredPermission) {
      // No permission requirement, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const templateId = request.params.id;

    if (!user || !templateId) {
      throw new ForbiddenException('Authentication required');
    }

    const hasPermission = await this.sharingService.checkPermission(
      templateId,
      user.userId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have ${requiredPermission} permission for this template`,
      );
    }

    return true;
  }
}
