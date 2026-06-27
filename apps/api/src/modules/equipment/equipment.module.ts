import { Module } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import {
  EquipmentItemsController,
  StorageLocationsController,
} from './equipment.controller';
import { EquipmentService } from './equipment.service';

@Module({
  controllers: [EquipmentItemsController, StorageLocationsController],
  providers: [EquipmentService, AuditService],
})
export class EquipmentModule {}

