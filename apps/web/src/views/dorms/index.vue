<template>
  <div class="page-container">
    <PageHeader title="寮・部屋" subtitle="寮マスタ一覧">
      <template #actions>
        <el-button v-permission="'dorms:write'" type="primary" @click="openDialog()">新規寮</el-button>
      </template>
    </PageHeader>

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-table :data="list" stripe>
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="code" label="コード" width="100" />
        <el-table-column prop="name" label="寮名" min-width="160" />
        <el-table-column prop="address" label="住所" min-width="200" show-overflow-tooltip />
        <el-table-column prop="genderType" label="区分" width="100">
          <template #default="{ row }">{{ DormGenderTypeLabels[row.genderType || row.gender_type] }}</template>
        </el-table-column>
        <el-table-column prop="layoutType" label="間取" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <router-link :to="`/dorms/${row.id}`">
              <el-button link type="primary">詳細</el-button>
            </router-link>
            <el-button v-permission="'dorms:write'" link type="primary" @click="openDialog(row)">編集</el-button>
            <el-button v-permission="'dorms:write'" link type="danger" @click="handleDelete(row)">削除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="寮データがありません" />
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="total" @change="fetchList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '寮編集' : '寮登録'" width="560px" destroy-on-close @closed="formRef?.resetFields()">
      <el-form ref="formRef" :model="form" :rules="dormRules" label-width="100px">
        <el-form-item label="コード" prop="code"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="寮名" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="住所" prop="address"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="間取" prop="layoutType"><el-input v-model="form.layoutType" /></el-form-item>
        <el-form-item label="区分" prop="genderType">
          <el-select v-model="form.genderType" :disabled="!isSystemAdmin()" style="width: 100%">
            <el-option v-for="(label, key) in DormGenderTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import * as api from '@/api/dorms';
import { DormGenderTypeLabels } from '@/constants/enums';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const isSystemAdmin = () => userStore.hasRole('SYSTEM_ADMIN');

const loading = ref(false);
const loadError = ref('');
const saving = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const dialogVisible = ref(false);
const editingId = ref(null);
const formRef = ref();
const form = reactive({ code: '', name: '', address: '', layoutType: '', genderType: '', version: null });

const dormRules = {
  code: [{ required: true, message: 'コードを入力', trigger: 'blur' }],
  name: [{ required: true, message: '寮名を入力', trigger: 'blur' }],
  address: [{ required: true, message: '住所を入力', trigger: 'blur' }],
  layoutType: [{ required: true, message: '間取を入力', trigger: 'blur' }],
  genderType: [{ required: true, message: '区分を選択', trigger: 'change' }],
};

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await api.getDorms({ page: page.value, pageSize: pageSize.value });
    list.value = res?.items || [];
    total.value = res?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
    loadError.value = '寮データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

async function openDialog(row) {
  editingId.value = row?.id || null;
  if (row?.id) {
    const detail = await api.getDorm(row.id).catch(() => row);
    Object.assign(form, {
      code: detail.code || '',
      name: detail.name || '',
      address: detail.address || '',
      layoutType: detail.layoutType || detail.layout_type || '',
      genderType: detail.genderType || detail.gender_type || '',
      version: detail.version ?? null,
    });
  } else {
    Object.assign(form, {
      code: '', name: '', address: '', layoutType: '', genderType: '', version: null,
    });
  }
  dialogVisible.value = true;
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingId.value) await api.updateDorm(editingId.value, form);
    else await api.createDorm(form);
    ElMessage.success('保存しました');
    dialogVisible.value = false;
    fetchList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('この寮を削除しますか？', '確認', { type: 'warning' });
  await api.deleteDorm(row.id);
  ElMessage.success('削除しました');
  fetchList();
}

onMounted(fetchList);
</script>
