import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    before?: object;
    after?: object;
  }) {
    await this.prisma.auditLog.create({
      data: {
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        before_json: params.before as Prisma.InputJsonValue | undefined,
        after_json: params.after as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
