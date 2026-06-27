import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as XLSX from 'xlsx';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

type ImportJobStatus = 'UPLOADED' | 'MAPPED' | 'PREVIEWED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(file?: Express.Multer.File) {
    if (!file) {
      throw new ConflictException({ code: 40001, message: 'ファイルを選択してください' });
    }
    const lowerName = file.originalname.toLowerCase();
    const ext = lowerName.endsWith('.csv')
      ? '.csv'
      : lowerName.endsWith('.xls')
        ? '.xls'
        : lowerName.endsWith('.xlsx')
          ? '.xlsx'
          : null;
    if (!ext) {
      throw new ConflictException({
        code: 40001,
        message: 'xlsx / xls / csv ファイルのみ対応しています',
      });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const jobId = uuidv4();
    const filename = `${jobId}${ext}`;
    const fullPath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(fullPath, file.buffer);

    const wb = this.readWorkbook(file.buffer, ext);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
    const headerRow = json?.[0] || [];
    const columns = headerRow.map((c) => String(c ?? '').trim()).filter(Boolean);

    await this.prisma.importJob.create({
      data: {
        id: jobId,
        file_name: file.originalname,
        file_path: fullPath,
        status: 'UPLOADED',
        mapping_json: {} as unknown as Prisma.InputJsonValue,
      },
    });

    return { id: jobId, jobId, columns };
  }

  async setMapping(jobId: string, body: Record<string, unknown>) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException({ code: 40400, message: 'ジョブが見つかりません' });
    const mapping = (body.mapping as object) || body;
    const updated = await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        mapping_json: mapping as unknown as Prisma.InputJsonValue,
        status: 'MAPPED',
      },
    });
    return { id: updated.id, status: updated.status };
  }

  private readWorkbook(buf: Buffer, ext: string) {
    if (ext === '.csv') {
      return XLSX.read(buf.toString('utf8'), { type: 'string' });
    }
    return XLSX.read(buf, { type: 'buffer' });
  }

  private async loadRows(jobId: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException({ code: 40400, message: 'ジョブが見つかりません' });
    if (!job.file_path) throw new ConflictException({ code: 40001, message: 'ファイルがありません' });
    const buf = await fs.readFile(job.file_path);
    const ext = path.extname(job.file_path).toLowerCase();
    const wb = this.readWorkbook(buf, ext);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    return { job, rows };
  }

  async preview(jobId: string) {
    const { job, rows } = await this.loadRows(jobId);
    const mapping = (job.mapping_json as Record<string, string>) || {};
    const mapped = rows.slice(0, 50).map((r) => {
      const out: Record<string, unknown> = {};
      for (const [field, col] of Object.entries(mapping)) {
        out[field] = (r as any)[col] ?? '';
      }
      return out;
    });
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: job.status === 'MAPPED' ? 'PREVIEWED' : job.status },
    });
    return { rows: mapped, total: rows.length };
  }

  async execute(jobId: string) {
    const { job, rows } = await this.loadRows(jobId);
    const mapping = (job.mapping_json as Record<string, string>) || {};

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'EXECUTING' },
    });

    const errors: { row: number; field: string; message: string }[] = [];
    let createdEmployees = 0;
    let createdDorms = 0;
    let createdRooms = 0;

    const dormCache = new Map<string, string>(); // dormCode/name -> dormId

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const get = (field: string) => {
        const col = mapping[field];
        if (!col) return '';
        return String((raw as any)[col] ?? '').trim();
      };

      const employeeCode = get('employeeCode');
      const fullName = get('fullName');
      const dormCode = get('dormCode') || get('dormName');
      const roomCode = get('roomCode') || get('roomName');

      if (!fullName) {
        errors.push({ row: i + 2, field: 'fullName', message: '氏名が空です' });
        continue;
      }

      const emp = employeeCode
        ? await this.prisma.employee.findFirst({ where: { employee_code: employeeCode, deleted_at: null } })
        : null;
      if (!emp) {
        await this.prisma.employee.create({
          data: {
            employee_code: employeeCode || undefined,
            full_name: fullName,
            employee_type: 'JAPAN',
            gender: 'MALE',
          } as any,
        });
        createdEmployees++;
      }

      if (dormCode && roomCode) {
        let dormId = dormCache.get(dormCode);
        if (!dormId) {
          const existingDorm = await this.prisma.dorm.findFirst({
            where: { code: dormCode, deleted_at: null },
          });
          if (existingDorm) dormId = existingDorm.id;
          else {
            const d = await this.prisma.dorm.create({
              data: {
                code: dormCode,
                name: dormCode,
                address: '',
                layout_type: '3DK',
                gender_type: 'MALE_DORM',
              } as any,
            });
            dormId = d.id;
            createdDorms++;
          }
          dormCache.set(dormCode, dormId);
        }

        const existingRoom = await this.prisma.room.findFirst({
          where: { dorm_id: dormId, code: roomCode, deleted_at: null },
        });
        if (!existingRoom) {
          await this.prisma.room.create({
            data: {
              dorm_id: dormId,
              code: roomCode,
              name: roomCode,
              area_sqm: 0,
            } as any,
          });
          createdRooms++;
        }
      }
    }

    const status: ImportJobStatus = errors.length ? 'FAILED' : 'COMPLETED';
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status,
        result_json: { errors, createdEmployees, createdDorms, createdRooms } as unknown as Prisma.InputJsonValue,
      },
    });

    return { jobId, status };
  }

  async getJob(jobId: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException({ code: 40400, message: 'ジョブが見つかりません' });
    const result = (job.result_json as any) || {};
    return {
      id: job.id,
      status: job.status,
      message: job.status === 'FAILED' ? '一部エラーがあります' : '',
      errors: result.errors || [],
    };
  }
}

