<template>
  <div class="kpi-card">
    <span class="kpi-card__label">{{ label }}</span>
    <span class="kpi-card__value">{{ displayValue }}</span>
    <span v-if="hint" class="kpi-card__hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: '—' },
  hint: { type: String, default: '' },
});

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') return '—';
  return props.value;
});
</script>

<style scoped>
.kpi-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: var(--app-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  box-shadow: var(--app-shadow-md);
}

.kpi-card__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-secondary);
  letter-spacing: -0.01em;
}

.kpi-card__value {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.04em;
  color: var(--app-text);
  line-height: 1.1;
}

.kpi-card__hint {
  font-size: 12px;
  color: var(--app-text-secondary);
}
</style>
