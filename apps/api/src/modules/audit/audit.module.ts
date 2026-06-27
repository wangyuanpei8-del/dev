import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditServiceApi } from './audit.service';

@Module({
  controllers: [AuditController],
  providers: [AuditServiceApi],
})
export class AuditModule {}

