import axios from 'axios';
import { useUserStore } from '@/store/user';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function downloadExport(path, params, filename) {
  const userStore = useUserStore();
  const res = await axios.get(`${baseURL}${path}`, {
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
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportOccupancyHistories(params = {}) {
  const ym = params.yearMonth || 'all';
  return downloadExport('/exports/occupancy-histories', params, `occupancy-histories-${ym}.csv`);
}

export function exportDormFees(params = {}) {
  const ym = params.yearMonth || 'all';
  return downloadExport('/exports/dorm-fees', params, `dorm-fees-${ym}.csv`);
}
