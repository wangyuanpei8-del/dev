import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '@/api/auth';
import { resolvePermissions, checkPermission, checkRole } from '@/utils/permission';

const TOKEN_KEY = 'dorm_access_token';
const REFRESH_KEY = 'dorm_refresh_token';

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(sessionStorage.getItem(TOKEN_KEY) || '');
  const refreshTokenValue = ref(localStorage.getItem(REFRESH_KEY) || '');
  const user = ref(null);
  const permissions = ref([]);

  const displayName = computed(() => user.value?.displayName || user.value?.display_name || '');
  const role = computed(() => user.value?.role || '');

  function setTokens(access, refresh) {
    accessToken.value = access || '';
    refreshTokenValue.value = refresh || '';
    if (access) sessionStorage.setItem(TOKEN_KEY, access);
    else sessionStorage.removeItem(TOKEN_KEY);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  }

  function setUser(data) {
    user.value = data;
    permissions.value = resolvePermissions(data?.role, data?.permissions);
  }

  async function login(form) {
    const res = await authApi.login(form);
    setTokens(res.accessToken || res.access_token, res.refreshToken || res.refresh_token);
    setUser(res.user || res);
    if (!res.user && !res.role) {
      await fetchMe();
    }
    return true;
  }

  async function fetchMe() {
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }

  async function refreshToken() {
    if (!refreshTokenValue.value) return false;
    try {
      const res = await authApi.refresh({ refreshToken: refreshTokenValue.value });
      setTokens(res.accessToken || res.access_token, res.refreshToken || res.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    setTokens('', '');
    user.value = null;
    permissions.value = [];
  }

  function hasPermission(p) {
    return checkPermission(permissions.value, p);
  }

  function hasRole(r) {
    return checkRole(role.value, r);
  }

  return {
    accessToken,
    refreshTokenValue,
    user,
    permissions,
    displayName,
    role,
    login,
    fetchMe,
    refreshToken,
    logout,
    hasPermission,
    hasRole,
    setUser,
  };
});
