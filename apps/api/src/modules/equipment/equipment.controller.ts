import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { EquipmentService } from './equipment.service';

@Controller('equipment-items')
export class EquipmentItemsController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  @RequirePermissions('equipment:read')
  list(@Query() query: Record<string, unknown>) {
    return this.equipment.listItems(query);
  }

  @Post()
  @RequirePermissions('equipment:write')
  create(@Body() body: Record<string, unknown>) {
    return this.equipment.createItem(body);
  }

  @Patch(':id')
  @RequirePermissions('equipment:write')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.equipment.updateItem(id, body);
  }

  @Delete(':id')
  @RequirePermissions('equipment:write')
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.equipment.removeItem(id, user?.sub);
  }
}

@Controller('storage-locations')
export class StorageLocationsController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  @RequirePermissions('equipment:read')
  list(@Query() query: Record<string, unknown>) {
    return this.equipment.listLocations(query);
  }

  @Post()
  @RequirePermissions('equipment:write')
  create(@Body() body: Record<string, unknown>) {
    return this.equipment.createLocation(body);
  }

  @Patch(':id')
  @RequirePermissions('equipment:write')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.equipment.updateLocation(id, body);
  }

  @Delete(':id')
  @RequirePermissions('equipment:write')
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.equipment.removeLocation(id, user?.sub);
  }
}
