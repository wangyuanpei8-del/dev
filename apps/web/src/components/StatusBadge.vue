<template>
  <span class="status-badge" :class="[`status-badge--${resolvedVariant}`, `status-badge--${resolvedStatus}`]">
    {{ displayLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const PRESETS = {
  OCCUPIED: { label: '在室', variant: 'success' },
  VACANT: { label: '空室', variant: 'neutral' },
  MOVED_OUT: { label: '退寮済', variant: 'neutral' },
  ACTIVE: { label: '在室', variant: 'success' },
  ENDED: { label: '退寮済', variant: 'neutral' },
  MOVE_OUT_TODAY: { label: '今日退寮', variant: 'warning' },
  DRAFT: { label: '下書き', variant: 'warning' },
  CONFIRMED: { label: '確定済', variant: 'success' },
  DELETED: { label: '削除済', variant: 'danger' },
  LONG_TERM: { label: '長期利用', variant: 'danger' },
  RESERVED: { label: '予約', variant: 'info' },
};

const props = defineProps({
  status: { type: String, default: '' },
  label: { type: String, default: '' },
  variant: { type: String, default: '' },
});

const preset = computed(() => PRESETS[props.status] || null);
const resolvedVariant = computed(() => props.variant || preset.value?.variant || 'neutral');
const resolvedStatus = computed(() => (props.status || 'custom').toLowerCase());
const displayLabel = computed(() => props.label || preset.value?.label || props.status || '—');
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}
.status-badge--success { background: #ccfbf1; color: #0f766e; }
.status-badge--warning { background: #fef3c7; color: #b45309; }
.status-badge--danger { background: #fee2e2; color: #b91c1c; }
.status-badge--info { background: #dbeafe; color: #1d4ed8; }
.status-badge--neutral { background: #f1f5f9; color: #64748b; }
</style>
