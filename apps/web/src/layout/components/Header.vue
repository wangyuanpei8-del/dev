<template>
  <header class="app-header">
    <div class="header-left">
      <el-button text class="collapse-btn" @click="appStore.toggleSidebar">
        <el-icon :size="18"><Fold v-if="!appStore.sidebarCollapsed" /><Expand v-else /></el-icon>
      </el-button>
      <div class="header-titles">
        <AppBreadcrumb v-if="showBreadcrumb" />
        <template v-else>
          <p class="header-eyebrow">社員寮管理システム</p>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </template>
      </div>
    </div>
    <div class="header-right">
      <span class="user-badge">{{ userStore.displayName || '—' }}</span>
      <el-button text class="logout-btn" @click="handleLogout">ログアウト</el-button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Fold, Expand } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';
import { useAppStore } from '@/store/app';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();

const pageTitle = computed(() => route.meta.title || 'ホーム');
const showBreadcrumb = computed(() => route.name !== 'Dashboard');

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.app-header {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px 0 12px;
  background: var(--app-surface-solid);
  border-bottom: 1px solid var(--app-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  color: var(--app-text-secondary);
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--app-text-secondary);
  letter-spacing: 0.04em;
}

.page-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--app-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--app-fill);
  border: 1px solid var(--app-border);
}

.logout-btn {
  color: var(--app-accent) !important;
  font-weight: 600;
}
</style>
