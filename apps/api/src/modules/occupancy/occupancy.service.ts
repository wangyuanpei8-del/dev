import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, DormGenderType, EmployeeType, Gender, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { paginate } from '../../common/pagination.util';
import {
  intervalsOverlap,
  isOccupiedOnDay,
  parseDateOnly,
  todayDateOnly,
  calendarDaysBetween,
} from '../../common/date.util';
import { countRoomsByStatus, resolveRoomStatus } from '../../common/room-status.util';
import { buildOccupancyListWhere, openEndedWhere } from '../../common/occupancy-query.util';
import { formatDateField } from '../../common/mapper.util';

@Injectable()
export class OccupancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(id: string) {
    const row = await this.prisma.occupancyHistory.findFirst({
      where: { id, deleted_at: null },
      include: {
        employee: { include: { department: true } },
        room: { include: { dorm: true } },
      },
    });
    if (!row) throw new NotFoundException({ code: 40400, message: '履歴が見つかりません' });
    return this.mapHistory(row);
  }

  async update(id: string, body: Record<string, unknown>, userId?: string) {
    const existing = await this.prisma.occupancyHistory.findFirst({
      where: { id, deleted_at: null },
      include: {
        employee: { include: { department: true } },
        room: { include: { dorm: true } },
      },
    });
    if (!existing) throw new NotFoundException({ code: 40400, message: '履歴が見つかりません' });
    if (existing.move_out_date) {
      throw new ConflictException({ code: 40900, message: '退寮済みの履歴は更新できません' });
    }
    if (body.version != null && Number(body.version) !== existing.version) {
      throw new ConflictException({ code: 40910, message: '他のユーザーにより更新されています' });
    }
    if (body.moveOutDate !== undefined || body.move_out_date !== undefined) {
      throw new ConflictException({
        code: 40001,
        message: '退寮日の変更は退寮登録を使用してください',
      });
    }

    const moveInDate = body.moveInDate || body.move_in_date
      ? parseDateOnly(String(body.moveInDate || body.move_in_date))
      : existing.move_in_date;
    const moveOutDate: Date | null = null;

    await this.validateNoOverlap(existing.room_id, moveInDate, moveOutDate, id);
    await this.validateEmployeeNoOverlap(existing.employee_id, moveInDate, moveOutDate, id);

    const updated = await this.prisma.occupancyHistory.update({
      where: { id },
      data: {
        move_in_date: moveInDate,
        move_out_date: moveOutDate,
        move_out_reason:
          body.moveOutReason !== undefined || body.move_out_reason !== undefined || body.note !== undefined
            ? ((body.moveOutReason || body.move_out_reason || body.note) as string | undefined)
            : undefined,
        version: { increment: 1 },
      },
      include: {
        employee: { include: { department: true } },
        room: { include: { dorm: true } },
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'occupancy_histories',
      entityId: id,
      before: this.mapHistory(existing),
      after: this.mapHistory(updated),
    });
    return this.mapHistory(updated);
  }

  async list(query: Record<string, unknown>) {
    const where = buildOccupancyListWhere(query);

    const rows = await this.prisma.occupancyHistory.findMany({
      where,
      include: {
        employee: { include: { department: true } },
        room: { include: { dorm: true } },
      },
      orderBy: { move_in_date: 'desc' },
    });
    const mapped = rows.map((h) => this.mapHistory(h));
    return paginate(mapped, query.page, query.pageSize);
  }

  private mapHistory(h: {
    id: string;
    version: number;
    employee_id: string;
    room_id: string;
    move_in_date: Date;
    move_out_date: Date | null;
    move_out_reason: string | null;
    employee: { full_name: string; deleted_at: Date | null; department?: { name: string } | null };
    room: { name: string; dorm: { name: string } };
  }) {
    return {
      id: h.id,
      version: h.version,
      employeeId: h.employee_id,
      roomId: h.room_id,
      employeeName: h.employee.full_name,
      department: h.employee.department?.name ?? null,
      dormName: h.room.dorm.name,
      roomName: h.room.name,
      moveInDate: formatDateField(h.move_in_date),
      moveOutDate: formatDateField(h.move_out_date),
      moveOutReason: h.move_out_reason,
      employeeDeleted: h.employee.deleted_at != null,
    };
  }

  async validateNoOverlap(
    roomId: string,
    start: Date,
    end: Date | null,
    excludeId?: string,
  ) {
    const histories = await this.prisma.occupancyHistory.findMany({
      where: { room_id: roomId, deleted_at: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    for (const h of histories) {
      if (intervalsOverlap(start, end, h.move_in_date, h.move_out_date)) {
        throw new ConflictException({
          code: 40901,
          message: '該当部屋は指定期間内に既に入居者が存在します',
        });
      }
    }
  }

  async validateEmployeeNoOverlap(
    employeeId: string,
    start: Date,
    end: Date | null,
    excludeId?: string,
  ) {
    const histories = await this.prisma.occupancyHistory.findMany({
      where: {
        employee_id: employeeId,
        deleted_at: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    for (const h of histories) {
      if (intervalsOverlap(start, end, h.move_in_date, h.move_out_date)) {
        throw new ConflictException({
          code: 40905,
          message: '該当社員は指定期間内に既に入居中です',
        });
      }
    }
  }

  async validateGenderMatch(employeeId: string, roomId: string) {
    const employee = await this.prisma.employee.findFirstOrThrow({
      where: { id: employeeId, deleted_at: null },
    });
    const room = await this.prisma.room.findFirstOrThrow({
      where: { id: roomId, deleted_at: null, dorm: { deleted_at: null } },
      include: { dorm: true },
    });
    const expected = employee.gender === Gender.MALE ? DormGenderType.MALE_DORM : DormGenderType.FEMALE_DORM;
    if (room.dorm.gender_type !== expected) {
      throw new ConflictException({
        code: 40902,
        message: '社員の性別と寮の種別が一致しません',
      });
    }
  }

  async applyFirstDormUseDate(employeeId: string, moveInDate: Date, tx: Prisma.TransactionClient) {
    const emp = await tx.employee.findFirstOrThrow({ where: { id: employeeId } });
    if (emp.employee_type !== EmployeeType.JAPAN) return;
    if (emp.first_dorm_use_date != null) return;
    await tx.employee.update({
      where: { id: employeeId },
      data: { first_dorm_use_date: moveInDate },
    });
  }

  async create(body: Record<string, unknown>, userId?: string) {
    const employeeId = String(body.employeeId || body.employee_id);
    const roomId = String(body.roomId || body.room_id);
    const moveInDate = parseDateOnly(String(body.moveInDate || body.move_in_date));
    const moveOutRaw = body.moveOutDate || body.move_out_date;
    const moveOutDate = moveOutRaw ? parseDateOnly(String(moveOutRaw)) : null;
    if (moveOutDate && moveInDate > moveOutDate) {
      throw new ConflictException({ code: 40001, message: '入寮日は退寮日以前である必要があります' });
    }

    await this.validateGenderMatch(employeeId, roomId);
    await this.validateNoOverlap(roomId, moveInDate, moveOutDate);
    await this.validateEmployeeNoOverlap(employeeId, moveInDate, moveOutDate);

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.occupancyHistory.create({
        data: {
          employee_id: employeeId,
          room_id: roomId,
          move_in_date: moveInDate,
          move_out_date: moveOutDate,
          move_out_reason: (body.moveOutReason || body.move_out_reason) as string | undefined,
        },
        include: {
          employee: { include: { department: true } },
          room: { include: { dorm: true } },
        },
      });
      await this.applyFirstDormUseDate(employeeId, moveInDate, tx);
      return row;
    });

    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'occupancy_histories',
      entityId: created.id,
      after: this.mapHistory(created),
    });

    return {
      ...this.mapHistory(created),
      employee: {
        fullName: created.employee.full_name,
        firstDormUseDate: formatDateField(created.employee.first_dorm_use_date),
      },
    };
  }

  async moveOut(id: string, body: Record<string, unknown>, userId?: string) {
    const existing = await this.prisma.occupancyHistory.findFirst({
      where: { id, deleted_at: null },
      include: {
        employee: { include: { department: true } },
        room: { include: { dorm: true } },
      },
    });
    if (!existing) throw new NotFoundException({ code: 40400, message: '履歴が見つかりません' });
    if (existing.move_out_date) {
      throw new ConflictException({ code: 40900, message: '既に退寮済みです' });
    }
    if (body.version != null && Number(body.version) !== existing.version) {
      throw new ConflictException({ code: 40910, message: '他のユーザーにより更新されています' });
    }
    const moveOutDate = parseDateOnly(String(body.moveOutDate || body.move_out_date));
    if (moveOutDate < existing.move_in_date) {
      throw new ConflictException({ code: 40001, message: '退寮日は入寮日以降である必要があります' });
    }

    const updated = await this.prisma.occupancyHistory.update({
      where: { id },
      data: {
        move_out_date: moveOutDate,
        move_out_reason: (body.moveOutReason || body.move_out_reason || body.note) as string | undefined,
        version: { increment: 1 },
      },
      include: {
        employee: { include: { department: true } },
        room: { include: { dorm: true } },
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'occupancy_histories',
      entityId: id,
      before: this.mapHistory(existing),
      after: this.mapHistory(updated),
    });
    return this.mapHistory(updated);
  }

  async longTermWarnings(query: Record<string, unknown>) {
    const years = Number(process.env.LONG_TERM_DORM_YEARS || 3);
    const today = todayDateOnly();
    const threshold = new Date(today);
    threshold.setUTCFullYear(threshold.getUTCFullYear() - years);

    const employees = await this.prisma.employee.findMany({
      where: {
        deleted_at: null,
        employee_type: EmployeeType.JAPAN,
        first_dorm_use_date: { lte: threshold, not: null },
      },
      include: {
        occupancy_histories: {
          where: { ...openEndedWhere(), move_in_date: { lte: today } },
          include: { room: { include: { dorm: true } } },
          orderBy: { move_in_date: 'desc' },
          take: 1,
        },
      },
    });

    const items = employees.map((e) => {
      const occ = e.occupancy_histories[0];
      const moveIn = occ?.move_in_date ?? e.first_dorm_use_date!;
      const daysOccupied = calendarDaysBetween(moveIn, today) + 1;
      return {
        employeeId: e.id,
        employeeName: e.full_name,
        fullName: e.full_name,
        firstDormUseDate: formatDateField(e.first_dorm_use_date),
        dormName: occ?.room.dorm.name ?? '',
        roomName: occ?.room.name ?? '',
        moveInDate: occ ? formatDateField(occ.move_in_date) : formatDateField(e.first_dorm_use_date),
        daysOccupied,
        currentOccupancy: occ
          ? {
              roomName: occ.room.name,
              dormName: occ.room.dorm.name,
              moveInDate: formatDateField(occ.move_in_date),
            }
          : null,
      };
    });
    return paginate(items, query.page, query.pageSize);
  }

  async occupiedCount(query: Record<string, unknown> = {}) {
    const activeOn = query.activeOn
      ? parseDateOnly(String(query.activeOn))
      : todayDateOnly();
    const where: Prisma.OccupancyHistoryWhereInput = {
      ...openEndedWhere(),
      move_in_date: { lte: activeOn },
    };
    if (query.dormId) {
      where.room = { dorm_id: String(query.dormId) };
    }
    const count = await this.prisma.occupancyHistory.count({ where });
    return { count };
  }

  /** 入退寮・部屋状態の整合性チェック */
  async dataChecks(query: Record<string, unknown> = {}) {
    const asOfDate = String(query.activeOn || query.asOfDate || '').trim();
    const asOf = asOfDate ? parseDateOnly(asOfDate) : todayDateOnly();

    const [rooms, allHistories, openHistories] = await Promise.all([
      this.prisma.room.findMany({
        where: { deleted_at: null, dorm: { deleted_at: null } },
        include: { dorm: true },
        orderBy: [{ dorm: { name: 'asc' } }, { name: 'asc' }],
      }),
      this.prisma.occupancyHistory.findMany({
        where: { deleted_at: null },
        include: { employee: true, room: { include: { dorm: true } } },
      }),
      this.prisma.occupancyHistory.findMany({
        where: {
          ...openEndedWhere(),
          move_in_date: { lte: asOf },
        },
        include: { employee: true, room: { include: { dorm: true } } },
      }),
    ]);

    const historiesByRoom = new Map<string, typeof allHistories>();
    for (const h of allHistories) {
      const list = historiesByRoom.get(h.room_id) || [];
      list.push(h);
      historiesByRoom.set(h.room_id, list);
    }

    const roomIds = rooms.map((r) => r.id);
    const roomCounts = countRoomsByStatus(historiesByRoom, roomIds, asOf);

    const issues: Array<{
      id: string;
      severity: 'error' | 'warning';
      message: string;
      count: number;
      items?: Array<Record<string, unknown>>;
    }> = [];

    const byRoom = new Map<string, typeof openHistories>();
    const byEmployee = new Map<string, typeof openHistories>();
    for (const h of openHistories) {
      const rl = byRoom.get(h.room_id) || [];
      rl.push(h);
      byRoom.set(h.room_id, rl);
      const el = byEmployee.get(h.employee_id) || [];
      el.push(h);
      byEmployee.set(h.employee_id, el);
    }

    const roomOverlaps = [...byRoom.entries()].filter(([, list]) => list.length > 1);
    if (roomOverlaps.length) {
      issues.push({
        id: 'room_multi_active',
        severity: 'error',
        message: '同一部屋に複数の在室履歴があります',
        count: roomOverlaps.length,
        items: roomOverlaps.slice(0, 5).map(([roomId, list]) => ({
          roomId,
          roomName: list[0].room.name,
          dormName: list[0].room.dorm.name,
          count: String(list.length),
          histories: list.map((h) => ({
            historyId: h.id,
            employeeId: h.employee_id,
            employeeName: h.employee.full_name,
            moveInDate: formatDateField(h.move_in_date),
          })),
        })),
      });
    }

    const employeeOverlaps = [...byEmployee.entries()].filter(([, list]) => list.length > 1);
    if (employeeOverlaps.length) {
      issues.push({
        id: 'employee_multi_active',
        severity: 'error',
        message: '同一社員に複数の在室履歴があります',
        count: employeeOverlaps.length,
        items: employeeOverlaps.slice(0, 5).map(([, list]) => ({
          employeeId: list[0].employee_id,
          employeeName: list[0].employee.full_name,
          count: String(list.length),
          histories: list.map((h) => ({
            historyId: h.id,
            dormName: h.room.dorm.name,
            roomName: h.room.name,
            moveInDate: formatDateField(h.move_in_date),
          })),
        })),
      });
    }

    const deletedEmployeeActive = openHistories.filter((h) => h.employee.deleted_at != null);
    if (deletedEmployeeActive.length) {
      issues.push({
        id: 'deleted_employee_active',
        severity: 'warning',
        message: '削除済み社員の在室履歴があります',
        count: deletedEmployeeActive.length,
        items: deletedEmployeeActive.slice(0, 5).map((h) => ({
          historyId: h.id,
          employeeId: h.employee_id,
          employeeName: h.employee.full_name,
          roomName: h.room.name,
          dormName: h.room.dorm.name,
        })),
      });
    }

    const deletedRoomActive = openHistories.filter((h) => h.room.deleted_at != null);
    if (deletedRoomActive.length) {
      issues.push({
        id: 'deleted_room_active',
        severity: 'error',
        message: '削除済み部屋の在室履歴があります',
        count: deletedRoomActive.length,
        items: deletedRoomActive.slice(0, 5).map((h) => ({
          historyId: h.id,
          employeeId: h.employee_id,
          employeeName: h.employee.full_name,
          roomName: h.room.name,
          dormName: h.room.dorm.name,
        })),
      });
    }

    const deletedDormActive = openHistories.filter(
      (h) => h.room.deleted_at == null && h.room.dorm.deleted_at != null,
    );
    if (deletedDormActive.length) {
      issues.push({
        id: 'deleted_dorm_active',
        severity: 'error',
        message: '削除済み寮の在室履歴があります',
        count: deletedDormActive.length,
        items: deletedDormActive.slice(0, 5).map((h) => ({
          historyId: h.id,
          employeeId: h.employee_id,
          employeeName: h.employee.full_name,
          roomName: h.room.name,
          dormName: h.room.dorm.name,
        })),
      });
    }

    const historyWithoutOccupiedRoom: typeof openHistories = [];
    const activeRoomIds = new Set(rooms.map((r) => r.id));
    for (const h of openHistories) {
      if (!activeRoomIds.has(h.room_id)) continue;
      const status = resolveRoomStatus(historiesByRoom.get(h.room_id) || [], asOf);
      if (status !== 'OCCUPIED') historyWithoutOccupiedRoom.push(h);
    }
    if (historyWithoutOccupiedRoom.length) {
      issues.push({
        id: 'history_room_status_mismatch',
        severity: 'error',
        message: '在室履歴があるのに部屋が在室状態になっていません',
        count: historyWithoutOccupiedRoom.length,
        items: historyWithoutOccupiedRoom.slice(0, 5).map((h) => {
          const roomStatus = resolveRoomStatus(historiesByRoom.get(h.room_id) || [], asOf);
          return {
            historyId: h.id,
            employeeId: h.employee_id,
            employeeName: h.employee.full_name,
            roomName: h.room.name,
            dormName: h.room.dorm.name,
            moveInDate: formatDateField(h.move_in_date),
            moveOutDate: formatDateField(h.move_out_date),
            roomStatus,
            detail: `入居日 ${formatDateField(h.move_in_date)} · 部屋状態 ${roomStatus === 'VACANT' ? '空室' : roomStatus === 'RESERVED' ? '予約' : '在室'}`,
          };
        }),
      });
    }

    const occupiedRoomsWithoutHistory: Array<{ roomId: string; roomName: string; dormName: string }> = [];
    for (const room of rooms) {
      const roomHistories = historiesByRoom.get(room.id) || [];
      const status = resolveRoomStatus(roomHistories, asOf);
      const hasPhysical = roomHistories.some((h) =>
        isOccupiedOnDay(h.move_in_date, h.move_out_date, asOf),
      );
      if (status === 'OCCUPIED' && !hasPhysical) {
        occupiedRoomsWithoutHistory.push({
          roomId: room.id,
          roomName: room.name,
          dormName: room.dorm.name,
        });
      }
    }
    if (occupiedRoomsWithoutHistory.length) {
      issues.push({
        id: 'room_without_history',
        severity: 'error',
        message: '部屋は在室なのに在室履歴が見つかりません',
        count: occupiedRoomsWithoutHistory.length,
        items: occupiedRoomsWithoutHistory.slice(0, 5),
      });
    }

    const residentCount = openHistories.length;
    const occupiedRoomCount = roomCounts.occupied;
    let physicalOnlyRooms = 0;
    for (const room of rooms) {
      const status = resolveRoomStatus(historiesByRoom.get(room.id) || [], asOf);
      if (status === 'OCCUPIED' && !(byRoom.get(room.id)?.length)) {
        physicalOnlyRooms += 1;
      }
    }
    const explainedGap = occupiedRoomCount - residentCount;
    if (residentCount !== occupiedRoomCount && explainedGap !== physicalOnlyRooms) {
      issues.push({
        id: 'resident_room_count_mismatch',
        severity: 'error',
        message: `在室人数（${residentCount}名）と使用中部屋数（${occupiedRoomCount}室）が一致しません`,
        count: Math.abs(residentCount - occupiedRoomCount),
      });
    }

    const dormBreakdown = new Map<string, { name: string; occupied: number; vacant: number; reserved: number; total: number }>();
    for (const room of rooms) {
      const key = room.dorm_id;
      if (!dormBreakdown.has(key)) {
        dormBreakdown.set(key, {
          name: room.dorm.name,
          occupied: 0,
          vacant: 0,
          reserved: 0,
          total: 0,
        });
      }
      const entry = dormBreakdown.get(key)!;
      entry.total += 1;
      const status = resolveRoomStatus(historiesByRoom.get(room.id) || [], asOf);
      if (status === 'OCCUPIED') entry.occupied += 1;
      else if (status === 'RESERVED') entry.reserved += 1;
      else entry.vacant += 1;
    }

    return {
      asOfDate: formatDateField(asOf),
      summary: {
        residentCount,
        occupiedRoomCount,
        vacantCount: roomCounts.vacant,
        reservedCount: roomCounts.reserved,
        totalRooms: roomCounts.total,
        issueCount: issues.length,
        isConsistent: issues.length === 0,
      },
      issues,
      dormBreakdown: [...dormBreakdown.values()],
    };
  }
}
