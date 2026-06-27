import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermissions('employees:read')
  list(@Query() query: Record<string, unknown>) {
    return this.employees.list(query);
  }

  @Get(':id')
  @RequirePermissions('employees:read')
  get(@Param('id') id: string) {
    return this.employees.get(id);
  }

  @Post()
  @RequirePermissions('employees:write')
  create(@Body() body: Record<string, unknown>, @CurrentUser() user?: JwtPayload) {
    return this.employees.create(body, user?.sub);
  }

  @Patch(':id')
  @RequirePermissions('employees:write')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.employees.update(id, body, user?.sub);
  }

  @Delete(':id')
  @RequirePermissions('employees:write')
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.employees.remove(id, user?.sub);
  }

  @Patch(':id/first-dorm-use-date')
  @RequirePermissions('employees:write')
  updateFirstDate(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.employees.updateFirstDormUseDate(id, body, user?.sub);
  }
}
