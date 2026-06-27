<template>
  <div class="page-container">
    <PageHeader title="長期利用" subtitle="長期利用警告一覧" />

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-table :data="list" stripe>
        <el-table-column type="index" label="#" width="56" />
        <el-table-column label="社員" min-width="140">
          <template #default="{ row }">{{ row.employeeName || row.fullName || row.employee?.fullName }}</template>
        </el-table-column>
        <el-table-column label="初回利用日" width="120">
          <template #default="{ row }">{{ formatDate(row.firstDormUseDate) }}</template>
        </el-table-column>
        <el-table-column label="寮・部屋" min-width="160">
          <template #default="{ row }">{{ row.dormName }} / {{ row.roomName }}</template>
        </el-table-column>
        <el-table-column label="入居日" width="120">
          <template #default="{ row }">{{ formatDate(row.moveInDate || row.move_in_date) }}</template>
        </el-table-column>
        <el-table-column label="利用日数" width="100">
          <template #default="{ row }">{{ row.daysOccupied ?? row.days_occupied ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="警告" width="100">
          <template #default>
            <span class="status-badge status-badge--warning">要確認</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="警告対象はありません" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import { getLongTermWarnings } from '@/api/occupancy';
import { formatDate } from '@/utils/date';

const loading = ref(false);
const loadError = ref('');
const list = ref([]);

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await getLongTermWarnings();
    list.value = res?.items || res || [];
  } catch {
    list.value = [];
    loadError.value = '長期利用データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchList);
</script>
