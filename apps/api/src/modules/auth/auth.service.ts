import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { permissionsForRole } from '../../common/permissions';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deleted_at: null, is_active: true },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 40100, message: 'メールアドレスまたはパスワードが正しくありません' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException({ code: 40100, message: 'メールアドレスまたはパスワードが正しくありません' });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const permissions = permissionsForRole(user.role);
    const payload = { sub: user.id, role: user.role, permissions };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type?: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });
      if (payload.type !== 'refresh') throw new Error('invalid');
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, deleted_at: null, is_active: true },
      });
      if (!user) throw new Error('no user');
      const permissions = permissionsForRole(user.role);
      const accessToken = await this.jwt.signAsync(
        { sub: user.id, role: user.role, permissions },
        { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
      );
      return {
        accessToken,
        refreshToken,
        expiresIn: 900,
      };
    } catch {
      throw new UnauthorizedException({ code: 40100, message: '認証が必要です' });
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null, is_active: true },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 40100, message: '認証が必要です' });
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      permissions: permissionsForRole(user.role),
    };
  }
}
