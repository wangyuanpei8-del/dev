import { Injectable } from '@nestjs/common';
import { Location, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calendarDaysBetween,
  daysInMonth,
  formatDateOnly,
  isOccupiedOnDay,
  monthRange,
  occupiedDaysInMonth,
  parseDateOnly,
  todayDateOnly,
} from '../../common/date.util';

type CalendarRow = {
  roomId: string;
  roomName: string;
  employeeId: string;
  employeeName: string;
  isLeader: boolean;
  department: string | null;
  moveInDate: string;
  moveOutDate: string | null;
  occupancyStatus: 'ACTIVE' | 'ENDED' | 'MOVE_OUT_TODAY';
  occupiedDays: number[];
  conflicts: { day: number; type: string; message: string }[];
  warnings: { type: string; daysLeft?: number; message?: string }[];
};

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendar(yearMonth: string, location?: string, q?: string, sort?: string) {
    const ym = yearMonth || formatDateOnly(new Date()).slice(0, 7);
    const dim = daysInMonth(ym);
    const { start, end } = monthRange(ym);

    const dormWhere: Prisma.DormWhereInput = { deleted_at: null };
    if (location) dormWhere.location = location as Location;

    const dorms = await this.prisma.dorm.findMany({
      where: dormWhere,
      include: {
        rooms: {
          where: { deleted_at: null },
          include: {
            occupancy_histories: {
              where: {
                deleted_at: null,
                move_in_date: { lte: end },
                OR: [{ move_out_date: null }, { move_out_date: { gte: start } }],
              },
              include: { employee: { include: { department: true } } },
            },
          },
        },
      },
    });

    const warningDays = await this.getWarningDays();
    const today = todayDateOnly();

    let items = dorms.map((dorm) => {
      const rows: CalendarRow[] = [];

      for (const room of dorm.rooms) {
        for (const h of room.occupancy_histories) {
          const occupiedDays = occupiedDaysInMonth(h.move_in_date, h.move_out_date, ym);
          if (!occupiedDays.length) continue;

          const moveOutIso = h.move_out_date ? formatDateOnly(h.move_out_date) : null;
          const warnings: CalendarRow['warnings'] = [];
          let occupancyStatus: CalendarRow['occupancyStatus'] = 'ACTIVE';

          if (moveOutIso) {
            const moveOutDay = parseDateOnly(moveOutIso);
            const daysLeft = calendarDaysBetween(today, moveOutDay);
            if (daysLeft < 0) {
              occupancyStatus = 'ENDED';
            } else if (daysLeft === 0) {
              occupancyStatus = 'MOVE_OUT_TODAY';
              warnings.push({ type: 'MOVE_OUT_TODAY', daysLeft: 0, message: '本日退寮予定' });
            } else if (daysLeft <= warningDays) {
              warnings.push({
                type: 'MOVE_OUT_DUE_SOON',
                daysLeft,
                message: `退寮まであと ${daysLeft} 日`,
              });
            }
          }

          rows.push({
            roomId: room.id,
            roomName: room.name,
            employeeId: h.employee_id,
            employeeName: h.employee.full_name,
            isLeader: dorm.responsible_employee_id === h.employee_id,
            department: h.employee.department?.name ?? null,
            moveInDate: formatDateOnly(h.move_in_date),
            moveOutDate: moveOutIso,
            occupancyStatus,
            occupiedDays,
            conflicts: [],
            warnings,
          });
        }
      }

      rows.sort((a, b) => {
        const order = { ACTIVE: 0, MOVE_OUT_TODAY: 1, ENDED: 2 };
        const sa = order[a.occupancyStatus] ?? 9;
        const sb = order[b.occupancyStatus] ?? 9;
        if (sa !== sb) return sa - sb;
        return a.roomName.localeCompare(b.roomName, 'ja') || a.employeeName.localeCompare(b.employeeName, 'ja');
      });

      this.detectRoomConflicts(rows, ym);
      return { dormId: dorm.id, dormName: dorm.name, location: dorm.location, rows };
    });

    items = items.filter((d) => d.rows.length > 0);

    if (q?.trim()) {
      const needle = q.trim().toLowerCase();
      items = items
        .map((d) => ({ ...d, rows: d.rows.filter((r) => r.employeeName.toLowerCase().includes(needle)) }))
        .filter((d) => d.rows.length > 0);
    }

    if (sort === 'dormNameAsc') {
      items.sort((a, b) => a.dormName.localeCompare(b.dormName, 'ja'));
    }

    return { yearMonth: ym, daysInMonth: dim, items };
  }

  private detectRoomConflicts(rows: CalendarRow[], yearMonth: string) {
    const byRoom = new Map<string, CalendarRow[]>();
    for (const row of rows) {
      if (!byRoom.has(row.roomId)) byRoom.set(row.roomId, []);
      byRoom.get(row.roomId)!.push(row);
    }

    for (const roomRows of byRoom.values()) {
      if (roomRows.length < 2) continue;
      const dim = daysInMonth(yearMonth);
      for (let day = 1; day <= dim; day++) {
        const dayDate = parseDateOnly(`${yearMonth}-${String(day).padStart(2, '0')}`);
        const active = roomRows.filter((r) =>
          isOccupiedOnDay(parseDateOnly(r.moveInDate), r.moveOutDate ? parseDateOnly(r.moveOutDate) : null, dayDate),
        );
        if (active.length > 1) {
          for (const r of active) {
            if (!r.conflicts.some((c) => c.day === day)) {
              r.conflicts.push({ day, type: 'ROOM_OVERLAP', message: '同一部屋に同一期間で複数人' });
            }
          }
        }
      }
    }
  }

  private async getWarningDays() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'MOVE_OUT_WARNING_DAYS' } });
    return setting ? Number(setting.value) || 14 : 14;
  }
}
