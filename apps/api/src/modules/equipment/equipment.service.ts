import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination.util';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listItems(query: Record<string, unknown>) {
    const where: Prisma.EquipmentItemWhereInput = { deleted_at: null };
    const q = String(query.q || '').trim();
    if (q) where.name = { contains: q, mode: 'insensitive' };
    const rows = await this.prisma.equipmentItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? r.category ?? '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return paginate(items, query.page, query.pageSize);
  }

  async createItem(body: Record<string, unknown>) {
    const created = await this.prisma.equipmentItem.create({
      data: {
        name: String(body.name),
        description: body.description != null ? String(body.description) : undefined,
      },
    });
    return {
      id: created.id,
      name: created.name,
      description: created.description ?? '',
    };
  }

  async updateItem(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.equipmentItem.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '備品が見つかりません' });
    const updated = await this.prisma.equipmentItem.update({
      where: { id },
      data: {
        name: body.name != null ? String(body.name) : undefined,
        description: body.description != null ? String(body.description) : undefined,
      },
    });
    return { id: updated.id, name: updated.name, description: updated.description ?? '' };
  }

  async removeItem(id: string, userId?: string) {
    const existing = await this.prisma.equipmentItem.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '備品が見つかりません' });
    await this.prisma.equipmentItem.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    await this.audit.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'equipment_items',
      entityId: id,
      before: { id: existing.id, name: existing.name, description: existing.description ?? '' },
    });
    return { ok: true };
  }

  async listLocations(query: Record<string, unknown>) {
    const where: Prisma.StorageLocationWhereInput = { deleted_at: null };
    const q = String(query.q || '').trim();
    if (q) where.name = { contains: q, mode: 'insensitive' };
    const rows = await this.prisma.storageLocation.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return paginate(items, query.page, query.pageSize);
  }

  async createLocation(body: Record<string, unknown>) {
    const created = await this.prisma.storageLocation.create({
      data: {
        name: String(body.name),
        description: body.description != null ? String(body.description) : undefined,
        status: body.status != null ? String(body.status) : 'ACTIVE',
      },
    });
    return { id: created.id, name: created.name, description: created.description ?? '', status: created.status };
  }

  async updateLocation(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.storageLocation.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '保管場所が見つかりません' });
    const updated = await this.prisma.storageLocation.update({
      where: { id },
      data: {
        name: body.name != null ? String(body.name) : undefined,
        description: body.description != null ? String(body.description) : undefined,
        status: body.status != null ? String(body.status) : undefined,
      },
    });
    return { id: updated.id, name: updated.name, description: updated.description ?? '', status: updated.status };
  }

  async removeLocation(id: string, userId?: string) {
    const existing = await this.prisma.storageLocation.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '保管場所が見つかりません' });
    await this.prisma.storageLocation.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    await this.audit.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'storage_locations',
      entityId: id,
      before: {
        id: existing.id,
        name: existing.name,
        description: existing.description ?? '',
        status: existing.status,
      },
    });
    return { ok: true };
  }
}

