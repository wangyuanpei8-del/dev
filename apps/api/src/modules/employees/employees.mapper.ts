import { Department, Employee } from '@prisma/client';
import { formatDateField } from '../../common/mapper.util';

type EmployeeWithDept = Employee & { department?: Department | null };

export function mapEmployee(e: EmployeeWithDept) {
  return {
    id: e.id,
    version: e.version,
    employeeCode: e.employee_code,
    fullName: e.full_name,
    employeeType: e.employee_type,
    gender: e.gender,
    departmentId: e.department_id,
    department: e.department?.name ?? null,
    siteNearestStation: e.site_nearest_station,
    mobilePhone: e.mobile_phone,
    email: e.email,
    firstDormUseDate: formatDateField(e.first_dorm_use_date),
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}
