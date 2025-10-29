import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION = 'requiredPermission';

export const RequirePermission = (permission: 'VIEW' | 'EDIT' | 'ADMIN') =>
  SetMetadata(REQUIRED_PERMISSION, permission);
