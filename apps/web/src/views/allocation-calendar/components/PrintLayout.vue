<template>
  <div class="print-root" :class="paperSizeClass">
    <div v-for="dorm in items" :key="dorm.dormId" class="print-dorm-page">
      <header class="print-header">
        <h2>{{ dorm.dormName }}</h2>
        <p>対象月：{{ yearMonth }}　印刷日：{{ printDate }}</p>
      </header>
      <CalendarGrid
        :dorm="dorm"
        :days-in-month="daysInMonth"
        :year-month="yearMonth"
        :cell-class="cellClass"
        :conflict-tooltip="conflictTooltip"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { todayISO } from '@/utils/date';
import CalendarGrid from './CalendarGrid.vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  daysInMonth: { type: Number, default: 0 },
  yearMonth: { type: String, default: '' },
  paperSize: { type: String, default: 'A4' },
  warningDays: { type: Number, default: 14 },
  cellClass: { type: Function, required: true },
  conflictTooltip: { type: Function, required: true },
});

const printDate = todayISO();
const paperSizeClass = computed(() => `paper-${props.paperSize.toLowerCase()}`);
</script>

<style scoped>
.print-root {
  display: none;
}
@media print {
  .print-root {
    display: block;
  }
  .print-dorm-page {
    page-break-after: always;
  }
  .paper-a4 {
    size: A4 landscape;
  }
  .paper-a3 {
    size: A3 landscape;
  }
}
</style>
