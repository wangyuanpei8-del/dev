<template>
  <div class="page-container">
    <PageHeader title="入退寮履歴" subtitle="検索・CSV 出力">
      <template #actions>
        <el-button @click="$router.push('/occupancy')">戻る</el-button>
        <el-button plain @click="handleExport" :loading="exporting">ＣＳＶ出力</el-button>
        <router-link v-permission="'occupancy:read'" to="/occupancy/long-term">
          <el-button plain>長期利用警告</el-button>
        </router-link>
      </template>
    </PageHeader>

    <el-alert
      v-if="filters.inconsistentOnly"
      type="warning"
      title="削除済み社員の在室履歴が含まれています。データ不整合の可能性があります。"
      show-icon
      :closable="false"
      class="inconsistent-alert"
    />

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-form :inline="true" :model="filters" class="filter-bar">
        <el-form-item label="社員">
          <el-input v-model="filters.q" placeholder="氏名" clearable @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="寮">
          <el-select v-model="filters.dormId" clearable filterable placeholder="すべて" style="width: 180px" @change="fetchList">
            <el-option v-for="d in dorms" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状態">
          <el-select v-model="filters.occupancyStatus" clearable placeholder="すべて" style="width: 140px" @change="fetchList">
            <el-option label="在室" value="active" />
            <el-option label="退寮済" value="moved_out" />
          </el-select>
        </el-form-item>
        <el-form-item label="入居日">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="開始"
            end-placeholder="終了"
            style="width: 260px"
            @change="onDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="filters.inconsistentOnly" @change="fetchList">不整合のみ</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">検索</el-button>
          <el-button @click="resetFilters">リセット</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" stripe>
        <el-table-column type="index" label="#" width="56" />
        <el-table-column label="社員" min-width="160">
          <template #default="{ row }">
            <router-link v-if="row.employeeId && !row.employeeDeleted" :to="`/employees/${row.employeeId}`" class="emp-link">
              {{ row.employeeName || row.employee?.fullName || '—' }}
            </router-link>
            <span v-else>{{ row.employeeName || '—' }}</span>
            <StatusBadge v-if="row.employeeDeleted" status="DELETED" class="emp-badge" />
          </template>
        </el-table-column>
        <el-table-column label="寮・部屋" min-width="160">
          <template #default="{ row }">
            {{ row.dormName || row.room?.dorm?.name }} / {{ row.roomName || row.room?.name }}
          </template>
        </el-table-column>
        <el-table-column label="状態" width="100">
          <template #default="{ row }">
            <StatusBadge :status="occupancyStatusKey(row)" />
          </template>
        </el-table-column>
        <el-table-column label="入居日" width="120">
          <template #default="{ row }">{{ formatDate(row.moveInDate || row.move_in_date) }}</template>
        </el-table-column>
        <el-table-column label="退寮日" width="120">
          <template #default="{ row }">{{ formatDate(row.moveOutDate || row.move_out_date) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <router-link
              v-if="isOpenOccupancy(row)"
              v-permission="'occupancy:write'"
              :to="`/occupancy/${row.id}/move-out`"
            >
              <el-button link type="primary">退寮</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="履歴データがありません" />
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="total" @change="fetchList" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import * as api from '@/api/occupancy';
import { getDorms } from '@/api/dorms';
import { exportOccupancyHistories } from '@/api/export';
import { formatDate } from '@/utils/date';
import { isOpenOccupancy, occupancyStatusKey } from '@/utils/occupancy';

const route = useRoute();
const loading = ref(false);
const loadError = ref('');
const exporting = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const dorms = ref([]);
const dateRange = ref(null);
const filters = reactive({
  q: '',
  dormId: '',
  occupancyStatus: '',
  fromDate: '',
  toDate: '',
  inconsistentOnly: route.query.inconsistent === '1' || route.query.inconsistentOnly === '1',
});

function onDateRangeChange(val) {
  filters.fromDate = val?.[0] || '';
  filters.toDate = val?.[1] || '';
  fetchList();
}

function resetFilters() {
  filters.q = '';
  filters.dormId = '';
  filters.occupancyStatus = '';
  filters.fromDate = '';
  filters.toDate = '';
  filters.inconsistentOnly = false;
  dateRange.value = null;
  page.value = 1;
  fetchList();
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportOccupancyHistories({
      q: filters.q || undefined,
      dormId: filters.dormId || undefined,
      occupancyStatus: filters.occupancyStatus || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      inconsistentOnly: filters.inconsistentOnly || undefined,
    });
  } finally {
    exporting.value = false;
  }
}

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await api.getOccupancyHistories({
      q: filters.q || undefined,
      dormId: filters.dormId || undefined,
      occupancyStatus: filters.occupancyStatus || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      inconsistentOnly: filters.inconsistentOnly ? '1' : undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
    list.value = res?.items || [];
    total.value = res?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
    loadError.value = '履歴データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const res = await getDorms({ page: 1, pageSize: 200 });
    dorms.value = res?.items || [];
  } catch {
    dorms.value = [];
  }
  fetchList();
});
</script>

<style scoped>
.inconsistent-alert {
  margin-bottom: 16px;
}
.emp-link {
  color: var(--app-accent);
  font-weight: 600;
  text-decoration: none;
}
.emp-badge {
  margin-left: 8px;
}
</style>
