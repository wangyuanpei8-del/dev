import { UserRole } from '@/constants/enums';

const ROLE_PERMISSIONS = {
  [UserRole.SYSTEM_ADMIN]: ['*', 'users:manage', 'audit:read'],
  [UserRole.DORM_MANAGER]: [
    'employees:read', 'employees:write',
    'dorms:read', 'dorms:write',
    'rooms:read', 'rooms:write',
    'occupancy:read', 'occupancy:write',
    'fees:read', 'fees:write', 'fees:confirm',
    'vacancies:read',
    'equipment:read', 'equipment:write',
    'import:execute',
  ],
  [UserRole.VIEWER]: [
    'employees:read', 'dorms:read', 'rooms:read',
    'occupancy:read', 'fees:read', 'vacancies:read',
    'equipment:read',
  ],
};

export function resolvePermissions(role, serverPermissions) {
  if (Array.isArray(serverPermissions) && serverPermissions.length) {
    return serverPermissions;
  }
  return ROLE_PERMISSIONS[role] || [];
}

export function checkPermission(permissions, permission) {
  if (!permission) return true;
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

export function checkRole(userRole, requiredRole) {
  if (!requiredRole) return true;
  return userRole === requiredRole;
}
