import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import router from '@/router';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

let refreshPromise = null;

service.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.accessToken) {
    config.headers.Authorization = `Bearer ${userStore.accessToken}`;
  }
  return config;
});

service.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'code' in body) {
      const { code, message, data } = body;
      if (code !== 0) {
        ElMessage.error(message || 'エラーが発生しました');
        return Promise.reject({ code, message });
      }
      return data;
    }
    return body;
  },
  async (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message;

    if (status === 401) {
      const userStore = useUserStore();
      if (!refreshPromise) {
        refreshPromise = userStore.refreshToken().finally(() => {
          refreshPromise = null;
        });
      }
      const ok = await refreshPromise;
      if (ok) return service(error.config);
      userStore.logout();
      router.push('/login');
      return Promise.reject(error);
    }

    if (status === 403) {
      ElMessage.error(msg || 'アクセス権限がありません');
    } else {
      ElMessage.error(msg || 'ネットワークエラー');
    }
    return Promise.reject(error);
  },
);

export function uploadImport(file) {
  const formData = new FormData();
  formData.append('file', file);
  return service.post('/import/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export default service;
