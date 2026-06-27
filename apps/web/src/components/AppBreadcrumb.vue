<template>
  <el-breadcrumb v-if="items.length" separator="/" class="app-breadcrumb">
    <el-breadcrumb-item v-for="(item, i) in items" :key="item.path + i">
      <router-link v-if="i < items.length - 1" :to="item.path">{{ item.title }}</router-link>
      <span v-else>{{ item.title }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { buildBreadcrumbs } from '@/router/breadcrumbs';

const route = useRoute();
const items = computed(() => buildBreadcrumbs(route));
</script>

<style scoped>
.app-breadcrumb :deep(.el-breadcrumb__inner a) {
  color: var(--app-text-secondary);
  font-weight: 500;
}
.app-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--app-text);
  font-weight: 600;
}
</style>
