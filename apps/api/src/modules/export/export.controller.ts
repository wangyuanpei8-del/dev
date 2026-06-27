import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CalendarService } from '../calendar/calendar.service';
import { ExportService, csvEscape } from './export.service';

@Controller('exports')
export class ExportController {
  constructor(
    private readonly calendar: CalendarService,
    private readonly exportService: ExportService,
  ) {}

  @Get('dorm-allocation-calendar')
  @RequirePermissions('occupancy:read')
  async exportAllocationCalendar(
    @Query('yearMonth') yearMonth: string,
    @Query('location') location: string,
    @Query('q') q: string,
    @Query('sort') sort: string,
    @Res() res: Response,
  ) {
    const data = await this.calendar.getCalendar(yearMonth, location, q, sort);

    const header = [
      '寮名',
      '部屋名',
      '氏名',
      '責任者(★)',
      '所属',
      ...Array.from({ length: data.daysInMonth }, (_, i) => `${i + 1}日`),
    ];
    const lines = [header.join(',')];

    for (const dorm of data.items) {
      for (const row of dorm.rows) {
        const dayCells = Array.from({ length: data.daysInMonth }, (_, i) =>
          row.occupiedDays.includes(i + 1) ? '1' : '',
        );
        lines.push(
          [
            csvEscape(dorm.dormName),
            csvEscape(row.roomName),
            csvEscape(row.employeeName),
            row.isLeader ? '★' : '',
            csvEscape(row.department || ''),
            ...dayCells,
          ].join(','),
        );
      }
    }

    this.sendCsv(res, `dorm-allocation-${data.yearMonth}.csv`, lines);
  }

  @Get('occupancy-histories')
  @RequirePermissions('occupancy:read')
  async exportOccupancyHistories(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const rows = await this.exportService.occupancyRows(query);
    const header = ['寮名', '部屋名', '氏名', '所属', '入寮日', '退寮日', '退寮理由'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          csvEscape(r.dormName),
          csvEscape(r.roomName),
          csvEscape(r.employeeName),
          csvEscape(r.department),
          csvEscape(r.moveInDate),
          csvEscape(r.moveOutDate),
          csvEscape(r.moveOutReason),
        ].join(','),
      ),
    ];
    const ym = query.yearMonth ? String(query.yearMonth) : 'all';
    this.sendCsv(res, `occupancy-histories-${ym}.csv`, lines);
  }

  @Get('dorm-fees')
  @RequirePermissions('fees:read')
  async exportDormFees(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const rows = await this.exportService.dormFeeRows(query);
    const header = ['氏名', '年月', '金額(円)', '状態', '利用日数', '部屋種別', '面積'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          csvEscape(r.employeeName),
          csvEscape(r.yearMonth),
          csvEscape(r.amountYen),
          csvEscape(r.status),
          csvEscape(r.occupiedDays),
          csvEscape(r.roomType),
          csvEscape(r.areaSqm),
        ].join(','),
      ),
    ];
    const ym = query.yearMonth ? String(query.yearMonth) : 'all';
    this.sendCsv(res, `dorm-fees-${ym}.csv`, lines);
  }

  private sendCsv(res: Response, filename: string, lines: string[]) {
    const bom = '\uFEFF';
    const body = bom + lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  }
}
