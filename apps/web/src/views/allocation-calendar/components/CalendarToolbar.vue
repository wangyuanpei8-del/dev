<template>
  <div class="calendar-toolbar">
    <el-form :inline="true" @submit.prevent="$emit('search')">
      <el-form-item label="地域">
        <el-select v-model="filters.location" clearable placeholder="すべて" style="width: 140px" @change="$emit('search')">
          <el-option v-for="(label, key) in LocationLabels" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="対象月">
        <el-button @click="$emit('prev-month')">前月</el-button>
        <span class="year-month">{{ filters.yearMonth }}</span>
        <el-button @click="$emit('next-month')">翌月</el-button>
      </el-form-item>
      <el-form-item label="氏名">
        <el-input v-model="filters.q" clearable placeholder="部分一致" style="width: 160px" @keyup.enter="$emit('search')" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="$emit('search')">検索</el-button>
      </el-form-item>
    </el-form>
    <div class="toolbar-actions">
      <el-select v-model="filters.paperSize" style="width: 88px" class="no-print">
        <el-option label="A4" value="A4" />
        <el-option label="A3" value="A3" />
      </el-select>
      <el-button v-permission="'occupancy:read'" class="no-print" @click="$emit('export-csv')">ＣＳＶ出力</el-button>
      <el-button v-permission="'occupancy:read'" type="primary" class="no-print" @click="$emit('print')">印刷</el-button>
    </div>
  </div>
</template>

<script setup>
import { LocationLabels } from '@/constants/enums';

defineProps({
  filters: { type: Object, required: true },
});

defineEmits(['search', 'prev-month', 'next-month', 'export-csv', 'print']);
</script>

<style scoped>
.calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.year-month {
  display: inline-block;
  min-width: 88px;
  text-align: center;
  font-weight: 600;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
