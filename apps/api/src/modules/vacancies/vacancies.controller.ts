import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { VacanciesService } from './vacancies.service';

@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly vacancies: VacanciesService) {}

  @Get()
  @RequirePermissions('vacancies:read')
  list(@Query() query: Record<string, unknown>) {
    return this.vacancies.list(query);
  }

  @Get('assignable-rooms')
  @RequirePermissions('occupancy:write')
  assignableRooms(@Query() query: Record<string, unknown>) {
    return this.vacancies.assignableRooms(query);
  }
}
