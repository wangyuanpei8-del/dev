import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { JwtPayload } from './jwt-auth.guard';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const userPerms = req.user?.permissions ?? [];
    if (userPerms.includes('*')) return true;
    if (required.some((p) => userPerms.includes(p))) return true;

    throw new ForbiddenException({ code: 40300, message: 'この操作を行う権限がありません' });
  }
}
