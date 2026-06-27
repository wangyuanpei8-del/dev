import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination.util';
import { parseDateOnly } from '../../common/date.util';

@Injectable()
export class AuditServiceApi {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, unknown>) {
    const where: Prisma.AuditLogWhereInput = {};

    const entityType = String(query.entityType || '').trim();
    if (entityType) where.entity_type = entityType;

    const fromDate = String(query.fromDate || query.from || '').trim();
    const toDate = String(query.toDate || query.to || '').trim();
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) (where.created_at as Prisma.DateTimeFilter).gte = parseDateOnly(fromDate);
      if (toDate) {
        const end = parseDateOnly(toDate);
        end.setDate(end.getDate() + 1);
        (where.created_at as Prisma.DateTimeFilter).lt = end;
      }
    }

    const rows = await this.prisma.auditLog.findMany({
      where,
      include: { user: true },
      orderBy: { created_at: 'desc' },
    });

    const items = rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      userId: r.user_id,
      userDisplayName: r.user?.display_name ?? null,
      beforeJson: r.before_json,
      afterJson: r.after_json,
      createdAt: r.created_at,
    }));

    return paginate(items, query.page, query.pageSize);
  }
}

