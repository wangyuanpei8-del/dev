<template>
  <div class="page-header">
    <div class="page-header__text">
      <h2 v-if="title" class="page-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.page-header__title {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--app-text);
}

.page-header__subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.page-header__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
</style>
