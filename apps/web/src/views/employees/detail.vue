<template>
  <div class="page-container">
    <PageHeader :title="employee?.fullName || employee?.full_name || '社員詳細'" subtitle="360° ビュー">
      <template #actions>
        <el-button @click="$router.push('/employees')">一覧へ</el-button>
        <el-button v-if="employee" v-permission="'occupancy:write'" type="primary" @click="$router.push('/occupancy/create')">
          入寮登録
        </el-button>
      </template>
    </PageHeader>

    <DetailNotFound
      v-if="!loading && !employee"
      title="社員が見つかりません"
      sub-title="削除されたか、URL が正しくない可能性があります。"
      back-to="/employees"
      back-label="社員一覧へ"
      :show-retry="!!loadError"
      @retry="loadDetail"
    />

    <div v-else-if="employee" class="detail-grid">
      <section class="page-card detail-summary">
        <div class="detail-summary__head">
          <div class="detail-summary__avatar">
            <el-icon :size="32"><UserFilled /></el-icon>
          </div>
          <div>
            <h2 class="detail-summary__name">{{ employee.fullName || employee.full_name }}</h2>
            <p class="detail-summary__code">{{ employee.employeeCode || employee.employee_code || '—' }}</p>
          </div>
        </div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="区分">
            {{ EmployeeTypeLabels[employee.employeeType || employee.employee_type] || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="性別">
            {{ GenderLabels[employee.gender] || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属">
            {{ employee.department?.name || employee.departmentName || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="初回入寮日">
            {{ formatDate(employee.firstDormUseDate || employee.first_dorm_use_date) }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="page-card">
        <h3 class="section-title">現在の在室</h3>
        <div v-if="activeOccupancies.length">
          <div v-for="h in activeOccupancies" :key="h.id" class="occ-row">
            <div>
              <strong>{{ h.dormName }} / {{ h.roomName }}</strong>
              <p class="occ-row__meta">入居日 {{ h.moveInDate }}</p>
            </div>
            <StatusBadge status="ACTIVE" />
            <router-link v-permission="'occupancy:write'" :to="`/occupancy/${h.id}/move-out`">
              <el-button size="small" type="primary" plain>退寮</el-button>
            </router-link>
          </div>
        </div>
        <el-empty v-else description="現在在室中ではありません" :image-size="64" />
      </section>

      <section class="page-card detail-span-2">
        <h3 class="section-title">入退寮履歴</h3>
        <el-table :data="histories" stripe size="small">
          <el-table-column label="寮・部屋" min-width="160">
            <template #default="{ row }">{{ row.dormName }} / {{ row.roomName }}</template>
          </el-table-column>
          <el-table-column label="状態" width="100">
            <template #default="{ row }">
              <StatusBadge :status="occupancyStatusKey(row)" />
            </template>
          </el-table-column>
          <el-table-column label="入居日" width="120">
            <template #default="{ row }">{{ formatDate(row.moveInDate) }}</template>
          </el-table-column>
          <el-table-column label="退寮日" width="120">
            <template #default="{ row }">{{ formatDate(row.moveOutDate) }}</template>
          </el-table-column>
        </el-table>
      </section>

      <section class="page-card detail-span-2">
        <h3 class="section-title">寮費</h3>
        <el-table :data="fees" stripe size="small">
          <el-table-column label="年月" width="100" prop="yearMonth" />
          <el-table-column label="寮" min-width="120">
            <template #default="{ row }">{{ row.dormName || row.dorm?.name || '—' }}</template>
          </el-table-column>
          <el-table-column label="金額" width="120">
            <template #default="{ row }">{{ formatYen(row.totalAmount ?? row.total_amount) }}</template>
          </el-table-column>
          <el-table-column label="状態" width="100">
            <template #default="{ row }">
              <StatusBadge :status="row.status" />
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!fees.length" description="寮費データがありません" :image-size="64" />
      </section>
    </div>
    <div v-else v-loading="loading" class="detail-loading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { UserFilled } from '@element-plus/icons-vue';
import PageHeader from '@/components/PageHeader.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import DetailNotFound from '@/components/DetailNotFound.vue';
import { getEmployee } from '@/api/employees';
import { getOccupancyHistories } from '@/api/occupancy';
import { getDormFees } from '@/api/fees';
import { EmployeeTypeLabels, GenderLabels } from '@/constants/enums';
import { formatDate } from '@/utils/date';
import { isOpenOccupancy, occupancyStatusKey } from '@/utils/occupancy';

const route = useRoute();
const loading = ref(false);
const loadError = ref('');
const employee = ref(null);
const activeOccupancies = ref([]);
const histories = ref([]);
const fees = ref([]);

function formatYen(v) {
  if (v == null || v === '') return '—';
  return `¥${Number(v).toLocaleString('ja-JP')}`;
}

async function loadDetail() {
  loading.value = true;
  loadError.value = '';
  const id = route.params.id;
  try {
    const [emp, occRes, feeRes] = await Promise.all([
      getEmployee(id),
      getOccupancyHistories({ employeeId: id, page: 1, pageSize: 100 }),
      getDormFees({ employeeId: id, page: 1, pageSize: 50 }),
    ]);
    employee.value = emp;
    histories.value = occRes?.items || [];
    activeOccupancies.value = histories.value.filter((h) => isOpenOccupancy(h));
    fees.value = feeRes?.items || [];
  } catch {
    employee.value = null;
    histories.value = [];
    activeOccupancies.value = [];
    fees.value = [];
    loadError.value = '社員データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

onMounted(loadDetail);
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.detail-span-2 {
  grid-column: 1 / -1;
}
.detail-summary__head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.detail-summary__avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #06b6d4, #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-summary__name {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}
.detail-summary__code {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--app-text-secondary);
}
.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
}
.occ-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--app-border-light);
}
.occ-row:last-child {
  border-bottom: none;
}
.occ-row__meta {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--app-text-secondary);
}
.detail-loading {
  min-height: 240px;
}
@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
