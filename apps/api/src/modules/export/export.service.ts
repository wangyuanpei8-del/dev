import { Injectable } from '@nestjs/common';
import { FeeStatus, Location, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { formatDateField } from '../../common/mapper.util';
import {
  buildOccupancyListWhere,
  mergeOccupancyWhere,
  occupancyLocationWhere,
  occupancyOverlapsMonthWhere,
} from '../../common/occupancy-query.util';

export function csvEscape(val: string | number | null | undefined): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

type FeeBasisPart = {
  roomType?: string;
  room_type?: string;
  areaSqm?: number;
  area_sqm?: number;
  occupiedDays?: number;
  occupied_days?: number;
};

function summarizeFeeBasis(basis: Record<string, unknown>) {
  const parts = (basis.parts as FeeBasisPart[] | undefined) || [];
  if (parts.length) {
    const occupiedDays = parts.reduce((sum, p) => sum + (p.occupiedDays ?? p.occupied_days ?? 0), 0);
    const primary = parts[0];
    return {
      occupiedDays: String(occupiedDays),
      roomType: String(primary.roomType ?? primary.room_type ?? ''),
      areaSqm: String(primary.areaSqm ?? primary.area_sqm ?? ''),
    };
  }
  return {
    occupiedDays: String(basis.occupiedDays ?? basis.occupied_days ?? ''),
    roomType: String(basis.roomType ?? basis.room_type ?? ''),
    areaSqm: String(basis.areaSqm ?? basis.area_sqm ?? ''),
  };
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async occupancyRows(query: Record<string, unknown>) {
    const clauses: Prisma.OccupancyHistoryWhereInput[] = [buildOccupancyListWhere(query)];
    if (query.yearMonth) {
      clauses.push(occupancyOverlapsMonthWhere(String(query.yearMonth)));
    }
    if (query.location) {
      clauses.push(occupancyLocationWhere(query.location as Location));
    }

    const rows = await this.prisma.occupancyHistory.findMany({
      where: mergeOccupancyWhere(...clauses),
      include: {
        employee: { include: { department: true } },
        room: { include: { dorm: true } },
      },
      orderBy: [{ move_in_date: 'desc' }],
    });

    return rows.map((h) => ({
      dormName: h.room.dorm.name,
      roomName: h.room.name,
      employeeName: h.employee.full_name,
      department: h.employee.department?.name ?? '',
      moveInDate: formatDateField(h.move_in_date),
      moveOutDate: formatDateField(h.move_out_date),
      moveOutReason: h.move_out_reason ?? '',
    }));
  }

  async dormFeeRows(query: Record<string, unknown>) {
    const where: Prisma.DormFeeWhereInput = { deleted_at: null };
    if (query.employeeId) where.employee_id = String(query.employeeId);
    if (query.yearMonth) where.year_month = String(query.yearMonth);
    if (query.status) where.status = query.status as FeeStatus;

    const rows = await this.prisma.dormFee.findMany({
      where,
      include: { employee: true },
      orderBy: [{ year_month: 'desc' }, { created_at: 'desc' }],
    });

    return rows.map((r) => {
      const basis = (r.calculation_basis as Record<string, unknown>) || {};
      const summary = summarizeFeeBasis(basis);
      return {
        employeeName: r.employee.full_name,
        yearMonth: r.year_month,
        amountYen: String(r.amount_yen),
        status: r.status,
        occupiedDays: summary.occupiedDays,
        roomType: summary.roomType,
        areaSqm: summary.areaSqm,
      };
    });
  }
}
