import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [CalendarModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
