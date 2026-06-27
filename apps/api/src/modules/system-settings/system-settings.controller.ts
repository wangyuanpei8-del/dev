import { Body, Controller, Get, Patch } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

const KEY = 'MOVE_OUT_WARNING_DAYS';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('move-out-warning-days')
  @RequirePermissions('occupancy:read')
  async getMoveOutWarningDays() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: KEY } });
    return { days: setting ? Number(setting.value) || 14 : 14 };
  }

  @Patch('move-out-warning-days')
  @RequirePermissions('users:manage')
  async patchMoveOutWarningDays(@Body() body: { days?: number }) {
    const days = typeof body?.days === 'number' && body.days >= 0 ? body.days : 14;
    await this.prisma.systemSetting.upsert({
      where: { key: KEY },
      update: { value: String(days) },
      create: { key: KEY, value: String(days) },
    });
    return { days };
  }
}
