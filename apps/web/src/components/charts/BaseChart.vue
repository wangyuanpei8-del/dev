<template>
  <div ref="elRef" class="base-chart" :style="{ height }" />
</template>

<script setup>
import { computed, toRef } from 'vue';
import { useEChart } from './useEChart';

const props = defineProps({
  option: { type: Object, default: () => ({}) },
  height: { type: String, default: '280px' },
});

const { elRef } = useEChart(toRef(props, 'option'));
</script>

<style scoped>
.base-chart {
  width: 100%;
  min-height: 120px;
}
</style>
