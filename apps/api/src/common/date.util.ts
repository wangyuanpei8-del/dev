/** 业务日期 YYYY-MM-DD（日历日，统一 UTC 午夜，与 PostgreSQL DATE / Prisma 一致） */
export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 本地日历「今天」→ UTC 日期 */
export function todayDateOnly(): Date {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return parseDateOnly(`${y}-${m}-${day}`);
}

export function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function dayInMonth(yearMonth: string, day: number): Date {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

const INFINITE = new Date('9999-12-31');

export function effectiveMoveOut(moveOut: Date | null | undefined): Date {
  return moveOut ?? INFINITE;
}

/** 闭区间在室：moveIn <= D && (moveOut == null || moveOut >= D) */
export function isOccupiedOnDay(
  moveIn: Date,
  moveOut: Date | null | undefined,
  day: Date,
): boolean {
  return moveIn <= day && effectiveMoveOut(moveOut) >= day;
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date | null | undefined,
  bStart: Date,
  bEnd: Date | null | undefined,
): boolean {
  const aEndEff = effectiveMoveOut(aEnd);
  const bEndEff = effectiveMoveOut(bEnd);
  return aStart <= bEndEff && bStart <= aEndEff;
}

export function occupiedDaysInMonth(
  moveIn: Date,
  moveOut: Date | null | undefined,
  yearMonth: string,
): number[] {
  const dim = daysInMonth(yearMonth);
  const days: number[] = [];
  for (let d = 1; d <= dim; d++) {
    const dayDate = dayInMonth(yearMonth, d);
    if (isOccupiedOnDay(moveIn, moveOut, dayDate)) days.push(d);
  }
  return days;
}

/** 两个日历日之间的天数差（to - from，UTC 午夜） */
export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function monthRange(yearMonth: string): { start: Date; end: Date } {
  const [y, m] = yearMonth.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 0)),
  };
}
