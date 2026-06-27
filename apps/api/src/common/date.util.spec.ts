import {
  daysInMonth,
  intervalsOverlap,
  isOccupiedOnDay,
  occupiedDaysInMonth,
  parseDateOnly,
} from './date.util';

describe('date.util', () => {
  describe('isOccupiedOnDay (闭区间)', () => {
    it('在入寮日与退寮日之间算在室', () => {
      const moveIn = parseDateOnly('2026-04-01');
      const moveOut = parseDateOnly('2026-04-30');
      expect(isOccupiedOnDay(moveIn, moveOut, parseDateOnly('2026-04-15'))).toBe(true);
    });

    it('退寮日当天仍算在室', () => {
      const moveIn = parseDateOnly('2026-04-01');
      const moveOut = parseDateOnly('2026-06-30');
      expect(isOccupiedOnDay(moveIn, moveOut, parseDateOnly('2026-06-30'))).toBe(true);
    });

    it('退寮日次日不算在室', () => {
      const moveIn = parseDateOnly('2026-04-01');
      const moveOut = parseDateOnly('2026-06-30');
      expect(isOccupiedOnDay(moveIn, moveOut, parseDateOnly('2026-07-01'))).toBe(false);
    });

    it('无退寮日视为长期入居', () => {
      const moveIn = parseDateOnly('2026-04-01');
      expect(isOccupiedOnDay(moveIn, null, parseDateOnly('2026-12-31'))).toBe(true);
    });
  });

  describe('intervalsOverlap', () => {
    it('完全重叠期间应判定为重叠', () => {
      const existingStart = parseDateOnly('2026-01-01');
      const existingEnd = parseDateOnly('2026-06-30');
      const newStart = parseDateOnly('2026-03-01');
      expect(intervalsOverlap(newStart, null, existingStart, existingEnd)).toBe(true);
    });

    it('相邻闭区间：新入寮从旧退寮日同一天开始仍重叠', () => {
      const existingStart = parseDateOnly('2026-01-01');
      const existingEnd = parseDateOnly('2026-06-30');
      const newStart = parseDateOnly('2026-06-30');
      expect(intervalsOverlap(newStart, null, existingStart, existingEnd)).toBe(true);
    });

    it('新入寮在旧退寮日之后不重叠', () => {
      const existingStart = parseDateOnly('2026-01-01');
      const existingEnd = parseDateOnly('2026-06-30');
      const newStart = parseDateOnly('2026-07-01');
      expect(intervalsOverlap(newStart, null, existingStart, existingEnd)).toBe(false);
    });
  });

  describe('occupiedDaysInMonth (寮費日割り)', () => {
    it('4月全月在室应占满 30 天', () => {
      const days = occupiedDaysInMonth(
        parseDateOnly('2026-04-01'),
        parseDateOnly('2026-04-30'),
        '2026-04',
      );
      expect(days.length).toBe(30);
      expect(daysInMonth('2026-04')).toBe(30);
    });

    it('4/16 入居应占 15 天', () => {
      const days = occupiedDaysInMonth(parseDateOnly('2026-04-16'), null, '2026-04');
      expect(days.length).toBe(15);
      expect(days[0]).toBe(16);
      expect(days[days.length - 1]).toBe(30);
    });
  });
});
