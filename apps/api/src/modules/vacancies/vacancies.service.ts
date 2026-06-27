import { Injectable } from '@nestjs/common';
import { DormGenderType, Gender, Location, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { parseDateOnly, todayDateOnly, isOccupiedOnDay } from '../../common/date.util';
import { resolveRoomStatus } from '../../common/room-status.util';

type RoomStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED';

type VacancyRoom = {
  id: string;
  code: string;
  name: string;
  status: RoomStatus;
  occupantName: string | null;
};

type VacancyDorm = {
  dormId: string;
  id: string;
  dormName: string;
  name: string;
  address: string;
  genderType: DormGenderType;
  location: Location | null;
  rooms: VacancyRoom[];
  vacantCount: number;
};

type OccupancyWithEmployee = {
  room_id: string;
  move_in_date: Date;
  move_out_date: Date | null;
  employee: { full_name: string };
};

@Injectable()
export class VacanciesService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadHistoriesByRoom(roomIds: string[]) {
    const map = new Map<string, OccupancyWithEmployee[]>();
    if (!roomIds.length) return map;

    const rows = await this.prisma.occupancyHistory.findMany({
      where: { room_id: { in: roomIds }, deleted_at: null },
      include: { employee: true },
    });

    for (const row of rows) {
      const list = map.get(row.room_id) ?? [];
      list.push(row);
      map.set(row.room_id, list);
    }
    return map;
  }

  private resolveRoomStatusFromHistories(histories: OccupancyWithEmployee[], asOf: Date) {
    const status = resolveRoomStatus(histories, asOf);
    if (status === 'OCCUPIED') {
      const occupied = histories.find((h) =>
        isOccupiedOnDay(h.move_in_date, h.move_out_date, asOf),
      );
      return { status: 'OCCUPIED' as const, occupantName: occupied?.employee.full_name ?? null };
    }
    return { status, occupantName: null };
  }

  async list(query: Record<string, unknown>) {
    const asOfDate = String(query.asOfDate || query.activeOn || '').trim();
    const asOf = asOfDate ? parseDateOnly(asOfDate) : todayDateOnly();

    const where: Prisma.DormWhereInput = { deleted_at: null };
    if (query.location) where.location = query.location as Location;
    if (query.genderType) where.gender_type = query.genderType as DormGenderType;

    const dorms = await this.prisma.dorm.findMany({
      where,
      include: { rooms: { where: { deleted_at: null } } },
      orderBy: { name: 'asc' },
    });

    const roomIds = dorms.flatMap((d) => d.rooms.map((r) => r.id));
    const historiesByRoom = await this.loadHistoriesByRoom(roomIds);

    const items: VacancyDorm[] = [];
    for (const dorm of dorms) {
      const rooms: VacancyRoom[] = [];
      for (const room of dorm.rooms) {
        const histories = historiesByRoom.get(room.id) ?? [];
        const st = this.resolveRoomStatusFromHistories(histories, asOf);
        rooms.push({
          id: room.id,
          code: room.code,
          name: room.name,
          status: st.status as RoomStatus,
          occupantName: st.occupantName,
        });
      }
      items.push({
        dormId: dorm.id,
        id: dorm.id,
        dormName: dorm.name,
        name: dorm.name,
        address: dorm.address,
        genderType: dorm.gender_type,
        location: dorm.location,
        rooms,
        vacantCount: rooms.filter((r) => r.status === 'VACANT').length,
      });
    }
    return { items };
  }

  async assignableRooms(query: Record<string, unknown>) {
    const employeeId = query.employeeId ? String(query.employeeId) : '';
    const gender = query.gender ? (String(query.gender) as Gender) : null;
    const moveInDate = String(query.asOfDate || query.moveInDate || '').trim();
    const asOf = moveInDate ? parseDateOnly(moveInDate) : todayDateOnly();

    let targetGender: Gender | null = gender;
    if (!targetGender && employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: employeeId, deleted_at: null },
      });
      targetGender = emp?.gender ?? null;
    }

    const expectedDormGender =
      targetGender === Gender.MALE ? DormGenderType.MALE_DORM : DormGenderType.FEMALE_DORM;

    const rooms = await this.prisma.room.findMany({
      where: {
        deleted_at: null,
        dorm: { deleted_at: null, gender_type: expectedDormGender },
      },
      include: { dorm: true },
      orderBy: [{ dorm: { name: 'asc' } }, { code: 'asc' }],
    });

    const historiesByRoom = await this.loadHistoriesByRoom(rooms.map((r) => r.id));

    const items: { id: string; code: string; name: string; dormId: string; dormName: string }[] = [];
    for (const room of rooms) {
      const histories = historiesByRoom.get(room.id) ?? [];
      const st = this.resolveRoomStatusFromHistories(histories, asOf);
      if (st.status !== 'VACANT') continue;
      items.push({
        id: room.id,
        code: room.code,
        name: room.name,
        dormId: room.dorm_id,
        dormName: room.dorm.name,
      });
    }
    return { items };
  }
}
