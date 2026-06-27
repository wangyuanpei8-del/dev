import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination.util';
import { AuditService } from '../../common/services/audit.service';

function mapUser(u: {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    role: u.role,
    isActive: u.is_active,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: Record<string, unknown>) {
    const where: Prisma.UserWhereInput = { deleted_at: null };
    if (query.role) where.role = query.role as UserRole;
    if (query.isActive !== undefined && query.isActive !== '') {
      const v = query.isActive;
      where.is_active = v === true || v === 'true';
    }

    const rows = await this.prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    return paginate(rows.map(mapUser), query.page, query.pageSize);
  }

  async create(body: Record<string, unknown>, userId?: string) {
    const email = String(body.email || '').trim().toLowerCase();
    const displayName = String(body.displayName || body.display_name || '').trim();
    const password = String(body.password || '');
    const role = (body.role as UserRole) || UserRole.VIEWER;

    if (!email || !displayName || !password) {
      throw new ConflictException({ code: 40001, message: '入力内容を確認してください' });
    }

    const existing = await this.prisma.user.findFirst({
      where: { email, deleted_at: null },
    });
    if (existing) {
      throw new ConflictException({ code: 40900, message: '既に存在するメールアドレスです' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await this.prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        display_name: displayName,
        role,
        is_active: true,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'users',
      entityId: created.id,
      after: mapUser(created),
    });

    return mapUser(created);
  }

  async update(id: string, body: Record<string, unknown>, userId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException({ code: 40400, message: 'ユーザーが見つかりません' });
    }

    const password = body.password != null ? String(body.password) : '';
    const next: Prisma.UserUpdateInput = {
      display_name: body.displayName != null ? String(body.displayName) : undefined,
      role: (body.role as UserRole) || undefined,
      is_active:
        body.isActive !== undefined
          ? Boolean(body.isActive)
          : body.is_active !== undefined
            ? Boolean(body.is_active)
            : undefined,
    };
    if (password) {
      next.password_hash = await bcrypt.hash(password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: next,
    });

    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'users',
      entityId: id,
      before: mapUser(existing),
      after: mapUser(updated),
    });

    return mapUser(updated);
  }
}
