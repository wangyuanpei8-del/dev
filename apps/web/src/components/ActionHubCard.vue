<template>
  <router-link :to="to" class="hub-card" :class="`hub-card--${tone || 'default'}`">
    <span class="hub-card__icon" aria-hidden="true">
      <el-icon :size="28"><component :is="icon" /></el-icon>
    </span>
    <span class="hub-card__title">{{ title }}</span>
    <span class="hub-card__desc">{{ description }}</span>
    <span v-if="badge != null && badge !== ''" class="hub-card__badge">{{ badge }}</span>
  </router-link>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: [Object, Function], required: true },
  to: { type: String, required: true },
  tone: { type: String, default: 'default' },
  badge: { type: [String, Number], default: null },
});
</script>

<style scoped>
.hub-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 20px;
  border-radius: 16px;
  border: 1px solid var(--app-border-light);
  background: #fff;
  text-decoration: none;
  color: var(--app-text);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  position: relative;
}
.hub-card:hover {
  border-color: var(--app-accent);
  box-shadow: var(--app-shadow-md);
  transform: translateY(-2px);
}
.hub-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.hub-card--enter .hub-card__icon { background: linear-gradient(135deg, #14b8a6, #0891b2); }
.hub-card--exit .hub-card__icon { background: linear-gradient(135deg, #a78bfa, #6366f1); }
.hub-card--history .hub-card__icon { background: linear-gradient(135deg, #64748b, #475569); }
.hub-card--default .hub-card__icon { background: linear-gradient(135deg, #06b6d4, #0891b2); }
.hub-card__title { font-size: 17px; font-weight: 700; }
.hub-card__desc { font-size: 13px; line-height: 1.5; color: var(--app-text-secondary); }
.hub-card__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--app-fill);
  color: var(--app-accent);
}
</style>
