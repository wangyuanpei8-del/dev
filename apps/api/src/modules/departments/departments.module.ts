import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, AuditService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
