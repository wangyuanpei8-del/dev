<template>
  <div class="page-container allocation-calendar-page">
    <PageHeader title="寮割カレンダー" subtitle="月次の在室状況・重複・退寮予定">
      <template #actions>
        <el-tag type="info" class="no-print">退寮警告：{{ warningDays }} 日前</el-tag>
      </template>
    </PageHeader>

    <div class="page-card screen-only">
      <CalendarToolbar
        :filters="filters"
        @search="loadCalendar"
        @prev-month="prevMonth"
        @next-month="nextMonth"
        @export-csv="exportCsv"
        @print="handlePrint"
      />

      <div v-if="items.length" class="calendar-legend no-print">
        <span><i class="swatch swatch--active" />在室</span>
        <span><i class="swatch swatch--move-out" />退寮日</span>
        <span><i class="swatch swatch--ended" />退寮済</span>
        <span><i class="swatch swatch--conflict" />重複</span>
      </div>

      <div v-loading="loading">
        <el-alert v-if="error" type="error" :title="error" show-icon class="mb-16">
          <el-button type="primary" link @click="loadCalendar">再試行</el-button>
        </el-alert>

        <el-empty v-if="!loading && !error && !items.length" description="該当するデータがありません" />

        <CalendarGrid
          v-for="dorm in items"
          :key="dorm.dormId"
          :dorm="dorm"
          :days-in-month="daysInMonth"
          :year-month="filters.yearMonth"
          :cell-class="cellClass"
          :conflict-tooltip="conflictTooltip"
        />
      </div>
    </div>

    <PrintLayout
      :items="items"
      :days-in-month="daysInMonth"
      :year-month="filters.yearMonth"
      :paper-size="filters.paperSize"
      :warning-days="warningDays"
      :cell-class="cellClass"
      :conflict-tooltip="conflictTooltip"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import CalendarToolbar from './components/CalendarToolbar.vue';
import CalendarGrid from './components/CalendarGrid.vue';
import PrintLayout from './components/PrintLayout.vue';
import { useAllocationCalendar } from './composables/useAllocationCalendar';

const {
  loading,
  error,
  warningDays,
  filters,
  daysInMonth,
  items,
  loadWarningDays,
  loadCalendar,
  prevMonth,
  nextMonth,
  exportCsv,
  cellClass,
  conflictTooltip,
} = useAllocationCalendar();

function handlePrint() {
  document.documentElement.setAttribute('data-print-paper', filters.paperSize);
  window.print();
  document.documentElement.removeAttribute('data-print-paper');
}

onMounted(async () => {
  await loadWarningDays();
  await loadCalendar();
});
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.calendar-legend {
  display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; padding: 10px 14px;
  background: #f8fafc; border-radius: 10px; font-size: 12px; color: #64748b;
}
.swatch {
  display: inline-block; width: 14px; height: 14px; margin-right: 6px; border-radius: 3px; vertical-align: middle;
}
.swatch--active { background: linear-gradient(180deg, #5eead4, #14b8a6); }
.swatch--move-out { background: linear-gradient(180deg, #fde68a, #f59e0b); }
.swatch--ended { background: #e2e8f0; }
.swatch--conflict { background: #fecaca; }
@media print {
  .screen-only,
  .no-print,
  :deep(.layout-sidebar),
  :deep(.layout-header) {
    display: none !important;
  }
  .allocation-calendar-page {
    padding: 0;
  }
  :deep(.page-card) {
    box-shadow: none;
    border: none;
  }
}
</style>

<style>
.allocation-calendar-page .cell-occupied { background: linear-gradient(180deg, #99f6e4, #2dd4bf); }
.allocation-calendar-page .cell-occupied-ended { background: #e2e8f0; }
.allocation-calendar-page .cell-move-out-day { background: linear-gradient(180deg, #fde68a, #fbbf24); }
.allocation-calendar-page .cell-conflict { background: #fca5a5; }
.allocation-calendar-page .cell-weekend { background: #f8fafc; }
@media print {
  @page {
    size: landscape;
    margin: 10mm;
  }
  html[data-print-paper='A4'] @page {
    size: A4 landscape;
  }
  html[data-print-paper='A3'] @page {
    size: A3 landscape;
  }
}
</style>
