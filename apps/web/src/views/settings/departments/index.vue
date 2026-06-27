<template>
  <div class="page-container">
    <PageHeader title="所属マスタ" subtitle="社員の所属（部署）管理">
      <template #actions>
        <el-button type="primary" @click="openDialog()">新規登録</el-button>
      </template>
    </PageHeader>

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-form :inline="true" :model="filters" class="filter-bar">
        <el-form-item label="検索">
          <el-input v-model="filters.q" placeholder="所属名" clearable @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">検索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" stripe>
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="name" label="所属名" min-width="200" />
        <el-table-column prop="code" label="コード" width="140">
          <template #default="{ row }">{{ row.code || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">編集</el-button>
            <el-button link type="danger" @click="handleDelete(row)">削除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="所属データがありません" />
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="total" @change="fetchList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '所属編集' : '所属登録'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="コード">
          <el-input v-model="form.code" />
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
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import * as api from '@/api/departments';

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
const filters = reactive({ q: '' });
const form = reactive({ name: '', code: '' });
const rules = {
  name: [{ required: true, message: '所属名を入力', trigger: 'blur' }],
};

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await api.getDepartments({ ...filters, page: page.value, pageSize: pageSize.value });
    list.value = res?.items || [];
    total.value = res?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
    loadError.value = '所属データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

function openDialog(row) {
  editingId.value = row?.id || null;
  Object.assign(form, { name: row?.name || '', code: row?.code || '' });
  dialogVisible.value = true;
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingId.value) await api.updateDepartment(editingId.value, form);
    else await api.createDepartment(form);
    ElMessage.success('保存しました');
    dialogVisible.value = false;
    fetchList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('この所属を削除しますか？', '確認', { type: 'warning' });
  await api.deleteDepartment(row.id);
  ElMessage.success('削除しました');
  fetchList();
}

onMounted(fetchList);
</script>
