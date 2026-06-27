import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { DormsController, RoomsController } from './dorms.controller';
import { DormsService } from './dorms.service';

@Module({
  controllers: [DormsController, RoomsController],
  providers: [DormsService, AuditService],
})
export class DormsModule {}
