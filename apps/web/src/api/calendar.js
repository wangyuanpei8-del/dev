import axios from 'axios';
import request from '@/utils/request';
import { useUserStore } from '@/store/user';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function fetchCalendar(params) {
  return request.get('/dorm-allocation-calendar', { params });
}

export function fetchMoveOutWarningDays() {
  return request.get('/system-settings/move-out-warning-days');
}

export function patchMoveOutWarningDays(days) {
  return request.patch('/system-settings/move-out-warning-days', { days });
}

export async function exportCalendarCsv(params) {
  const userStore = useUserStore();
  const res = await axios.get(`${baseURL}/exports/dorm-allocation-calendar`, {
    params,
    responseType: 'blob',
    headers: userStore.accessToken
      ? { Authorization: `Bearer ${userStore.accessToken}` }
      : {},
  });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dorm-allocation-${params.yearMonth || 'export'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
