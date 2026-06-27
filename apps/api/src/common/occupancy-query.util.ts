import { Location, Prisma } from '@prisma/client';
import { isOccupiedOnDay, parseDateOnly } from './date.util';

/**
 * 日历日在室（闭区间）：moveIn <= asOf && (moveOut == null || moveOut >= asOf)
 * 用于：空室判定、寮費、删除保护（今日仍占用）
 */
export function occupiedOnDateWhere(asOf: Date): Prisma.OccupancyHistoryWhereInput {
  return {
    deleted_at: null,
    move_in_date: { lte: asOf },
    OR: [{ move_out_date: null }, { move_out_date: { gte: asOf } }],
  };
}

/** 未登记退寮日（管理上的「在室中」）— 与退寮登録 UI 一致 */
export function openEndedWhere(): Prisma.OccupancyHistoryWhereInput {
  return {
    deleted_at: null,
    move_out_date: null,
  };
}

export function isOpenEndedOccupancy(moveOut: Date | null | undefined): boolean {
  return moveOut == null;
}

export function isPhysicallyOccupiedOn(
  moveIn: Date,
  moveOut: Date | null | undefined,
  asOf: Date,
): boolean {
  return isOccupiedOnDay(moveIn, moveOut, asOf);
}

/** 入退寮履歴 list / CSV 导出共用筛选条件 */
export function buildOccupancyListWhere(query: Record<string, unknown>): Prisma.OccupancyHistoryWhereInput {
  const where: Prisma.OccupancyHistoryWhereInput = { deleted_at: null };

  if (query.employeeId) where.employee_id = String(query.employeeId);
  if (query.roomId) where.room_id = String(query.roomId);
  if (query.dormId) {
    where.room = { dorm_id: String(query.dormId) };
  }

  const q = String(query.q || '').trim();
  if (q) {
    where.employee = {
      OR: [
        { full_name: { contains: q, mode: 'insensitive' } },
        { employee_code: { contains: q, mode: 'insensitive' } },
      ],
    };
  }

  const occupancyStatus = String(query.occupancyStatus || query.status || '')
    .trim()
    .toLowerCase();

  if (occupancyStatus === 'active') {
    where.move_out_date = null;
  } else if (occupancyStatus === 'moved_out') {
    where.move_out_date = { not: null };
  } else if (query.activeOn) {
    const onDate = parseDateOnly(String(query.activeOn));
    where.move_in_date = { lte: onDate };
    where.OR = [{ move_out_date: null }, { move_out_date: { gte: onDate } }];
  }

  if (query.fromDate) {
    const from = parseDateOnly(String(query.fromDate));
    where.move_in_date = {
      ...(typeof where.move_in_date === 'object' && where.move_in_date ? where.move_in_date : {}),
      gte: from,
    };
  }
  if (query.toDate) {
    const to = parseDateOnly(String(query.toDate));
    where.move_in_date = {
      ...(typeof where.move_in_date === 'object' && where.move_in_date ? where.move_in_date : {}),
      lte: to,
    };
  }

  if (
    query.inconsistentOnly === 'true' ||
    query.inconsistentOnly === true ||
    query.inconsistentOnly === '1'
  ) {
    where.employee = { deleted_at: { not: null } };
  }

  return where;
}

/** 指定月份与履历有交集 */
export function occupancyOverlapsMonthWhere(yearMonth: string): Prisma.OccupancyHistoryWhereInput {
  const [y, m] = yearMonth.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return {
    move_in_date: { lte: end },
    OR: [{ move_out_date: null }, { move_out_date: { gte: start } }],
  };
}

export function mergeOccupancyWhere(
  ...clauses: Prisma.OccupancyHistoryWhereInput[]
): Prisma.OccupancyHistoryWhereInput {
  const parts = clauses.filter((c) => Object.keys(c).length > 0);
  if (parts.length <= 1) return parts[0] || {};
  return { AND: parts };
}

export function occupancyLocationWhere(location: Location): Prisma.OccupancyHistoryWhereInput {
  return { room: { dorm: { location } } };
}
