<template>
  <div class="page-container">
    <PageHeader title="料率マスタ" subtitle="寮費算定用の単価設定">
      <template #actions>
        <el-button v-permission="'fee-rates:write'" type="primary" @click="openDialog()">新規</el-button>
      </template>
    </PageHeader>

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-table :data="list" stripe>
        <el-table-column prop="roomType" label="部屋タイプ" min-width="160">
          <template #default="{ row }">{{ RoomTypeLabels[row.roomType || row.room_type] || (row.roomType || row.room_type) }}</template>
        </el-table-column>
        <el-table-column label="単価" width="120">
          <template #default="{ row }">{{ row.dailyRateYen ?? row.daily_rate_yen ?? row.unitPrice ?? row.unit_price ?? '—' }}</template>
        </el-table-column>
        <el-table-column prop="effectiveFrom" label="適用開始" width="120">
          <template #default="{ row }">{{ formatDate(row.effectiveFrom || row.effective_from) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'fee-rates:write'" link type="primary" @click="openDialog(row)">編集</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="料率データがありません" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '料率編集' : '料率登録'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="部屋タイプ" prop="roomType" :rules="[{ required: true, message: '部屋タイプを選択', trigger: 'change' }]">
          <el-select v-model="form.roomType" style="width: 100%">
            <el-option v-for="(label, key) in RoomTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="単価">
          <el-input-number v-model="form.dailyRateYen" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="適用開始">
          <el-date-picker v-model="form.effectiveFrom" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import * as api from '@/api/fees';
import { formatDate } from '@/utils/date';
import { RoomTypeLabels } from '@/constants/enums';

const loading = ref(false);
const loadError = ref('');
const saving = ref(false);
const list = ref([]);
const dialogVisible = ref(false);
const editingId = ref(null);
const formRef = ref();
const form = reactive({ roomType: '', dailyRateYen: null, effectiveFrom: '', version: null });

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await api.getFeeRates();
    list.value = res?.items || res || [];
  } catch {
    list.value = [];
    loadError.value = '料率データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

function openDialog(row) {
  editingId.value = row?.id || null;
  if (!row) {
    Object.assign(form, { roomType: '', dailyRateYen: null, effectiveFrom: '', version: null });
    dialogVisible.value = true;
    return;
  }
  Object.assign(form, {
    roomType: row?.roomType || row?.room_type || '',
    dailyRateYen: row?.dailyRateYen ?? row?.daily_rate_yen ?? row?.unitPrice ?? row?.unit_price ?? null,
    effectiveFrom: row?.effectiveFrom || row?.effective_from || '',
    version: row?.version ?? null,
  });
  dialogVisible.value = true;
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingId.value) await api.updateFeeRate(editingId.value, form);
    else await api.createFeeRate(form);
    ElMessage.success('保存しました');
    dialogVisible.value = false;
    fetchList();
  } finally {
    saving.value = false;
  }
}

onMounted(fetchList);
</script>
