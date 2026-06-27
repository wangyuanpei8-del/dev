import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password) {
      throw new UnauthorizedException({ code: 40100, message: '認証が必要です' });
    }
    return this.auth.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: { refreshToken?: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException({ code: 40100, message: '認証が必要です' });
    }
    return this.auth.refresh(body.refreshToken);
  }

  @Get('me')
  me(@Req() req: { user?: JwtPayload }) {
    if (!req.user?.sub) {
      throw new UnauthorizedException({ code: 40100, message: '認証が必要です' });
    }
    return this.auth.me(req.user.sub);
  }
}
