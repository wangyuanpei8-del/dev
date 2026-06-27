import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, FeeStatus, Prisma, RoomType } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { paginate } from '../../common/pagination.util';
import { daysInMonth, isOccupiedOnDay, monthRange, parseDateOnly } from '../../common/date.util';
import { decimalToNumber, formatDateField } from '../../common/mapper.util';

function roundYen(v: InstanceType<typeof Decimal>) {
  return v.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listFeeRates(query: Record<string, unknown>) {
    const where: Prisma.FeeRateWhereInput = {};
    if (query.roomType) where.room_type = query.roomType as RoomType;
    const rows = await this.prisma.feeRate.findMany({
      where,
      orderBy: { effective_from: 'desc' },
    });
    const items = rows.map((r) => ({
      id: r.id,
      version: r.version,
      roomType: r.room_type,
      dailyRateYen: decimalToNumber(r.daily_rate_yen),
      effectiveFrom: formatDateField(r.effective_from),
      effectiveTo: formatDateField(r.effective_to),
    }));
    return { items };
  }

  async createFeeRate(body: Record<string, unknown>) {
    const roomType = body.roomType || body.room_type;
    const dailyRateYen = body.dailyRateYen ?? body.daily_rate_yen ?? body.unitPrice ?? body.unit_price;
    const effectiveFrom = body.effectiveFrom || body.effective_from;
    if (!roomType || !effectiveFrom) {
      throw new ConflictException({ code: 40001, message: '入力内容を確認してください' });
    }
    const created = await this.prisma.feeRate.create({
      data: {
        room_type: roomType as RoomType,
        daily_rate_yen: new Prisma.Decimal(Number(dailyRateYen ?? 0)),
        effective_from: parseDateOnly(String(effectiveFrom)),
        effective_to: body.effectiveTo ? parseDateOnly(String(body.effectiveTo)) : null,
      },
    });
    return {
      id: created.id,
      roomType: created.room_type,
      dailyRateYen: decimalToNumber(created.daily_rate_yen),
      effectiveFrom: formatDateField(created.effective_from),
      effectiveTo: formatDateField(created.effective_to),
    };
  }

  async updateFeeRate(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.feeRate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '费率が見つかりません' });
    if (body.version != null && Number(body.version) !== existing.version) {
      throw new ConflictException({ code: 40910, message: '他のユーザーにより更新されています' });
    }
    const updated = await this.prisma.feeRate.update({
      where: { id },
      data: {
        version: { increment: 1 },
        room_type: (body.roomType || body.room_type) as RoomType | undefined,
        daily_rate_yen:
          body.dailyRateYen != null || body.daily_rate_yen != null || body.unitPrice != null
            ? new Prisma.Decimal(Number(body.dailyRateYen ?? body.daily_rate_yen ?? body.unitPrice))
            : undefined,
        effective_from: body.effectiveFrom ? parseDateOnly(String(body.effectiveFrom)) : undefined,
        effective_to: body.effectiveTo !== undefined ? (body.effectiveTo ? parseDateOnly(String(body.effectiveTo)) : null) : undefined,
      },
    });
    return {
      id: updated.id,
      roomType: updated.room_type,
      dailyRateYen: decimalToNumber(updated.daily_rate_yen),
      effectiveFrom: formatDateField(updated.effective_from),
      effectiveTo: formatDateField(updated.effective_to),
    };
  }

  async listDormFees(query: Record<string, unknown>) {
    const where: Prisma.DormFeeWhereInput = { deleted_at: null };
    if (query.employeeId) where.employee_id = String(query.employeeId);
    if (query.yearMonth) where.year_month = String(query.yearMonth);
    if (query.status) where.status = query.status as FeeStatus;

    const rows = await this.prisma.dormFee.findMany({
      where,
      include: { employee: true },
      orderBy: [{ year_month: 'desc' }, { created_at: 'desc' }],
    });
    const items = rows.map((r) => ({
      id: r.id,
      version: r.version,
      employeeId: r.employee_id,
      employeeName: r.employee.full_name,
      yearMonth: r.year_month,
      totalAmount: r.amount_yen,
      status: r.status,
      calculationBasis: r.calculation_basis,
    }));
    return paginate(items, query.page, query.pageSize);
  }

  async getDormFee(id: string) {
    const row = await this.prisma.dormFee.findFirst({
      where: { id, deleted_at: null },
      include: { employee: true },
    });
    if (!row) throw new NotFoundException({ code: 40400, message: '寮費が見つかりません' });
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee.full_name,
      yearMonth: row.year_month,
      amountYen: row.amount_yen,
      status: row.status,
      calculationBasis: row.calculation_basis,
    };
  }

  async confirmDormFee(id: string, userId?: string) {
    const row = await this.prisma.dormFee.findFirst({ where: { id, deleted_at: null } });
    if (!row) throw new NotFoundException({ code: 40400, message: '寮費が見つかりません' });
    if (row.status === FeeStatus.CONFIRMED) return { id, status: FeeStatus.CONFIRMED };
    const updated = await this.prisma.dormFee.update({
      where: { id },
      data: { status: FeeStatus.CONFIRMED, version: { increment: 1 } },
    });
    await this.audit.log({
      userId,
      action: AuditAction.CONFIRM,
      entityType: 'dorm_fees',
      entityId: id,
      before: { status: row.status },
      after: { status: updated.status },
    });
    return { id, status: updated.status };
  }

  async calculateDormFees(body: Record<string, unknown>, userId?: string) {
    const yearMonth = String(body.yearMonth || body.year_month || '');
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new ConflictException({ code: 40001, message: 'yearMonth は YYYY-MM 形式です' });
    }
    const employeeIds = Array.isArray(body.employeeIds) ? (body.employeeIds as string[]) : null;
    const { start, end } = monthRange(yearMonth);
    const dim = daysInMonth(yearMonth);

    const histories = await this.prisma.occupancyHistory.findMany({
      where: {
        deleted_at: null,
        employee: { deleted_at: null },
        room: { deleted_at: null, dorm: { deleted_at: null } },
        ...(employeeIds ? { employee_id: { in: employeeIds } } : {}),
        move_in_date: { lte: end },
        OR: [{ move_out_date: null }, { move_out_date: { gte: start } }],
      },
      include: {
        employee: true,
        room: { include: { dorm: true } },
      },
      orderBy: { move_in_date: 'asc' },
    });

    const byEmployee = new Map<string, typeof histories>();
    for (const h of histories) {
      if (!byEmployee.has(h.employee_id)) byEmployee.set(h.employee_id, []);
      byEmployee.get(h.employee_id)!.push(h);
    }

    const results: {
      id: string;
      employeeId: string;
      employeeName: string;
      yearMonth: string;
      amountYen: number;
      status: FeeStatus;
      calculationBasis: unknown;
    }[] = [];
    for (const [employeeId, hs] of byEmployee.entries()) {
      const employee = hs[0].employee;
      const parts: {
        roomId: string;
        roomName: string;
        dormName: string;
        roomType: RoomType;
        areaSqm: number;
        dailyRateYen: number;
        occupiedDays: number;
        partAmountYen: number;
        occupancyHistoryId: string;
      }[] = [];
      let total = new Decimal(0);

      for (const h of hs) {
        const occupiedDays: number[] = [];
        for (let day = 1; day <= dim; day++) {
          const d = parseDateOnly(`${yearMonth}-${String(day).padStart(2, '0')}`);
          if (isOccupiedOnDay(h.move_in_date, h.move_out_date, d)) occupiedDays.push(day);
        }
        if (!occupiedDays.length) continue;

        const rate = await this.findRate(h.room.room_type, start, end);
        if (!rate) {
          throw new ConflictException({ code: 40900, message: '费率未設定' });
        }
        const areaSqm = new Decimal(decimalToNumber(h.room.area_sqm) ?? 0);
        const dailyRate = new Decimal(rate.daily_rate_yen.toString());
        const amount = areaSqm.times(dailyRate).times(occupiedDays.length).div(dim);
        total = total.plus(amount);

        parts.push({
          roomId: h.room_id,
          roomName: h.room.name,
          dormName: h.room.dorm.name,
          roomType: h.room.room_type,
          areaSqm: areaSqm.toNumber(),
          dailyRateYen: dailyRate.toNumber(),
          occupiedDays: occupiedDays.length,
          partAmountYen: roundYen(amount),
          occupancyHistoryId: h.id,
        });
      }

      if (!parts.length) continue;
      const amountYen = roundYen(total);
      const basis = {
        parts,
        daysInMonth: dim,
      };

      const existingConfirmed = await this.prisma.dormFee.findFirst({
        where: { employee_id: employeeId, year_month: yearMonth, deleted_at: null, status: FeeStatus.CONFIRMED },
      });
      if (existingConfirmed) {
        throw new ConflictException({ code: 40904, message: '確定済みの寮費は変更できません' });
      }

      const existingDraft = await this.prisma.dormFee.findFirst({
        where: { employee_id: employeeId, year_month: yearMonth, deleted_at: null },
      });

      const saved = existingDraft
        ? await this.prisma.dormFee.update({
            where: { id: existingDraft.id },
            data: {
              amount_yen: amountYen,
              calculation_basis: basis as unknown as Prisma.InputJsonValue,
              status: FeeStatus.DRAFT,
              version: { increment: 1 },
            },
          })
        : await this.prisma.dormFee.create({
            data: {
              employee_id: employeeId,
              year_month: yearMonth,
              amount_yen: amountYen,
              calculation_basis: basis as unknown as Prisma.InputJsonValue,
              status: FeeStatus.DRAFT,
            },
          });

      await this.audit.log({
        userId,
        action: AuditAction.UPDATE,
        entityType: 'dorm_fees',
        entityId: saved.id,
        after: { employeeId, yearMonth, amountYen, status: 'DRAFT' },
      });

      results.push({
        id: saved.id,
        employeeId,
        employeeName: employee.full_name,
        yearMonth,
        amountYen,
        status: saved.status,
        calculationBasis: basis,
      });
    }

    return { items: results };
  }

  private async findRate(roomType: RoomType, monthStart: Date, monthEnd: Date) {
    return this.prisma.feeRate.findFirst({
      where: {
        room_type: roomType,
        effective_from: { lte: monthEnd },
        OR: [{ effective_to: null }, { effective_to: { gte: monthStart } }],
      },
      orderBy: { effective_from: 'desc' },
    });
  }
}

