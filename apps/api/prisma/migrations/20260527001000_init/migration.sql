-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'DORM_MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('JAPAN', 'CHINA_ASSIGNMENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "DormGenderType" AS ENUM ('MALE_DORM', 'FEMALE_DORM');

-- CreateEnum
CREATE TYPE "Location" AS ENUM ('TOKYO', 'OSAKA', 'NAGOYA', 'OTHER');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('WESTERN', 'JAPANESE_SMALL', 'JAPANESE_MEDIUM', 'STORAGE_ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('DRAFT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'IMPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "employee_code" TEXT,
    "full_name" TEXT NOT NULL,
    "employee_type" "EmployeeType" NOT NULL,
    "gender" "Gender" NOT NULL,
    "department_id" UUID,
    "site_nearest_station" TEXT,
    "mobile_phone" TEXT,
    "email" TEXT,
    "first_dorm_use_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorms" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postal_code" TEXT,
    "layout_type" TEXT NOT NULL,
    "gender_type" "DormGenderType" NOT NULL,
    "location" "Location",
    "responsible_employee_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "dorms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "dorm_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area_sqm" DECIMAL(8,2) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "room_type" "RoomType" NOT NULL DEFAULT 'WESTERN',
    "has_ac" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupancy_histories" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "move_in_date" DATE NOT NULL,
    "move_out_date" DATE,
    "move_out_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "occupancy_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_rates" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "room_type" "RoomType" NOT NULL,
    "daily_rate_yen" DECIMAL(10,2) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dorm_fees" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "year_month" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "amount_yen" INTEGER NOT NULL,
    "calculation_basis" JSONB NOT NULL,
    "status" "FeeStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "dorm_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_items" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "equipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT,
    "status" TEXT NOT NULL,
    "mapping_json" JSONB NOT NULL,
    "result_json" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_name_idx" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE INDEX "employees_employee_type_idx" ON "employees"("employee_type");

-- CreateIndex
CREATE INDEX "employees_full_name_idx" ON "employees"("full_name");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "dorms_code_key" ON "dorms"("code");

-- CreateIndex
CREATE INDEX "dorms_gender_type_idx" ON "dorms"("gender_type");

-- CreateIndex
CREATE INDEX "dorms_location_idx" ON "dorms"("location");

-- CreateIndex
CREATE INDEX "dorms_responsible_employee_id_idx" ON "dorms"("responsible_employee_id");

-- CreateIndex
CREATE INDEX "rooms_dorm_id_idx" ON "rooms"("dorm_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_dorm_id_code_key" ON "rooms"("dorm_id", "code");

-- CreateIndex
CREATE INDEX "occupancy_histories_room_id_move_in_date_idx" ON "occupancy_histories"("room_id", "move_in_date");

-- CreateIndex
CREATE INDEX "occupancy_histories_employee_id_idx" ON "occupancy_histories"("employee_id");

-- CreateIndex
CREATE INDEX "fee_rates_room_type_effective_from_idx" ON "fee_rates"("room_type", "effective_from");

-- CreateIndex
CREATE INDEX "dorm_fees_year_month_idx" ON "dorm_fees"("year_month");

-- CreateIndex
CREATE UNIQUE INDEX "dorm_fees_employee_id_year_month_key" ON "dorm_fees"("employee_id", "year_month");

-- CreateIndex
CREATE INDEX "equipment_items_name_idx" ON "equipment_items"("name");

-- CreateIndex
CREATE INDEX "storage_locations_name_idx" ON "storage_locations"("name");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorms" ADD CONSTRAINT "dorms_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_dorm_id_fkey" FOREIGN KEY ("dorm_id") REFERENCES "dorms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_histories" ADD CONSTRAINT "occupancy_histories_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_histories" ADD CONSTRAINT "occupancy_histories_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dorm_fees" ADD CONSTRAINT "dorm_fees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

