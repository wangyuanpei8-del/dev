import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, AuditService],
})
export class EmployeesModule {}
