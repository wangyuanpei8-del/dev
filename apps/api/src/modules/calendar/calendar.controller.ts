import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CalendarService } from './calendar.service';

@Controller('dorm-allocation-calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  @RequirePermissions('occupancy:read')
  getCalendar(
    @Query('yearMonth') yearMonth: string,
    @Query('location') location?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    return this.calendar.getCalendar(yearMonth, location, q, sort);
  }
}
