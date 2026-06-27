<template>
  <div class="page-container">
    <PageHeader title="社員" subtitle="社員マスタ管理">
      <template #actions>
        <el-button v-permission="'employees:write'" type="primary" @click="openDialog()">新規登録</el-button>
      </template>
    </PageHeader>

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-form :inline="true" :model="filters" class="filter-bar">
        <el-form-item label="検索">
          <el-input v-model="filters.q" placeholder="氏名・コード" clearable @clear="fetchList" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="区分">
          <el-select v-model="filters.employeeType" clearable placeholder="すべて" @change="fetchList">
            <el-option v-for="(label, key) in EmployeeTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="性別">
          <el-select v-model="filters.gender" clearable placeholder="すべて" @change="fetchList">
            <el-option v-for="(label, key) in GenderLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">検索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" stripe @selection-change="onSelect">
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="employeeCode" label="社員コード" width="120">
          <template #default="{ row }">{{ row.employeeCode || row.employee_code || '—' }}</template>
        </el-table-column>
        <el-table-column prop="fullName" label="氏名" min-width="140">
          <template #default="{ row }">{{ row.fullName || row.full_name }}</template>
        </el-table-column>
        <el-table-column prop="employeeType" label="区分" width="120">
          <template #default="{ row }">{{ EmployeeTypeLabels[row.employeeType || row.employee_type] }}</template>
        </el-table-column>
        <el-table-column prop="gender" label="性別" width="80">
          <template #default="{ row }">{{ GenderLabels[row.gender] }}</template>
        </el-table-column>
        <el-table-column prop="firstDormUseDate" label="初回入寮日" width="120">
          <template #default="{ row }">{{ formatDate(row.firstDormUseDate || row.first_dorm_use_date) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <router-link :to="`/employees/${row.id}`">
              <el-button link type="primary">詳細</el-button>
            </router-link>
            <el-button v-permission="'employees:write'" link type="primary" @click="openDialog(row)">編集</el-button>
            <el-button v-permission:role="'SYSTEM_ADMIN'" link @click="openFirstDateDialog(row)">初回日</el-button>
            <el-button v-permission="'employees:write'" link type="danger" @click="handleDelete(row)">削除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="社員データがありません" />
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="total" @change="fetchList" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '社員編集' : '社員登録'" width="520px" destroy-on-close @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="employeeRules" label-width="120px">
        <el-form-item label="氏名" prop="fullName">
          <el-input v-model="form.fullName" />
        </el-form-item>
        <el-form-item label="社員コード" prop="employeeCode">
          <el-input v-model="form.employeeCode" />
        </el-form-item>
        <el-form-item label="区分" prop="employeeType">
          <el-select v-model="form.employeeType" style="width: 100%">
            <el-option v-for="(label, key) in EmployeeTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="性別" prop="gender">
          <el-select v-model="form.gender" style="width: 100%">
            <el-option v-for="(label, key) in GenderLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属">
          <el-select v-model="form.departmentId" clearable filterable placeholder="選択" style="width: 100%">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="firstDateVisible" title="初回入寮日修正" width="400px" destroy-on-close>
      <el-form ref="firstDateRef" :model="firstDateForm" label-width="120px">
        <el-form-item label="初回入寮日" prop="firstDormUseDate" :rules="[{ required: true, message: '日付を選択', trigger: 'change' }]">
          <el-date-picker v-model="firstDateForm.firstDormUseDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="firstDateVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submitFirstDate">保存</el-button>
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
import * as api from '@/api/employees';
import * as deptApi from '@/api/departments';
import { EmployeeTypeLabels, GenderLabels } from '@/constants/enums';
import { formatDate } from '@/utils/date';

const loading = ref(false);
const loadError = ref('');
const saving = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const selected = ref([]);
const dialogVisible = ref(false);
const firstDateVisible = ref(false);
const editingId = ref(null);
const firstDateEmployeeId = ref(null);
const formRef = ref();
const firstDateRef = ref();

const filters = reactive({ q: '', employeeType: '', gender: '' });
const departments = ref([]);
const form = reactive({ fullName: '', employeeCode: '', employeeType: '', gender: '', departmentId: null, version: null });
const firstDateForm = reactive({ firstDormUseDate: '' });

const employeeRules = {
  fullName: [{ required: true, message: '氏名を入力', trigger: 'blur' }],
  employeeType: [{ required: true, message: '区分を選択', trigger: 'change' }],
  gender: [{ required: true, message: '性別を選択', trigger: 'change' }],
};

function onSelect(rows) {
  selected.value = rows;
}

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await api.getEmployees({ ...filters, page: page.value, pageSize: pageSize.value });
    list.value = res?.items || [];
    total.value = res?.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
    loadError.value = '社員データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

async function openDialog(row) {
  editingId.value = row?.id || null;
  if (row?.id) {
    const detail = await api.getEmployee(row.id).catch(() => row);
    Object.assign(form, {
      fullName: detail.fullName || detail.full_name || '',
      employeeCode: detail.employeeCode || detail.employee_code || '',
      employeeType: detail.employeeType || detail.employee_type || '',
      gender: detail.gender || '',
      departmentId: detail.departmentId || detail.department_id || null,
      version: detail.version ?? null,
    });
  } else {
    Object.assign(form, {
      fullName: '', employeeCode: '', employeeType: '', gender: '', departmentId: null, version: null,
    });
  }
  dialogVisible.value = true;
}

function resetForm() {
  formRef.value?.resetFields();
  editingId.value = null;
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingId.value) await api.updateEmployee(editingId.value, form);
    else await api.createEmployee(form);
    ElMessage.success('保存しました');
    dialogVisible.value = false;
    fetchList();
  } finally {
    saving.value = false;
  }
}

function openFirstDateDialog(row) {
  firstDateEmployeeId.value = row.id;
  firstDateForm.firstDormUseDate = row.firstDormUseDate || row.first_dorm_use_date || '';
  firstDateVisible.value = true;
}

async function submitFirstDate() {
  const valid = await firstDateRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    await api.updateFirstDormUseDate(firstDateEmployeeId.value, firstDateForm);
    ElMessage.success('初回入寮日を更新しました');
    firstDateVisible.value = false;
    fetchList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('この社員を削除しますか？', '確認', { type: 'warning' });
  await api.deleteEmployee(row.id);
  ElMessage.success('削除しました');
  fetchList();
}

async function loadDepartments() {
  const res = await deptApi.getDepartments({ page: 1, pageSize: 500 }).catch(() => null);
  departments.value = res?.items || [];
}

onMounted(() => {
  loadDepartments();
  fetchList();
});
</script>
