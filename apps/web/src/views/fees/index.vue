<template>
  <div class="page-container">
    <PageHeader title="寮費" subtitle="寮費一覧・確定">
      <template #actions>
        <router-link v-permission="'fees:write'" to="/fees/calculate">
          <el-button type="primary">算定</el-button>
        </router-link>
        <router-link v-permission="'fee-rates:write'" to="/fees/rates">
          <el-button plain>料率</el-button>
        </router-link>
        <el-button plain @click="handleExport" :loading="exporting">ＣＳＶ出力</el-button>
      </template>
    </PageHeader>

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-form :inline="true" :model="filters" class="filter-bar">
        <el-form-item label="年月">
          <el-input v-model="filters.yearMonth" placeholder="YYYY-MM" clearable @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="状態">
          <el-select v-model="filters.status" clearable @change="fetchList">
            <el-option v-for="(label, key) in FeeStatusLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">検索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" stripe>
        <el-table-column label="社員" min-width="140">
          <template #default="{ row }">{{ row.employeeName || row.employee?.fullName }}</template>
        </el-table-column>
        <el-table-column prop="yearMonth" label="年月" width="100">
          <template #default="{ row }">{{ row.yearMonth || row.year_month }}</template>
        </el-table-column>
        <el-table-column label="金額" width="120">
          <template #default="{ row }">{{ formatAmount(row.totalAmount ?? row.total_amount) }}</template>
        </el-table-column>
        <el-table-column label="状態" width="100">
          <template #default="{ row }">
            <span :class="row.status === 'CONFIRMED' ? 'status-badge status-badge--success' : 'status-badge status-badge--neutral'">
              {{ FeeStatusLabels[row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showBasis(row)">内訳</el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              v-permission="'fees:confirm'"
              link
              type="primary"
              @click="handleConfirm(row)"
            >確定</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="寮費データがありません" />
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="total" @change="fetchList" />
    </div>

    <el-drawer v-model="drawerVisible" title="算定根拠（内訳）" size="480px">
      <FeeBasisPanel :basis="selectedBasis" :fee-context="selectedFee" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import FeeBasisPanel from '@/components/FeeBasisPanel.vue';
import * as api from '@/api/fees';
import { exportDormFees } from '@/api/export';
import { FeeStatusLabels } from '@/constants/enums';

const loading = ref(false);
const loadError = ref('');
const exporting = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const drawerVisible = ref(false);
const selectedBasis = ref(null);
const selectedFee = ref({});
const filters = reactive({ yearMonth: '', status: '' });

function formatAmount(v) {
  if (v == null) return '—';
  return `¥${Number(v).toLocaleString('ja-JP')}`;
}

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await api.getDormFees({ ...filters, page: page.value, pageSize: pageSize.value });
    list.value = res?.items || [];
    total.value = res?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
    loadError.value = '寮費データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

function showBasis(row) {
  selectedBasis.value = row.calculationBasis || row.calculation_basis;
  selectedFee.value = {
    employeeName: row.employeeName || row.employee?.fullName,
    yearMonth: row.yearMonth || row.year_month,
    totalAmount: row.totalAmount ?? row.total_amount,
  };
  drawerVisible.value = true;
}

async function handleConfirm(row) {
  await ElMessageBox.confirm('この寮費を確定しますか？', '確認', { type: 'warning' });
  await api.confirmFee(row.id);
  ElMessage.success('確定しました');
  fetchList();
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportDormFees({
      yearMonth: filters.yearMonth || undefined,
      status: filters.status || undefined,
    });
  } finally {
    exporting.value = false;
  }
}

onMounted(fetchList);
</script>
