import {
  PrismaClient,
  UserRole,
  EmployeeType,
  Gender,
  DormGenderType,
  Location,
  FeeStatus,
  AuditAction,
  RoomType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password_hash: passwordHash,
      display_name: 'システム管理者',
      role: UserRole.SYSTEM_ADMIN,
      is_active: true,
    },
    create: {
      email: 'admin@example.com',
      password_hash: passwordHash,
      display_name: 'システム管理者',
      role: UserRole.SYSTEM_ADMIN,
      is_active: true,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {
      password_hash: passwordHash,
      display_name: '閲覧ユーザー',
      role: UserRole.VIEWER,
      is_active: true,
    },
    create: {
      email: 'viewer@example.com',
      password_hash: passwordHash,
      display_name: '閲覧ユーザー',
      role: UserRole.VIEWER,
      is_active: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {
      password_hash: passwordHash,
      display_name: '寮管理者',
      role: UserRole.DORM_MANAGER,
      is_active: true,
    },
    create: {
      email: 'manager@example.com',
      password_hash: passwordHash,
      display_name: '寮管理者',
      role: UserRole.DORM_MANAGER,
      is_active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      password_hash: passwordHash,
      display_name: 'テストユーザー',
      role: UserRole.VIEWER,
      is_active: true,
    },
    create: {
      email: 'test@example.com',
      password_hash: passwordHash,
      display_name: 'テストユーザー',
      role: UserRole.VIEWER,
      is_active: true,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'MOVE_OUT_WARNING_DAYS' },
    update: { value: '14' },
    create: { key: 'MOVE_OUT_WARNING_DAYS', value: '14' },
  });

  const deptDx = await prisma.department.upsert({
    where: { code: 'DX' },
    update: {},
    create: { code: 'DX', name: '本社 DX' },
  });

  const deptSales = await prisma.department.upsert({
    where: { code: 'SALES' },
    update: {},
    create: { code: 'SALES', name: '営業部' },
  });

  const empYamada = await prisma.employee.upsert({
    where: { employee_code: 'E001' },
    update: {},
    create: {
      employee_code: 'E001',
      full_name: '山田 太郎',
      employee_type: EmployeeType.JAPAN,
      gender: Gender.MALE,
      department_id: deptDx.id,
      first_dorm_use_date: new Date('2026-04-01'),
    },
  });

  const empSato = await prisma.employee.upsert({
    where: { employee_code: 'E002' },
    update: {},
    create: {
      employee_code: 'E002',
      full_name: '佐藤 花子',
      employee_type: EmployeeType.JAPAN,
      gender: Gender.FEMALE,
      department_id: deptSales.id,
    },
  });

  await prisma.employee.upsert({
    where: { employee_code: 'E003' },
    update: {},
    create: {
      employee_code: 'E003',
      full_name: '田中 一郎',
      employee_type: EmployeeType.JAPAN,
      gender: Gender.MALE,
      department_id: deptDx.id,
    },
  });

  const dormToyosu = await prisma.dorm.upsert({
    where: { code: 'TOYOSU-1' },
    update: {
      responsible_employee_id: empYamada.id,
      location: Location.TOKYO,
    },
    create: {
      code: 'TOYOSU-1',
      name: '豊洲Ｉ寮',
      address: '東京都江東区豊洲1-1-1',
      layout_type: '3DK',
      gender_type: DormGenderType.MALE_DORM,
      location: Location.TOKYO,
      responsible_employee_id: empYamada.id,
    },
  });

  const roomFront = await prisma.room.upsert({
    where: { dorm_id_code: { dorm_id: dormToyosu.id, code: 'R01' } },
    update: {},
    create: {
      dorm_id: dormToyosu.id,
      code: 'R01',
      name: '手前洋室',
      area_sqm: 8.5,
      room_type: RoomType.WESTERN,
    },
  });

  await prisma.occupancyHistory.deleteMany({
    where: { room_id: roomFront.id },
  });

  const occupancy = await prisma.occupancyHistory.create({
    data: {
      employee_id: empYamada.id,
      room_id: roomFront.id,
      move_in_date: new Date('2026-04-01'),
      move_out_date: null,
    },
  });

  await prisma.dormFee.upsert({
    where: {
      employee_id_year_month: { employee_id: empYamada.id, year_month: '2026-06' },
    },
    update: { status: FeeStatus.DRAFT },
    create: {
      employee_id: empYamada.id,
      year_month: '2026-06',
      amount_yen: 15000,
      calculation_basis: {
        daysInMonth: 30,
        parts: [
          {
            roomName: '手前洋室',
            dormName: '豊洲Ｉ寮',
            roomType: 'WESTERN',
            areaSqm: 8.5,
            dailyRateYen: 500,
            occupiedDays: 30,
            partAmountYen: 4250,
          },
        ],
      },
      status: FeeStatus.DRAFT,
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: admin.id,
      action: AuditAction.CREATE,
      entity_type: 'OccupancyHistory',
      entity_id: occupancy.id,
      after_json: {
        employee_id: empYamada.id,
        room_id: roomFront.id,
        move_in_date: '2026-04-01',
        move_out_date: null,
      },
    },
  });

  for (const rt of Object.values(RoomType)) {
    const existing = await prisma.feeRate.findFirst({
      where: { room_type: rt, effective_to: null },
    });
    if (!existing) {
      await prisma.feeRate.create({
        data: {
          room_type: rt,
          daily_rate_yen: 500,
          effective_from: new Date('2026-01-01'),
        },
      });
    }
  }

  console.log('Seed OK:', {
    admin: admin.email,
    viewer: viewer.email,
    manager: manager.email,
    dorm: dormToyosu.name,
    dormId: dormToyosu.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
