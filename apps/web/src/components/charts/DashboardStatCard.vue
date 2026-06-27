<template>
  <div class="stat-card" :class="`stat-card--${accent}`">
    <div class="stat-card__top">
      <span class="stat-card__icon">
        <el-icon :size="20"><component :is="icon" /></el-icon>
      </span>
      <span v-if="hint" class="stat-card__badge">{{ hint }}</span>
    </div>
    <span class="stat-card__label">{{ label }}</span>
    <span class="stat-card__value">{{ displayValue }}</span>
    <span v-if="sub" class="stat-card__sub">{{ sub }}</span>
    <svg v-if="sparkline.length" class="stat-card__spark" viewBox="0 0 100 24" preserveAspectRatio="none">
      <polyline :points="sparkPoints" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: '—' },
  hint: { type: String, default: '' },
  sub: { type: String, default: '' },
  accent: { type: String, default: 'cyan' },
  icon: { type: String, default: 'Odometer' },
  sparkline: { type: Array, default: () => [] },
});

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') return '—';
  return props.value;
});

const sparkPoints = computed(() => {
  const data = props.sparkline;
  if (!data.length) return '';
  const max = Math.max(...data, 1);
  return data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100;
      const y = 24 - (v / max) * 20 - 2;
      return `${x},${y}`;
    })
    .join(' ');
});
</script>

<style scoped>
.stat-card {
  position: relative;
  overflow: hidden;
  padding: 20px 22px 18px;
  border-radius: var(--app-radius-lg);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-shadow-md);
}

.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
}

.stat-card--cyan::before { background: linear-gradient(180deg, #06b6d4, #0891b2); }
.stat-card--violet::before { background: linear-gradient(180deg, #818cf8, #6366f1); }
.stat-card--amber::before { background: linear-gradient(180deg, #fbbf24, #f59e0b); }
.stat-card--rose::before { background: linear-gradient(180deg, #fb7185, #f43f5e); }

.stat-card--cyan { color: var(--dash-cyan); }
.stat-card--violet { color: var(--dash-violet); }
.stat-card--amber { color: var(--dash-amber); }
.stat-card--rose { color: var(--dash-rose); }

.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: currentColor;
  color: #fff;
  opacity: 0.92;
  box-shadow: 0 4px 14px color-mix(in srgb, currentColor 35%, transparent);
}

.stat-card__badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(244, 63, 94, 0.12);
  color: #e11d48;
}

.stat-card__label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-secondary);
  margin-bottom: 4px;
}

.stat-card__value {
  display: block;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--app-text);
  line-height: 1.1;
}

.stat-card__sub {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.stat-card__spark {
  position: absolute;
  right: 16px;
  bottom: 14px;
  width: 88px;
  height: 24px;
  opacity: 0.45;
}
</style>
