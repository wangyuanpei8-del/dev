<template>
  <div class="page-container">
    <PageHeader title="操作ログ" subtitle="監査ログ（読み取り専用）" />

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-form :inline="true" :model="filters" class="filter-bar">
        <el-form-item label="対象">
          <el-input v-model="filters.entityType" clearable placeholder="entityType" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="期間">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="開始"
            end-placeholder="終了"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">検索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" stripe @row-click="openDrawer">
        <el-table-column label="日時" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt || row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">{{ AuditActionLabels[row.action] || row.action }}</template>
        </el-table-column>
        <el-table-column prop="entityType" label="対象" width="120" />
        <el-table-column prop="entityId" label="ID" width="280" show-overflow-tooltip />
        <el-table-column label="ユーザー" min-width="120">
          <template #default="{ row }">{{ row.userDisplayName || row.user_display_name || '—' }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="ログデータがありません" />
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="total" @change="fetchList" />
    </div>

    <el-drawer v-model="drawerVisible" title="ログ詳細" size="520px">
      <AuditChangePanel :before="selected.before" :after="selected.after" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import AuditChangePanel from '@/components/AuditChangePanel.vue';
import { getAuditLogs } from '@/api/audit';
import { AuditActionLabels } from '@/constants/enums';
import { formatDateTime } from '@/utils/date';

const loading = ref(false);
const loadError = ref('');
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const dateRange = ref([]);
const drawerVisible = ref(false);
const selected = ref({ before: null, after: null });
const filters = reactive({ entityType: '', fromDate: '', toDate: '' });

function onDateChange(val) {
  filters.fromDate = val?.[0] || '';
  filters.toDate = val?.[1] || '';
  fetchList();
}

function openDrawer(row) {
  selected.value = {
    before: row.beforeJson || row.before_json || row.before,
    after: row.afterJson || row.after_json || row.after,
  };
  drawerVisible.value = true;
}

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await getAuditLogs({ ...filters, page: page.value, pageSize: pageSize.value });
    list.value = res?.items || [];
    total.value = res?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
    loadError.value = 'ログデータの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchList);
</script>

<style scoped>
</style>
