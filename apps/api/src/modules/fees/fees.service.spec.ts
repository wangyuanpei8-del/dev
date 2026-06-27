import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FeeStatus, Prisma, RoomType } from '@prisma/client';
import { AuditService } from '../../common/services/audit.service';
import { parseDateOnly } from '../../common/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { FeesService } from './fees.service';

describe('FeesService', () => {
  let service: FeesService;
  let prisma: {
    occupancyHistory: { findMany: jest.Mock };
    feeRate: { findFirst: jest.Mock };
    dormFee: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      occupancyHistory: { findMany: jest.fn() },
      feeRate: { findFirst: jest.fn() },
      dormFee: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get(FeesService);
  });

  describe('calculateDormFees', () => {
    it('yearMonth 格式错误时拒绝', async () => {
      await expect(service.calculateDormFees({ yearMonth: '202604' })).rejects.toMatchObject({
        response: { code: 40001 },
      });
    });

    it('4月全月在室：8.5㎡ × 500円/日 × 30日 / 30日 = 4250円', async () => {
      const employeeId = 'emp-yamada';
      prisma.occupancyHistory.findMany.mockResolvedValue([
        {
          id: 'hist-1',
          employee_id: employeeId,
          room_id: 'room-1',
          move_in_date: parseDateOnly('2026-04-01'),
          move_out_date: parseDateOnly('2026-04-30'),
          employee: { full_name: '山田 太郎' },
          room: {
            name: '手前洋室',
            dorm: { name: '豊洲Ｉ寮' },
            room_type: RoomType.WESTERN,
            area_sqm: new Prisma.Decimal('8.5'),
          },
        },
      ]);
      prisma.feeRate.findFirst.mockResolvedValue({
        daily_rate_yen: new Prisma.Decimal('500'),
      });
      prisma.dormFee.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.dormFee.create.mockResolvedValue({
        id: 'fee-1',
        status: FeeStatus.DRAFT,
      });

      const result = await service.calculateDormFees({ yearMonth: '2026-04' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].amountYen).toBe(4250);
      expect(result.items[0].calculationBasis).toMatchObject({
        daysInMonth: 30,
        parts: [
          expect.objectContaining({
            occupiedDays: 30,
            areaSqm: 8.5,
            dailyRateYen: 500,
          }),
        ],
      });
    });

    it('4/16 入居：当月占 15 天', async () => {
      const employeeId = 'emp-new';
      prisma.occupancyHistory.findMany.mockResolvedValue([
        {
          id: 'hist-2',
          employee_id: employeeId,
          room_id: 'room-1',
          move_in_date: new Date(2026, 3, 16),
          move_out_date: null,
          employee: { full_name: '新人' },
          room: {
            name: '手前洋室',
            dorm: { name: '豊洲Ｉ寮' },
            room_type: RoomType.WESTERN,
            area_sqm: new Prisma.Decimal('8.5'),
          },
        },
      ]);
      prisma.feeRate.findFirst.mockResolvedValue({
        daily_rate_yen: new Prisma.Decimal('500'),
      });
      prisma.dormFee.findFirst.mockResolvedValue(null);
      prisma.dormFee.create.mockResolvedValue({
        id: 'fee-2',
        status: FeeStatus.DRAFT,
      });

      const result = await service.calculateDormFees({ yearMonth: '2026-04' });

      expect(result.items[0].calculationBasis).toMatchObject({
        parts: [expect.objectContaining({ occupiedDays: 15 })],
      });
      expect(result.items[0].amountYen).toBe(2125);
    });

    it('已确定寮費不可再算定', async () => {
      prisma.occupancyHistory.findMany.mockResolvedValue([
        {
          id: 'hist-1',
          employee_id: 'emp-1',
          room_id: 'room-1',
          move_in_date: new Date(2026, 3, 1),
          move_out_date: null,
          employee: { full_name: 'Test' },
          room: {
            name: '手前洋室',
            dorm: { name: '豊洲Ｉ寮' },
            room_type: RoomType.WESTERN,
            area_sqm: new Prisma.Decimal('8.5'),
          },
        },
      ]);
      prisma.feeRate.findFirst.mockResolvedValue({
        daily_rate_yen: new Prisma.Decimal('500'),
      });
      prisma.dormFee.findFirst.mockResolvedValueOnce({
        id: 'confirmed',
        status: FeeStatus.CONFIRMED,
      });

      await expect(service.calculateDormFees({ yearMonth: '2026-04' })).rejects.toMatchObject({
        response: { code: 40904 },
      });
    });
  });
});
