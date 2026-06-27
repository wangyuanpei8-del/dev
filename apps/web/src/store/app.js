import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false);
  const mobileSidebarOpen = ref(false);

  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      mobileSidebarOpen.value = !mobileSidebarOpen.value;
      return;
    }
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function closeMobileSidebar() {
    mobileSidebarOpen.value = false;
  }

  return { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, closeMobileSidebar };
});
