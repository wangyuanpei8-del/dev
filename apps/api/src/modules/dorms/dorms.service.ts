import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, DormGenderType, Location, Prisma, RoomType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination.util';
import { occupiedOnDateWhere } from '../../common/occupancy-query.util';
import { todayDateOnly } from '../../common/date.util';
import { AuditService } from '../../common/services/audit.service';
import { mapDorm, mapRoom } from './dorms.mapper';

@Injectable()
export class DormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: Record<string, unknown>) {
    const where: Prisma.DormWhereInput = { deleted_at: null };
    if (query.location) where.location = query.location as Location;
    if (query.genderType) where.gender_type = query.genderType as DormGenderType;

    const rows = await this.prisma.dorm.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return paginate(rows.map(mapDorm), query.page, query.pageSize);
  }

  async getOne(id: string) {
    const dorm = await this.prisma.dorm.findFirst({
      where: { id, deleted_at: null },
    });
    if (!dorm) throw new NotFoundException({ code: 40400, message: '寮が見つかりません' });
    return mapDorm(dorm);
  }

  async create(body: Record<string, unknown>) {
    const created = await this.prisma.dorm.create({
      data: {
        code: String(body.code),
        name: String(body.name),
        address: String(body.address || ''),
        layout_type: String(body.layoutType || body.layout_type || '3DK'),
        gender_type: (body.genderType || body.gender_type) as DormGenderType,
        location: (body.location as Location) || null,
        responsible_employee_id:
          (body.responsibleEmployeeId || body.responsible_employee_id) as string | undefined,
      },
    });
    return mapDorm(created);
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.dorm.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '寮が見つかりません' });
    if (body.version != null && Number(body.version) !== existing.version) {
      throw new ConflictException({ code: 40910, message: '他のユーザーにより更新されています' });
    }
    const updated = await this.prisma.dorm.update({
      where: { id },
      data: {
        version: { increment: 1 },
        code: body.code != null ? String(body.code) : undefined,
        name: body.name != null ? String(body.name) : undefined,
        address: body.address != null ? String(body.address) : undefined,
        layout_type:
          body.layoutType != null
            ? String(body.layoutType)
            : body.layout_type != null
              ? String(body.layout_type)
              : undefined,
        gender_type: (body.genderType || body.gender_type) as DormGenderType | undefined,
        location: body.location !== undefined ? (body.location as Location | null) : undefined,
        responsible_employee_id:
          body.responsibleEmployeeId !== undefined
            ? (body.responsibleEmployeeId as string | null)
            : body.responsible_employee_id !== undefined
              ? (body.responsible_employee_id as string | null)
              : undefined,
      },
    });
    return mapDorm(updated);
  }

  async remove(id: string, userId?: string) {
    const existing = await this.prisma.dorm.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '寮が見つかりません' });
    const childRooms = await this.prisma.room.count({ where: { dorm_id: id, deleted_at: null } });
    if (childRooms > 0) {
      throw new ConflictException({
        code: 40900,
        message: '部屋が残っているため削除できません。先に部屋を削除してください',
      });
    }
    const activeOccupancy = await this.prisma.occupancyHistory.count({
      where: {
        ...occupiedOnDateWhere(todayDateOnly()),
        room: { dorm_id: id },
      },
    });
    if (activeOccupancy > 0) {
      throw new ConflictException({
        code: 40900,
        message: '在室中の履歴があるため削除できません',
      });
    }
    await this.prisma.dorm.update({
      where: { id },
      data: { deleted_at: new Date(), version: { increment: 1 } },
    });
    await this.audit.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'dorms',
      entityId: id,
      before: mapDorm(existing),
    });
    return { ok: true };
  }

  async listRooms(dormId: string, query: Record<string, unknown>) {
    const dorm = await this.prisma.dorm.findFirst({ where: { id: dormId, deleted_at: null } });
    if (!dorm) throw new NotFoundException({ code: 40400, message: '寮が見つかりません' });
    const rows = await this.prisma.room.findMany({
      where: { dorm_id: dormId, deleted_at: null },
      orderBy: { code: 'asc' },
    });
    return paginate(rows.map(mapRoom), query.page, query.pageSize);
  }

  async createRoom(dormId: string, body: Record<string, unknown>) {
    const dorm = await this.prisma.dorm.findFirst({ where: { id: dormId, deleted_at: null } });
    if (!dorm) throw new NotFoundException({ code: 40400, message: '寮が見つかりません' });
    const created = await this.prisma.room.create({
      data: {
        dorm_id: dormId,
        code: String(body.code),
        name: String(body.name),
        area_sqm: Number(body.areaSqm ?? body.area_sqm ?? 0),
        room_type: (body.roomType || body.room_type || RoomType.WESTERN) as RoomType,
      },
    });
    return mapRoom(created);
  }

  async updateRoom(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.room.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '部屋が見つかりません' });
    if (body.version != null && Number(body.version) !== existing.version) {
      throw new ConflictException({ code: 40910, message: '他のユーザーにより更新されています' });
    }
    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        version: { increment: 1 },
        code: body.code != null ? String(body.code) : undefined,
        name: body.name != null ? String(body.name) : undefined,
        area_sqm: body.areaSqm != null ? Number(body.areaSqm) : undefined,
        room_type: (body.roomType || body.room_type) as RoomType | undefined,
      },
    });
    return mapRoom(updated);
  }

  async removeRoom(id: string, userId?: string) {
    const existing = await this.prisma.room.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '部屋が見つかりません' });
    const activeOccupancy = await this.prisma.occupancyHistory.count({
      where: { room_id: id, ...occupiedOnDateWhere(todayDateOnly()) },
    });
    if (activeOccupancy > 0) {
      throw new ConflictException({
        code: 40900,
        message: '在室中の履歴があるため削除できません',
      });
    }
    await this.prisma.room.update({
      where: { id },
      data: { deleted_at: new Date(), version: { increment: 1 } },
    });
    await this.audit.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'rooms',
      entityId: id,
      before: mapRoom(existing),
    });
    return { ok: true };
  }
}
