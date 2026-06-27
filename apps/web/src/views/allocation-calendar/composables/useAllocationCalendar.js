import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import * as calendarApi from '@/api/calendar';
import { currentYearMonth, shiftYearMonth } from '@/utils/date';

export function useAllocationCalendar() {
  const loading = ref(false);
  const error = ref('');
  const calendar = ref(null);
  const warningDays = ref(14);

  const filters = reactive({
    yearMonth: currentYearMonth(),
    location: '',
    q: '',
    sort: 'dormNameAsc',
    paperSize: 'A4',
  });

  const daysInMonth = computed(() => calendar.value?.daysInMonth || 0);
  const items = computed(() => calendar.value?.items || []);

  async function loadWarningDays() {
    try {
      const res = await calendarApi.fetchMoveOutWarningDays();
      warningDays.value = res?.days ?? 14;
    } catch {
      warningDays.value = 14;
    }
  }

  async function loadCalendar() {
    loading.value = true;
    error.value = '';
    try {
      const params = {
        yearMonth: filters.yearMonth,
        sort: filters.sort,
      };
      if (filters.location) params.location = filters.location;
      if (filters.q?.trim()) params.q = filters.q.trim();
      calendar.value = await calendarApi.fetchCalendar(params);
    } catch (e) {
      error.value = e?.message || 'データの取得に失敗しました';
      calendar.value = null;
    } finally {
      loading.value = false;
    }
  }

  function prevMonth() {
    filters.yearMonth = shiftYearMonth(filters.yearMonth, -1);
    loadCalendar();
  }

  function nextMonth() {
    filters.yearMonth = shiftYearMonth(filters.yearMonth, 1);
    loadCalendar();
  }

  async function exportCsv() {
    try {
      const params = { yearMonth: filters.yearMonth, sort: filters.sort };
      if (filters.location) params.location = filters.location;
      if (filters.q?.trim()) params.q = filters.q.trim();
      await calendarApi.exportCalendarCsv(params);
      ElMessage.success('ＣＳＶをダウンロードしました');
    } catch {
      ElMessage.error('ＣＳＶの出力に失敗しました');
    }
  }

  function cellClass(row, day, isWeekend = false) {
    const conflict = row.conflicts?.some((c) => c.day === day);
    const occupied = row.occupiedDays?.includes(day);
    const classes = [];
    if (isWeekend && !occupied && !conflict) classes.push('cell-weekend');
    if (conflict) return [...classes, 'cell-conflict'].join(' ');
    if (occupied) {
      const last = row.occupiedDays?.[row.occupiedDays.length - 1];
      if (row.occupancyStatus === 'ENDED') classes.push('cell-occupied-ended');
      else if (last === day && row.moveOutDate) classes.push('cell-move-out-day');
      else classes.push('cell-occupied');
    }
    return classes.join(' ');
  }

  function conflictTooltip(row, day) {
    return row.conflicts
      ?.filter((c) => c.day === day)
      .map((c) => c.message)
      .join('\n');
  }

  return {
    loading,
    error,
    calendar,
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
  };
}
