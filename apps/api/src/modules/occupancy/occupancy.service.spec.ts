import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DormGenderType, EmployeeType, Gender } from '@prisma/client';
import { AuditService } from '../../common/services/audit.service';
import { parseDateOnly } from '../../common/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { OccupancyService } from './occupancy.service';

describe('OccupancyService', () => {
  let service: OccupancyService;
  let prisma: {
    occupancyHistory: { findMany: jest.Mock };
    employee: { findFirstOrThrow: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    room: { findFirstOrThrow: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      occupancyHistory: { findMany: jest.fn() },
      employee: { findFirstOrThrow: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      room: { findFirstOrThrow: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccupancyService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get(OccupancyService);
  });

  describe('validateNoOverlap', () => {
    it('无重叠时通过', async () => {
      prisma.occupancyHistory.findMany.mockResolvedValue([]);
      await expect(
        service.validateNoOverlap('room-1', parseDateOnly('2026-07-01'), null),
      ).resolves.toBeUndefined();
    });

    it('期间重叠时抛出 OCCUPANCY_OVERLAP (40901)', async () => {
      prisma.occupancyHistory.findMany.mockResolvedValue([
        {
          move_in_date: parseDateOnly('2026-01-01'),
          move_out_date: parseDateOnly('2026-06-30'),
        },
      ]);

      await expect(
        service.validateNoOverlap('room-1', parseDateOnly('2026-03-01'), null),
      ).rejects.toMatchObject({
        response: { code: 40901 },
      });
    });

    it('退寮日当天新入寮仍视为重叠（闭区间）', async () => {
      prisma.occupancyHistory.findMany.mockResolvedValue([
        {
          move_in_date: parseDateOnly('2026-01-01'),
          move_out_date: parseDateOnly('2026-06-30'),
        },
      ]);

      await expect(
        service.validateNoOverlap('room-1', parseDateOnly('2026-06-30'), null),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateGenderMatch', () => {
    it('性别与寮种别一致时通过', async () => {
      prisma.employee.findFirstOrThrow.mockResolvedValue({ gender: Gender.MALE });
      prisma.room.findFirstOrThrow.mockResolvedValue({
        dorm: { gender_type: DormGenderType.MALE_DORM },
      });

      await expect(service.validateGenderMatch('emp-1', 'room-1')).resolves.toBeUndefined();
    });

    it('性别不符时抛出 GENDER_MISMATCH (40902)', async () => {
      prisma.employee.findFirstOrThrow.mockResolvedValue({ gender: Gender.FEMALE });
      prisma.room.findFirstOrThrow.mockResolvedValue({
        dorm: { gender_type: DormGenderType.MALE_DORM },
      });

      await expect(service.validateGenderMatch('emp-1', 'room-1')).rejects.toMatchObject({
        response: { code: 40902 },
      });
    });
  });

  describe('applyFirstDormUseDate', () => {
    it('日本社員首次入寮时写入初回日', async () => {
      const tx = {
        employee: {
          findFirstOrThrow: jest.fn().mockResolvedValue({
            employee_type: EmployeeType.JAPAN,
            first_dorm_use_date: null,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      const moveIn = parseDateOnly('2026-05-01');

      await service.applyFirstDormUseDate('emp-1', moveIn, tx as never);

      expect(tx.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { first_dorm_use_date: moveIn },
      });
    });

    it('已有初回日时不覆盖', async () => {
      const tx = {
        employee: {
          findFirstOrThrow: jest.fn().mockResolvedValue({
            employee_type: EmployeeType.JAPAN,
            first_dorm_use_date: parseDateOnly('2024-01-01'),
          }),
          update: jest.fn(),
        },
      };

      await service.applyFirstDormUseDate('emp-1', parseDateOnly('2026-05-01'), tx as never);

      expect(tx.employee.update).not.toHaveBeenCalled();
    });

    it('中国出張社員不写入初回日', async () => {
      const tx = {
        employee: {
          findFirstOrThrow: jest.fn().mockResolvedValue({
            employee_type: EmployeeType.CHINA_ASSIGNMENT,
            first_dorm_use_date: null,
          }),
          update: jest.fn(),
        },
      };

      await service.applyFirstDormUseDate('emp-1', parseDateOnly('2026-05-01'), tx as never);

      expect(tx.employee.update).not.toHaveBeenCalled();
    });
  });
});
