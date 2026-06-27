import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { DormsService } from './dorms.service';

@Controller('dorms')
export class DormsController {
  constructor(private readonly dorms: DormsService) {}

  @Get()
  @RequirePermissions('dorms:read')
  list(@Query() query: Record<string, unknown>) {
    return this.dorms.list(query);
  }

  @Get(':id')
  @RequirePermissions('dorms:read')
  getOne(@Param('id') id: string) {
    return this.dorms.getOne(id);
  }

  @Get(':dormId/rooms')
  @RequirePermissions('rooms:read')
  rooms(@Param('dormId') dormId: string, @Query() query: Record<string, unknown>) {
    return this.dorms.listRooms(dormId, query);
  }

  @Post()
  @RequirePermissions('dorms:write')
  create(@Body() body: Record<string, unknown>) {
    return this.dorms.create(body);
  }

  @Post(':dormId/rooms')
  @RequirePermissions('rooms:write')
  createRoom(@Param('dormId') dormId: string, @Body() body: Record<string, unknown>) {
    return this.dorms.createRoom(dormId, body);
  }

  @Patch(':id')
  @RequirePermissions('dorms:write')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.dorms.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('dorms:write')
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.dorms.remove(id, user?.sub);
  }
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly dorms: DormsService) {}

  @Patch(':id')
  @RequirePermissions('rooms:write')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.dorms.updateRoom(id, body);
  }

  @Delete(':id')
  @RequirePermissions('rooms:write')
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.dorms.removeRoom(id, user?.sub);
  }
}
