import * as employeeApi from '@/api/employees';
import * as occupancyApi from '@/api/occupancy';

async function fetchActiveOccupancies(filters = {}) {
  const res = await occupancyApi.getOccupancyHistories({
    occupancyStatus: 'active',
    page: 1,
    pageSize: 500,
    ...filters,
  });
  return res?.items || [];
}

/** 入寮可能：当前没有在室记录的社员 */
export async function fetchMoveInEligibleEmployees({ gender } = {}) {
  const [empRes, active] = await Promise.all([
    employeeApi.getEmployees({ gender, page: 1, pageSize: 500 }),
    fetchActiveOccupancies(),
  ]);
  const occupiedIds = new Set(active.map((h) => h.employeeId || h.employee_id));
  return (empRes?.items || []).filter((e) => !occupiedIds.has(e.id));
}

/** 退寮可能：当前有在室记录且社员未删除 */
export async function fetchMoveOutEligibleEmployees() {
  const active = await fetchActiveOccupancies();
  return active
    .filter((h) => !(h.employeeDeleted || h.employee_deleted))
    .map((h) => ({
      id: h.employeeId || h.employee_id,
      fullName: h.employeeName || h.employee?.fullName,
      dormName: h.dormName,
      roomName: h.roomName,
      historyId: h.id,
    }))
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
}

export function employeeOptionLabel(e) {
  const name = e.fullName || e.full_name || '—';
  if (e.dormName && e.roomName) return `${name}（${e.dormName}/${e.roomName}）`;
  return name;
}
