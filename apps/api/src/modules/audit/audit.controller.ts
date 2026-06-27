import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuditServiceApi } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditServiceApi) {}

  @Get()
  @RequirePermissions('audit:read')
  list(@Query() query: Record<string, unknown>) {
    return this.audit.list(query);
  }
}
