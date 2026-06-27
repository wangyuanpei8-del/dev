import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { DepartmentsService } from './departments.service';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @RequirePermissions('employees:read', 'users:manage')
  list(@Query() query: Record<string, unknown>) {
    return this.departments.list(query);
  }

  @Get(':id')
  @RequirePermissions('employees:read', 'users:manage')
  get(@Param('id') id: string) {
    return this.departments.get(id);
  }

  @Post()
  @RequirePermissions('users:manage')
  create(@Body() body: Record<string, unknown>) {
    return this.departments.create(body);
  }

  @Patch(':id')
  @RequirePermissions('users:manage')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.departments.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('users:manage')
  remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.departments.remove(id, user?.sub);
  }
}
