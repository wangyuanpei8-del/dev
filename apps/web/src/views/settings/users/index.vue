<template>
  <div class="page-container">
    <PageHeader title="ユーザー" subtitle="アプリケーションアカウント管理">
      <template #actions>
        <el-button type="primary" @click="openDialog()">新規ユーザー</el-button>
      </template>
    </PageHeader>

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-form :inline="true" :model="filters" class="filter-bar">
        <el-form-item label="ロール">
          <el-select v-model="filters.role" clearable @change="fetchList">
            <el-option v-for="(label, key) in UserRoleLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="状態">
          <el-select v-model="filters.isActive" clearable placeholder="すべて" @change="fetchList">
            <el-option label="有効" :value="true" />
            <el-option label="無効" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">検索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" stripe>
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="email" label="メール" min-width="200" />
        <el-table-column label="表示名" min-width="140">
          <template #default="{ row }">{{ row.displayName || row.display_name }}</template>
        </el-table-column>
        <el-table-column label="ロール" width="140">
          <template #default="{ row }">{{ UserRoleLabels[row.role] }}</template>
        </el-table-column>
        <el-table-column label="状態" width="90">
          <template #default="{ row }">
            <span :class="(row.isActive ?? row.is_active) ? 'status-badge status-badge--success' : 'status-badge status-badge--neutral'">
              {{ (row.isActive ?? row.is_active) ? '有効' : '無効' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">編集</el-button>
            <el-button
              v-if="row.isActive ?? row.is_active"
              link
              type="danger"
              @click="deactivate(row)"
            >停用</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="ユーザーデータがありません" />
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="total" @change="fetchList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'ユーザー編集' : 'ユーザー登録'" width="520px" destroy-on-close @closed="formRef?.resetFields()">
      <el-form ref="formRef" :model="form" :rules="dynamicRules" label-width="120px">
        <el-form-item label="メール" prop="email">
          <el-input v-model="form.email" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="表示名" prop="displayName">
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item label="パスワード" prop="password">
          <el-input v-model="form.password" type="password" show-password :placeholder="editingId ? '変更時のみ入力' : ''" />
        </el-form-item>
        <el-form-item label="ロール" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option v-for="(label, key) in UserRoleLabels" :key="key" :label="label" :value="key" />
          </el-select>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import * as api from '@/api/users';
import { UserRoleLabels } from '@/constants/enums';

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
const filters = reactive({ role: '', isActive: '' });
const form = reactive({ email: '', displayName: '', password: '', role: '' });

const userRules = {
  email: [{ required: true, type: 'email', message: '形式が正しくありません', trigger: 'blur' }],
  displayName: [{ required: true, message: '表示名を入力', trigger: 'blur' }],
  password: [{ min: 10, message: '10文字以上', trigger: 'blur' }],
  role: [{ required: true, message: 'ロールを選択', trigger: 'change' }],
};

const dynamicRules = computed(() => ({
  ...userRules,
  password: editingId.value
    ? [{ min: 10, message: '10文字以上', trigger: 'blur' }]
    : [
        { required: true, message: 'パスワードを入力', trigger: 'blur' },
        { min: 10, message: '10文字以上', trigger: 'blur' },
      ],
}));

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await api.getUsers({ ...filters, page: page.value, pageSize: pageSize.value });
    list.value = res?.items || [];
    total.value = res?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
    loadError.value = 'ユーザーデータの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

function openDialog(row) {
  editingId.value = row?.id || null;
  Object.assign(form, {
    email: row?.email || '',
    displayName: row?.displayName || row?.display_name || '',
    password: '',
    role: row?.role || '',
  });
  dialogVisible.value = true;
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = { ...form };
    if (editingId.value && !payload.password) delete payload.password;
    if (editingId.value) await api.updateUser(editingId.value, payload);
    else await api.createUser(payload);
    ElMessage.success('保存しました');
    dialogVisible.value = false;
    fetchList();
  } finally {
    saving.value = false;
  }
}

async function deactivate(row) {
  await ElMessageBox.confirm('このユーザーを無効化しますか？', '確認', { type: 'warning' });
  await api.updateUser(row.id, { isActive: false });
  ElMessage.success('無効化しました');
  fetchList();
}

onMounted(fetchList);
</script>
