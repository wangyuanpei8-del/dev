# Stage 4：数据库设计

## 4.1 ER 结构（概念）

```text
users (应用账号)
departments (所属マスタ)
employees (社員) N ── 1 departments
dorms (寮) 1 ── N rooms (部屋)
dorms N ── 0..1 employees (responsible_employee_id 責任者)
employees 1 ── N occupancy_histories N ── 1 rooms
employees 1 ── N dorm_fees
equipment_items (备品マスタ)
storage_locations (保管场所)
fee_rates (费率)
audit_logs
import_jobs
system_settings (系统参数，如退寮警告天数)
```

**关系说明**：

- `dorms` 1:N `rooms`
- `employees` 1:N `occupancy_histories`；每条履歴指向 1 `room`
- `employees.first_dorm_use_date` 独立于履歴，仅日本社員首次写入
- `dorm_fees` 按 `employee_id` + `year_month` 唯一
- `dorms.responsible_employee_id`：寮責任者（★），最多 1 名，可空
- `employees.department_id` → `departments`（所属マスタ化）

## 4.2 枚举

| 枚举 | 值 |
|------|-----|
| UserRole | SYSTEM_ADMIN, DORM_MANAGER, VIEWER |
| EmployeeType | JAPAN, CHINA_ASSIGNMENT |
| Gender | MALE, FEMALE |
| DormGenderType | MALE_DORM, FEMALE_DORM |
| RoomType | WESTERN, JAPANESE_SMALL, JAPANESE_MEDIUM, STORAGE_ROOM, OTHER |
| FeeStatus | DRAFT, CONFIRMED |
| AuditAction | CREATE, UPDATE, DELETE, CONFIRM, IMPORT |
| Location（寮所在地区分） | TOKYO, OSAKA, NAGOYA, OTHER |

## 4.3 Prisma Schema（完整）

> 实施时复制到 `apps/api/prisma/schema.prisma`

> **重要（对齐最新要件定義書）**：
>
> - **日付型**：业务日期均使用 `@db.Date`（不含时刻）。
> - **退寮日语义**：`move_out_date` 当天**算在室**（闭区间）；`NULL` 视为无限期（等价 `9999-12-31`）。
> - **乐观锁**：写操作建议引入 `version`（Int）以支持同時編集的楽観ロック（见要件定義书 6.4）。

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SYSTEM_ADMIN
  DORM_MANAGER
  VIEWER
}

enum EmployeeType {
  JAPAN
  CHINA_ASSIGNMENT
}

enum Gender {
  MALE
  FEMALE
}

enum DormGenderType {
  MALE_DORM
  FEMALE_DORM
}

enum Location {
  TOKYO
  OSAKA
  NAGOYA
  OTHER
}

enum RoomType {
  WESTERN
  JAPANESE_SMALL
  JAPANESE_MEDIUM
  STORAGE_ROOM
  OTHER
}

enum FeeStatus {
  DRAFT
  CONFIRMED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  CONFIRM
  IMPORT
}

model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  password_hash String    @map("password_hash")
  display_name  String    @map("display_name")
  role          UserRole
  is_active     Boolean   @default(true) @map("is_active")
  last_login_at DateTime? @map("last_login_at")
  created_at    DateTime  @default(now()) @map("created_at")
  updated_at    DateTime  @updatedAt @map("updated_at")
  deleted_at    DateTime? @map("deleted_at")

  audit_logs AuditLog[]

  @@map("users")
}

model Department {
  id         String   @id @default(uuid()) @db.Uuid
  code       String?  @unique
  name       String
  created_at DateTime @default(now()) @map("created_at")
  updated_at DateTime @updatedAt @map("updated_at")
  deleted_at DateTime? @map("deleted_at")

  employees Employee[]

  @@index([name])
  @@map("departments")
}

model Employee {
  id                   String        @id @default(uuid()) @db.Uuid
  version              Int           @default(1)
  employee_code        String?       @unique @map("employee_code")
  full_name            String        @map("full_name")
  employee_type        EmployeeType  @map("employee_type")
  gender               Gender
  department_id        String?       @db.Uuid @map("department_id")
  site_nearest_station String?       @map("site_nearest_station")
  mobile_phone         String?       @map("mobile_phone")
  email                String?
  first_dorm_use_date  DateTime?     @db.Date @map("first_dorm_use_date")
  created_at           DateTime      @default(now()) @map("created_at")
  updated_at           DateTime      @updatedAt @map("updated_at")
  deleted_at           DateTime?     @map("deleted_at")

  department          Department?        @relation(fields: [department_id], references: [id])
  occupancy_histories OccupancyHistory[]
  dorm_fees           DormFee[]
  led_dorms           Dorm[]             @relation("DormLeader")

  @@index([employee_type])
  @@index([full_name])
  @@index([department_id])
  @@map("employees")
}

model Dorm {
  id                      String         @id @default(uuid()) @db.Uuid
  version                 Int            @default(1)
  code                    String         @unique
  name                    String
  address                 String
  postal_code             String?        @map("postal_code")
  layout_type             String         @map("layout_type")
  gender_type             DormGenderType @map("gender_type")
  location                Location?
  responsible_employee_id String?        @db.Uuid @map("responsible_employee_id")
  notes                   String?
  created_at              DateTime       @default(now()) @map("created_at")
  updated_at              DateTime       @updatedAt @map("updated_at")
  deleted_at              DateTime?      @map("deleted_at")

  responsible_employee Employee? @relation("DormLeader", fields: [responsible_employee_id], references: [id])
  rooms                Room[]

  @@index([gender_type])
  @@index([location])
  @@index([responsible_employee_id])
  @@map("dorms")
}

model Room {
  id          String   @id @default(uuid()) @db.Uuid
  dorm_id     String   @db.Uuid @map("dorm_id")
  version     Int      @default(1)
  code        String
  name        String
  area_sqm    Decimal  @db.Decimal(8, 2) @map("area_sqm")
  capacity    Int      @default(1)
  room_type   RoomType @default(WESTERN) @map("room_type")
  has_ac      Boolean  @default(false) @map("has_ac")
  notes       String?
  created_at  DateTime @default(now()) @map("created_at")
  updated_at  DateTime @updatedAt @map("updated_at")
  deleted_at  DateTime? @map("deleted_at")

  dorm                Dorm                 @relation(fields: [dorm_id], references: [id])
  occupancy_histories OccupancyHistory[]

  @@unique([dorm_id, code])
  @@index([dorm_id])
  @@map("rooms")
}

model OccupancyHistory {
  id              String    @id @default(uuid()) @db.Uuid
  employee_id     String    @db.Uuid @map("employee_id")
  room_id         String    @db.Uuid @map("room_id")
  version         Int       @default(1)
  move_in_date    DateTime  @db.Date @map("move_in_date")
  move_out_date   DateTime? @db.Date @map("move_out_date")
  move_out_reason String?   @map("move_out_reason")
  created_at      DateTime  @default(now()) @map("created_at")
  updated_at      DateTime  @updatedAt @map("updated_at")
  deleted_at      DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employee_id], references: [id])
  room     Room     @relation(fields: [room_id], references: [id])

  @@index([room_id, move_in_date])
  @@index([employee_id])
  @@map("occupancy_histories")
}

model FeeRate {
  id              String   @id @default(uuid()) @db.Uuid
  version         Int      @default(1)
  room_type       RoomType @map("room_type")
  daily_rate_yen  Decimal  @db.Decimal(10, 2) @map("daily_rate_yen")
  effective_from  DateTime @db.Date @map("effective_from")
  effective_to    DateTime? @db.Date @map("effective_to")
  created_at      DateTime @default(now()) @map("created_at")
  updated_at      DateTime @updatedAt @map("updated_at")

  @@index([room_type, effective_from])
  @@map("fee_rates")
}

model DormFee {
  id                 String    @id @default(uuid()) @db.Uuid
  employee_id        String    @db.Uuid @map("employee_id")
  year_month         String    @map("year_month")
  version            Int       @default(1)
  amount_yen         Int       @map("amount_yen")
  calculation_basis  Json      @map("calculation_basis")
  status             FeeStatus @default(DRAFT)
  created_at         DateTime  @default(now()) @map("created_at")
  updated_at         DateTime  @updatedAt @map("updated_at")
  deleted_at         DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employee_id], references: [id])

  @@unique([employee_id, year_month])
  @@index([year_month])
  @@map("dorm_fees")
}

model EquipmentItem {
  id         String   @id @default(uuid()) @db.Uuid
  name       String
  category   String?
  created_at DateTime @default(now()) @map("created_at")
  updated_at DateTime @updatedAt @map("updated_at")
  deleted_at DateTime? @map("deleted_at")

  @@map("equipment_items")
}

model StorageLocation {
  id         String   @id @default(uuid()) @db.Uuid
  name       String
  status     String   @default("ACTIVE")
  created_at DateTime @default(now()) @map("created_at")
  updated_at DateTime @updatedAt @map("updated_at")
  deleted_at DateTime? @map("deleted_at")

  @@map("storage_locations")
}

model AuditLog {
  id          String      @id @default(uuid()) @db.Uuid
  user_id     String?     @db.Uuid @map("user_id")
  action      AuditAction
  entity_type String      @map("entity_type")
  entity_id   String?     @map("entity_id") @db.Uuid
  before_json Json?       @map("before_json")
  after_json  Json?       @map("after_json")
  created_at  DateTime    @default(now()) @map("created_at")

  user User? @relation(fields: [user_id], references: [id])

  @@index([entity_type, entity_id])
  @@index([created_at])
  @@map("audit_logs")
}

model ImportJob {
  id           String   @id @default(uuid()) @db.Uuid
  file_name    String   @map("file_name")
  status       String
  mapping_json Json     @map("mapping_json")
  result_json  Json?    @map("result_json")
  created_by   String?  @map("created_by") @db.Uuid
  created_at   DateTime @default(now()) @map("created_at")

  @@map("import_jobs")
}

model SystemSetting {
  key        String   @id
  value      String
  updated_at DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

**种子**：`MOVE_OUT_WARNING_DAYS` = `14`

## 4.4 索引设计

| 表 | 索引 | 原因 |
|----|------|------|
| occupancy_histories | (room_id, move_in_date) | 重叠检测、空室查询 |
| occupancy_histories | (employee_id) | 社員履歴一覧 |
| dorm_fees | (year_month) | 月次一覧 |
| dorm_fees | unique(employee_id, year_month) | 防止重复算定 |
| employees | (full_name) | 氏名搜索 |
| dorms | (gender_type) | 性别筛选空室 |
| audit_logs | (created_at DESC) | 日志翻页 |

## 4.5 业务约束（DB + 应用）

| 约束 | 层 |
|------|-----|
| 入居期间不重叠 | 应用层 `OccupancyService`（MVP）；可选 PostgreSQL `daterange` + EXCLUDE 约束 Phase 2 |
| 寮 gender_type 不变 | 应用层 + Admin 特例 API |
| first_dorm_use_date 仅 JAPAN | 应用层 |
| 软删除 | 所有业务表 `deleted_at` |
| 責任者唯一 | `dorms.responsible_employee_id` 单列即可（0~1 名） |
| 同室日粒度不重叠 | `OccupancyService` + カレンダー冲突检测 |

## 4.6 种子数据建议

- 管理员账号 1 件
- 费率表：按 RoomType 各 1 条现行单价
- 从 Excel 导入真实 15 户寮数据（非 seed）
