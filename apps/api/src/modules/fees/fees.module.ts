import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { DormFeesController, FeeRatesController } from './fees.controller';
import { FeesService } from './fees.service';

@Module({
  controllers: [FeeRatesController, DormFeesController],
  providers: [FeesService, AuditService],
  exports: [FeesService],
})
export class FeesModule {}

