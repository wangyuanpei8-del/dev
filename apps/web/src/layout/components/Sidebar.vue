<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: appStore.sidebarCollapsed && !appStore.mobileSidebarOpen,
      'mobile-open': appStore.mobileSidebarOpen,
    }"
  >
    <div class="sidebar-brand">
      <LoginBrandMark class="brand-mark" :compact="appStore.sidebarCollapsed && !appStore.mobileSidebarOpen" />
      <span v-if="!appStore.sidebarCollapsed || appStore.mobileSidebarOpen" class="brand-text">社員寮管理</span>
    </div>
    <nav class="sidebar-nav">
      <div v-for="group in visibleGroups" :key="group.label" class="menu-group">
        <p v-if="!appStore.sidebarCollapsed || appStore.mobileSidebarOpen" class="menu-group__label">{{ group.label }}</p>
        <el-menu
          :default-active="activePath"
          :collapse="appStore.sidebarCollapsed && !appStore.mobileSidebarOpen"
          router
          class="sidebar-menu"
          @select="onMenuSelect"
        >
          <el-menu-item
            v-for="item in group.items"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </el-menu>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import LoginBrandMark from '@/components/LoginBrandMark.vue';
import { useUserStore } from '@/store/user';
import { useAppStore } from '@/store/app';
import { menuGroups } from '@/router/menus';

const route = useRoute();
const userStore = useUserStore();
const appStore = useAppStore();

const activePath = computed(() => {
  if (route.path.startsWith('/employees/') && route.path !== '/employees') return '/employees';
  if (route.path.startsWith('/dorms/') && route.path !== '/dorms') return '/dorms';
  if (route.path.startsWith('/occupancy/')) return '/occupancy';
  if (route.path.startsWith('/fees/')) return '/fees';
  return route.path;
});

function canSee(item) {
  if (item.role) return userStore.hasRole(item.role);
  if (item.permission) return userStore.hasPermission(item.permission);
  return true;
}

const visibleGroups = computed(() =>
  menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(canSee),
    }))
    .filter((group) => group.items.length),
);

function onMenuSelect() {
  appStore.closeMobileSidebar();
}
</script>

<style scoped>
.sidebar {
  width: var(--app-sidebar-width);
  flex-shrink: 0;
  background: var(--app-sidebar);
  border-right: 1px solid var(--app-sidebar-border);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, transform 0.25s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-brand {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid var(--app-sidebar-border);
}

.brand-mark {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.brand-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--app-sidebar-text-active);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0 16px;
}

.menu-group {
  margin-bottom: 8px;
}

.menu-group__label {
  margin: 0;
  padding: 8px 24px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--app-sidebar-muted);
  text-transform: uppercase;
}

.sidebar-menu {
  padding: 0 12px;
  border: none !important;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: 10px;
  margin-bottom: 2px;
  height: 40px;
  color: var(--app-sidebar-text);
  font-weight: 500;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: var(--app-sidebar-active) !important;
  color: var(--app-accent) !important;
  font-weight: 600;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: var(--app-sidebar-hover);
  color: var(--app-sidebar-text-active);
}

.sidebar-menu :deep(.el-icon) {
  color: inherit;
}

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    width: min(280px, 85vw);
    transform: translateX(-100%);
    box-shadow: 8px 0 32px rgba(0, 0, 0, 0.12);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: min(280px, 85vw);
  }
}
</style>
