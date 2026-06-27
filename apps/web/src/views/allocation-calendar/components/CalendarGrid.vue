<template>
  <div class="dorm-card">
    <header class="dorm-card__head">
      <h3 class="dorm-card__title">{{ dorm.dormName }}</h3>
      <p class="dorm-card__meta">{{ dorm.rows.length }} 件 · 在室 {{ activeCount }} · 退寮済 {{ endedCount }}</p>
    </header>
    <div class="table-wrap">
      <table class="calendar-table">
        <thead>
          <tr>
            <th class="col-sticky col-room">部屋</th>
            <th class="col-sticky col-name">氏名</th>
            <th class="col-sticky col-status">状態</th>
            <th class="col-sticky col-period">期間</th>
            <th v-for="d in daysInMonth" :key="d" class="col-day" :class="{ 'col-day--weekend': isWeekend(d) }">{{ d }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in dorm.rows" :key="`${row.roomId}-${row.employeeId}`" :class="rowClass(row)">
            <td class="col-sticky col-room">{{ row.roomName }}<span v-if="row.isLeader" class="leader">★</span></td>
            <td class="col-sticky col-name">
              <span class="emp">{{ row.employeeName }}</span>
              <span v-if="row.department" class="dept">{{ row.department }}</span>
            </td>
            <td class="col-sticky col-status">
              <span class="pill" :class="`pill--${row.occupancyStatus || 'ACTIVE'}`">{{ statusLabel(row) }}</span>
            </td>
            <td class="col-sticky col-period">{{ periodLabel(row) }}</td>
            <td
              v-for="d in daysInMonth"
              :key="d"
              :class="cellClass(row, d, isWeekend(d))"
              :title="cellTitle(row, d)"
            />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  dorm: { type: Object, required: true },
  daysInMonth: { type: Number, required: true },
  yearMonth: { type: String, default: '' },
  cellClass: { type: Function, required: true },
  conflictTooltip: { type: Function, required: true },
});

const activeCount = computed(() => (props.dorm.rows || []).filter((r) => r.occupancyStatus !== 'ENDED').length);
const endedCount = computed(() => (props.dorm.rows || []).filter((r) => r.occupancyStatus === 'ENDED').length);

function isWeekend(day) {
  if (!props.yearMonth) return false;
  const [y, m] = props.yearMonth.split('-').map(Number);
  const dow = new Date(y, m - 1, day).getDay();
  return dow === 0 || dow === 6;
}

function statusLabel(row) {
  if (row.occupancyStatus === 'ENDED') return '退寮済';
  if (row.occupancyStatus === 'MOVE_OUT_TODAY') return '今日退寮';
  return '在室';
}

function periodLabel(row) {
  const fmt = (iso) => {
    if (!iso) return '—';
    const [, m, d] = iso.split('-');
    return `${Number(m)}/${Number(d)}`;
  };
  return row.moveOutDate ? `${fmt(row.moveInDate)}〜${fmt(row.moveOutDate)}` : `${fmt(row.moveInDate)}〜`;
}

function rowClass(row) {
  if (row.occupancyStatus === 'ENDED') return 'row-ended';
  if (row.occupancyStatus === 'MOVE_OUT_TODAY') return 'row-today';
  return '';
}

function cellTitle(row, day) {
  const c = props.conflictTooltip(row, day);
  if (c) return c;
  if (row.occupiedDays?.includes(day)) return row.moveOutDate && row.occupiedDays.at(-1) === day ? `退寮日 ${row.moveOutDate}` : '在室';
  return undefined;
}
</script>

<style scoped>
.dorm-card { margin-bottom: 20px; border: 1px solid var(--app-border-light); border-radius: 14px; overflow: hidden; background: #fff; }
.dorm-card__head { padding: 14px 18px; border-bottom: 1px solid var(--app-border-light); background: #f8fafc; }
.dorm-card__title { margin: 0; font-size: 15px; font-weight: 700; }
.dorm-card__meta { margin: 4px 0 0; font-size: 12px; color: var(--app-text-secondary); }
.table-wrap { overflow-x: auto; }
.calendar-table { border-collapse: separate; border-spacing: 0; font-size: 12px; width: 100%; min-width: 860px; }
.calendar-table th, .calendar-table td { border-bottom: 1px solid #eef2f6; border-right: 1px solid #eef2f6; padding: 0; text-align: center; }
.calendar-table thead th { background: #f1f5f9; padding: 8px 4px; font-size: 11px; font-weight: 600; }
.col-sticky { position: sticky; z-index: 1; background: #fff; text-align: left; padding: 10px 12px !important; white-space: nowrap; }
.col-room { left: 0; min-width: 88px; }
.col-name { left: 88px; min-width: 120px; }
.col-status { left: 208px; min-width: 88px; }
.col-period { left: 296px; min-width: 88px; font-size: 11px; color: #64748b; }
.col-day { min-width: 24px; height: 36px; }
.col-day--weekend { background: #fafafa; }
.leader { margin-left: 4px; color: #d97706; }
.emp { display: block; font-weight: 600; }
.dept { display: block; font-size: 11px; color: #94a3b8; }
.pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.pill--ACTIVE { background: #ccfbf1; color: #0f766e; }
.pill--MOVE_OUT_TODAY { background: #fef3c7; color: #b45309; }
.pill--ENDED { background: #f1f5f9; color: #64748b; }
.row-ended { opacity: 0.72; }
.row-ended .col-sticky { background: #fafafa; }
.row-today .col-sticky { background: #fffbeb; }
</style>
