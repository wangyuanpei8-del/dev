import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export type JwtPayload = {
  sub: string;
  role?: string;
  permissions?: string[];
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: JwtPayload }>();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 40100, message: '認証が必要です' });
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(authHeader.slice(7), {
        secret: process.env.JWT_SECRET,
      });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({ code: 40100, message: '認証が必要です' });
    }
  }
}
