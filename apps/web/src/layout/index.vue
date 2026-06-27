<template>
  <div class="app-layout">
    <div
      v-if="appStore.mobileSidebarOpen"
      class="sidebar-backdrop"
      aria-hidden="true"
      @click="appStore.closeMobileSidebar()"
    />
    <Sidebar />
    <div class="app-main">
      <Header />
      <main class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import { useAppStore } from '@/store/app';

const appStore = useAppStore();
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--app-bg);
}

.sidebar-backdrop {
  display: none;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-content {
  flex: 1;
  padding: 24px 28px 36px;
  overflow: auto;
  background: var(--app-bg-mesh);
  background-color: var(--app-bg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(15, 23, 42, 0.45);
  }
}
</style>
