import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination.util';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: Record<string, unknown>) {
    const where: Prisma.DepartmentWhereInput = { deleted_at: null };
    const q = String(query.q || '').trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    const items = rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return paginate(items, query.page, query.pageSize);
  }

  async get(id: string) {
    const row = await this.prisma.department.findFirst({
      where: { id, deleted_at: null },
    });
    if (!row) throw new NotFoundException({ code: 40400, message: '所属が見つかりません' });
    return { id: row.id, code: row.code, name: row.name };
  }

  async create(body: Record<string, unknown>) {
    const name = String(body.name || '').trim();
    if (!name) {
      throw new ConflictException({ code: 40001, message: '所属名を入力してください' });
    }
    const existing = await this.prisma.department.findFirst({
      where: { name, deleted_at: null },
    });
    if (existing) {
      throw new ConflictException({ code: 40900, message: '同名の所属が既に存在します' });
    }
    const created = await this.prisma.department.create({
      data: {
        name,
        code: body.code ? String(body.code) : null,
      },
    });
    return { id: created.id, code: created.code, name: created.name };
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.department.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException({ code: 40400, message: '所属が見つかりません' });
    const name = body.name != null ? String(body.name).trim() : undefined;
    if (name) {
      const dup = await this.prisma.department.findFirst({
        where: { name, deleted_at: null, NOT: { id } },
      });
      if (dup) {
        throw new ConflictException({ code: 40900, message: '同名の所属が既に存在します' });
      }
    }
    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name,
        code: body.code !== undefined ? (body.code ? String(body.code) : null) : undefined,
      },
    });
    return { id: updated.id, code: updated.code, name: updated.name };
  }

  async remove(id: string, userId?: string) {
    const existing = await this.prisma.department.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException({ code: 40400, message: '所属が見つかりません' });
    const inUse = await this.prisma.employee.count({
      where: { department_id: id, deleted_at: null },
    });
    if (inUse > 0) {
      throw new ConflictException({
        code: 40900,
        message: '所属に紐づく社員がいるため削除できません',
      });
    }
    await this.prisma.department.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    await this.audit.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'departments',
      entityId: id,
      before: { id: existing.id, code: existing.code, name: existing.name },
    });
    return { ok: true };
  }
}
