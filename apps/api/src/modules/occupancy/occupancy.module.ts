import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { OccupancyController } from './occupancy.controller';
import { OccupancyService } from './occupancy.service';

@Module({
  controllers: [OccupancyController],
  providers: [OccupancyService, AuditService],
  exports: [OccupancyService],
})
export class OccupancyModule {}
