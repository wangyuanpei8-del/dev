import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, EmployeeType, Gender, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { paginate } from '../../common/pagination.util';
import { parseDateOnly, todayDateOnly } from '../../common/date.util';
import { occupiedOnDateWhere } from '../../common/occupancy-query.util';
import { mapEmployee } from './employees.mapper';
import { formatDateField } from '../../common/mapper.util';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(id: string) {
    const row = await this.prisma.employee.findFirst({
      where: { id, deleted_at: null },
      include: { department: true },
    });
    if (!row) throw new NotFoundException({ code: 40400, message: '社員が見つかりません' });
    return mapEmployee(row);
  }

  private async resolveDepartmentIdFromBody(body: Record<string, unknown>) {
    if (body.departmentId !== undefined || body.department_id !== undefined) {
      const raw = body.departmentId ?? body.department_id;
      return raw ? String(raw) : null;
    }
    if (body.department != null) {
      return this.resolveDepartmentId(body.department as string);
    }
    return undefined;
  }

  async list(query: Record<string, unknown>) {
    const where: Prisma.EmployeeWhereInput = { deleted_at: null };
    const q = String(query.q || '').trim();
    if (q) {
      where.OR = [
        { full_name: { contains: q, mode: 'insensitive' } },
        { employee_code: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.employeeType) where.employee_type = query.employeeType as EmployeeType;
    if (query.gender) where.gender = query.gender as Gender;

    const rows = await this.prisma.employee.findMany({
      where,
      include: { department: true },
      orderBy: { full_name: 'asc' },
    });
    const mapped = rows.map(mapEmployee);
    return paginate(mapped, query.page, query.pageSize);
  }

  private async resolveDepartmentId(departmentName?: string) {
    const name = departmentName?.trim();
    if (!name) return null;
    const existing = await this.prisma.department.findFirst({
      where: { name, deleted_at: null },
    });
    if (existing) return existing.id;
    const created = await this.prisma.department.create({ data: { name } });
    return created.id;
  }

  async create(body: Record<string, unknown>, userId?: string) {
    const departmentId = await this.resolveDepartmentIdFromBody(body);
    const created = await this.prisma.employee.create({
      data: {
        full_name: String(body.fullName || body.full_name),
        employee_code: (body.employeeCode || body.employee_code) as string | undefined,
        employee_type: (body.employeeType || body.employee_type) as EmployeeType,
        gender: (body.gender as Gender),
        department_id: departmentId,
      },
      include: { department: true },
    });
    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'employees',
      entityId: created.id,
      after: mapEmployee(created),
    });
    return mapEmployee(created);
  }

  async update(id: string, body: Record<string, unknown>, userId?: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, deleted_at: null },
      include: { department: true },
    });
    if (!existing) throw new NotFoundException({ code: 40400, message: '社員が見つかりません' });

    if (body.version != null && Number(body.version) !== existing.version) {
      throw new ConflictException({ code: 40910, message: '他のユーザーにより更新されています' });
    }

    const departmentId = await this.resolveDepartmentIdFromBody(body);

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        version: { increment: 1 },
        full_name: body.fullName != null ? String(body.fullName) : undefined,
        employee_code:
          body.employeeCode !== undefined ? (body.employeeCode as string | null) : undefined,
        employee_type: (body.employeeType as EmployeeType) || undefined,
        gender: (body.gender as Gender) || undefined,
        department_id: departmentId,
      },
      include: { department: true },
    });

    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'employees',
      entityId: id,
      before: mapEmployee(existing),
      after: mapEmployee(updated),
    });
    return mapEmployee(updated);
  }

  async remove(id: string, userId?: string) {
    const existing = await this.prisma.employee.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new NotFoundException({ code: 40400, message: '社員が見つかりません' });
    const active = await this.prisma.occupancyHistory.count({
      where: { employee_id: id, ...occupiedOnDateWhere(todayDateOnly()) },
    });
    if (active > 0) {
      throw new ConflictException({
        code: 40900,
        message: '在室中の履歴があるため削除できません',
      });
    }
    const dormLeader = await this.prisma.dorm.count({
      where: { responsible_employee_id: id, deleted_at: null },
    });
    if (dormLeader > 0) {
      throw new ConflictException({
        code: 40900,
        message: '寮責任者として登録されているため削除できません',
      });
    }
    await this.prisma.employee.update({
      where: { id },
      data: { deleted_at: new Date(), version: { increment: 1 } },
    });
    await this.audit.log({
      userId,
      action: AuditAction.DELETE,
      entityType: 'employees',
      entityId: id,
      before: mapEmployee({ ...existing, department: null }),
    });
    return { ok: true };
  }

  async updateFirstDormUseDate(id: string, body: Record<string, unknown>, userId?: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id, deleted_at: null },
      include: { department: true },
    });
    if (!existing) throw new NotFoundException({ code: 40400, message: '社員が見つかりません' });
    const dateStr = String(body.firstDormUseDate || body.first_dorm_use_date);
    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        first_dorm_use_date: parseDateOnly(dateStr),
        version: { increment: 1 },
      },
      include: { department: true },
    });
    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'employees',
      entityId: id,
      before: { firstDormUseDate: formatDateField(existing.first_dorm_use_date) },
      after: { firstDormUseDate: formatDateField(updated.first_dorm_use_date) },
    });
    return mapEmployee(updated);
  }
}
