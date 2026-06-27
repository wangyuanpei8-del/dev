import { isOccupiedOnDay } from './date.util';

export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED';

export type OccupancyLike = {
  move_in_date: Date;
  move_out_date: Date | null;
};

export function resolveRoomStatus(histories: OccupancyLike[], asOf: Date): RoomStatus {
  const reserved = histories.some((h) => h.move_in_date > asOf);
  const occupied = histories.some((h) =>
    isOccupiedOnDay(h.move_in_date, h.move_out_date, asOf),
  );
  if (occupied) return 'OCCUPIED';
  if (reserved) return 'RESERVED';
  return 'VACANT';
}

export function countRoomsByStatus(
  roomHistories: Map<string, OccupancyLike[]>,
  roomIds: string[],
  asOf: Date,
) {
  let occupied = 0;
  let vacant = 0;
  let reserved = 0;
  for (const roomId of roomIds) {
    const status = resolveRoomStatus(roomHistories.get(roomId) || [], asOf);
    if (status === 'OCCUPIED') occupied += 1;
    else if (status === 'RESERVED') reserved += 1;
    else vacant += 1;
  }
  return { occupied, vacant, reserved, total: roomIds.length };
}
