import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { OccupancyService } from './occupancy.service';

@Controller('occupancy-histories')
export class OccupancyController {
  constructor(private readonly occupancy: OccupancyService) {}

  @Get()
  @RequirePermissions('occupancy:read')
  list(@Query() query: Record<string, unknown>) {
    return this.occupancy.list(query);
  }

  @Get('long-term-warnings')
  @RequirePermissions('occupancy:read')
  longTerm(@Query() query: Record<string, unknown>) {
    return this.occupancy.longTermWarnings(query);
  }

  @Get('data-checks')
  @RequirePermissions('occupancy:read')
  dataChecks(@Query() query: Record<string, unknown>) {
    return this.occupancy.dataChecks(query);
  }

  @Get('occupied-count')
  @RequirePermissions('occupancy:read')
  occupiedCount(@Query() query: Record<string, unknown>) {
    return this.occupancy.occupiedCount(query);
  }

  @Get(':id')
  @RequirePermissions('occupancy:read')
  get(@Param('id') id: string) {
    return this.occupancy.get(id);
  }

  @Post()
  @RequirePermissions('occupancy:write')
  create(@Body() body: Record<string, unknown>, @CurrentUser() user?: JwtPayload) {
    return this.occupancy.create(body, user?.sub);
  }

  @Patch(':id')
  @RequirePermissions('occupancy:write')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.occupancy.update(id, body, user?.sub);
  }

  @Post(':id/move-out')
  @RequirePermissions('occupancy:write')
  moveOut(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.occupancy.moveOut(id, body, user?.sub);
  }
}
