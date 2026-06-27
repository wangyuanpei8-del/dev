import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { HealthController } from './health.controller';
import { ApiResponseInterceptor } from './common/api-response.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { DormsModule } from './modules/dorms/dorms.module';
import { OccupancyModule } from './modules/occupancy/occupancy.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { ExportModule } from './modules/export/export.module';

import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { FeesModule } from './modules/fees/fees.module';
import { ImportModule } from './modules/import/import.module';
import { DepartmentsModule } from './modules/departments/departments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DepartmentsModule,
    EmployeesModule,
    DormsModule,
    OccupancyModule,
    CalendarModule,
    SystemSettingsModule,
    ExportModule,
    UsersModule,
    AuditModule,
    EquipmentModule,
    VacanciesModule,
    FeesModule,
    ImportModule,
  ],
  controllers: [
    HealthController,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
