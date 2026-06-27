<template>
  <div class="page-container">
    <PageHeader title="退寮登録" subtitle="退寮日を入力して登録">
      <template #actions>
        <el-button @click="$router.push('/occupancy')">キャンセル</el-button>
      </template>
    </PageHeader>

    <DetailNotFound
      v-if="!loading && !record && !alreadyMovedOut"
      title="入退寮履歴が見つかりません"
      sub-title="削除されたか、URL が正しくない可能性があります。"
      back-to="/occupancy/history"
      back-label="履歴一覧へ"
      :show-retry="!!loadError"
      @retry="loadRecord"
    />

    <div v-else-if="alreadyMovedOut" class="page-card move-out-done" style="max-width: 560px">
      <el-result icon="success" title="この履歴は既に退寮済みです">
        <template #sub-title>
          <p class="move-out-done__meta"><strong>{{ record?.employeeName }}</strong> · {{ record?.dormName }} / {{ record?.roomName }}</p>
          <p class="move-out-done__meta">退寮日：{{ record?.moveOutDate || '—' }}</p>
        </template>
        <template #extra>
          <router-link to="/occupancy/history"><el-button type="primary">履歴一覧へ</el-button></router-link>
          <router-link v-if="record?.employeeId" :to="`/employees/${record.employeeId}`"><el-button>社員詳細</el-button></router-link>
          <el-button @click="$router.push('/')">ホームへ</el-button>
        </template>
      </el-result>
    </div>

    <div v-else class="page-card" style="max-width: 480px">
      <div v-if="record" class="move-out-context">
        <p><strong>{{ record.employeeName }}</strong> · {{ record.dormName }} / {{ record.roomName }}</p>
        <p class="move-out-context__sub">入寮日：{{ record.moveInDate || '—' }}</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" v-loading="loading">
        <el-form-item label="退寮日" prop="moveOutDate">
          <el-date-picker v-model="form.moveOutDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="備考">
          <el-input v-model="form.moveOutReason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">退寮登録</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import DetailNotFound from '@/components/DetailNotFound.vue';
import * as api from '@/api/occupancy';
import { isOpenOccupancy } from '@/utils/occupancy';

const route = useRoute();
const router = useRouter();
const id = route.params.id;
const loading = ref(false);
const loadError = ref('');
const submitting = ref(false);
const formRef = ref();
const record = ref(null);
const form = reactive({ moveOutDate: '', moveOutReason: '', version: null });
const alreadyMovedOut = computed(() => record.value && !isOpenOccupancy(record.value));
const rules = { moveOutDate: [{ required: true, message: '退寮日を選択', trigger: 'change' }] };

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    await api.moveOut(id, form);
    ElMessage.success('退寮を登録しました');
    router.push('/occupancy/history');
  } finally {
    submitting.value = false;
  }
}

async function loadRecord() {
  loading.value = true;
  loadError.value = '';
  try {
    record.value = await api.getOccupancyHistory(id);
    form.version = record.value?.version ?? null;
  } catch {
    record.value = null;
    loadError.value = '履歴データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

onMounted(loadRecord);
</script>

<style scoped>
.move-out-context { margin-bottom: 16px; padding: 12px 14px; border-radius: 10px; background: var(--app-fill); font-size: 14px; }
.move-out-context__sub { margin: 6px 0 0; font-size: 13px; color: var(--app-text-secondary); }
.move-out-done__meta { margin: 4px 0; font-size: 14px; color: var(--app-text-secondary); }
</style>
