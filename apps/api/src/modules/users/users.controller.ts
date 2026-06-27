import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('users:manage')
  list(@Query() query: Record<string, unknown>) {
    return this.users.list(query);
  }

  @Post()
  @RequirePermissions('users:manage')
  create(@Body() body: Record<string, unknown>, @CurrentUser() user?: JwtPayload) {
    return this.users.create(body, user?.sub);
  }

  @Patch(':id')
  @RequirePermissions('users:manage')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.users.update(id, body, user?.sub);
  }
}
