import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { FeesService } from './fees.service';

@Controller('fee-rates')
export class FeeRatesController {
  constructor(private readonly fees: FeesService) {}

  @Get()
  @RequirePermissions('fee-rates:write')
  list(@Query() query: Record<string, unknown>) {
    return this.fees.listFeeRates(query);
  }

  @Post()
  @RequirePermissions('fee-rates:write')
  create(@Body() body: Record<string, unknown>) {
    return this.fees.createFeeRate(body);
  }

  @Patch(':id')
  @RequirePermissions('fee-rates:write')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.fees.updateFeeRate(id, body);
  }
}

@Controller('dorm-fees')
export class DormFeesController {
  constructor(private readonly fees: FeesService) {}

  @Get()
  @RequirePermissions('fees:read')
  list(@Query() query: Record<string, unknown>) {
    return this.fees.listDormFees(query);
  }

  @Get(':id')
  @RequirePermissions('fees:read')
  getOne(@Param('id') id: string) {
    return this.fees.getDormFee(id);
  }

  @Post('calculate')
  @RequirePermissions('fees:write')
  calculate(@Body() body: Record<string, unknown>, @CurrentUser() user?: JwtPayload) {
    return this.fees.calculateDormFees(body, user?.sub);
  }

  @Post(':id/confirm')
  @RequirePermissions('fees:confirm')
  confirm(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.fees.confirmDormFee(id, user?.sub);
  }
}
