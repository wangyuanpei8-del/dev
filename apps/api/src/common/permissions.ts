import { UserRole } from '@prisma/client';

export function permissionsForRole(role: UserRole): string[] {
  if (role === UserRole.SYSTEM_ADMIN) return ['*'];
  if (role === UserRole.DORM_MANAGER) {
    return [
      'employees:read',
      'employees:write',
      'dorms:read',
      'dorms:write',
      'rooms:read',
      'rooms:write',
      'occupancy:read',
      'occupancy:write',
      'fees:read',
      'fees:write',
      'fees:confirm',
      'vacancies:read',
      'equipment:read',
      'equipment:write',
      'import:execute',
    ];
  }
  return [
    'employees:read',
    'dorms:read',
    'rooms:read',
    'occupancy:read',
    'fees:read',
    'vacancies:read',
    'equipment:read',
  ];
}
