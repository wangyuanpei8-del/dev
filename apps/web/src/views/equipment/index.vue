<template>
  <div class="page-container">
    <PageHeader title="備品" subtitle="備品マスタ・保管場所" />

    <div class="page-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="備品マスタ" name="items">
          <ListLoadAlert :message="itemsLoadError" @retry="fetchItems" />
          <div class="table-toolbar">
            <span class="title">備品一覧</span>
            <el-button v-permission="'equipment:write'" type="primary" @click="openItemDialog()">新規</el-button>
          </div>
          <el-table :data="items" stripe v-loading="itemsLoading">
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column prop="description" label="説明" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'equipment:write'" link type="primary" @click="openItemDialog(row)">編集</el-button>
                <el-button v-permission="'equipment:write'" link type="danger" @click="deleteItem(row)">削除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!itemsLoading && !items.length" description="備品データがありません" />
        </el-tab-pane>

        <el-tab-pane label="保管場所" name="locations">
          <ListLoadAlert :message="locationsLoadError" @retry="fetchLocations" />
          <div class="table-toolbar">
            <span class="title">保管場所一覧</span>
            <el-button v-permission="'equipment:write'" type="primary" @click="openLocationDialog()">新規</el-button>
          </div>
          <el-table :data="locations" stripe v-loading="locationsLoading">
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column prop="description" label="説明" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'equipment:write'" link type="primary" @click="openLocationDialog(row)">編集</el-button>
                <el-button v-permission="'equipment:write'" link type="danger" @click="deleteLocation(row)">削除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!locationsLoading && !locations.length" description="保管場所データがありません" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="itemDialogVisible" :title="editingItemId ? '備品編集' : '備品登録'" width="480px" destroy-on-close>
      <el-form ref="itemFormRef" :model="itemForm" :rules="equipmentItemRules" label-width="80px">
        <el-form-item label="名称" prop="name"><el-input v-model="itemForm.name" /></el-form-item>
        <el-form-item label="説明"><el-input v-model="itemForm.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submitItem">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="locationDialogVisible" :title="editingLocationId ? '保管場所編集' : '保管場所登録'" width="480px" destroy-on-close>
      <el-form ref="locationFormRef" :model="locationForm" :rules="storageLocationRules" label-width="80px">
        <el-form-item label="名称" prop="name"><el-input v-model="locationForm.name" /></el-form-item>
        <el-form-item label="説明"><el-input v-model="locationForm.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="locationDialogVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submitLocation">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import * as api from '@/api/equipment';

const activeTab = ref('items');
const items = ref([]);
const locations = ref([]);
const itemsLoading = ref(false);
const locationsLoading = ref(false);
const itemsLoadError = ref('');
const locationsLoadError = ref('');
const saving = ref(false);
const itemDialogVisible = ref(false);
const locationDialogVisible = ref(false);
const editingItemId = ref(null);
const editingLocationId = ref(null);
const itemFormRef = ref();
const locationFormRef = ref();
const itemForm = reactive({ name: '', description: '' });
const locationForm = reactive({ name: '', description: '' });

const equipmentItemRules = { name: [{ required: true, message: '名称を入力', trigger: 'blur' }] };
const storageLocationRules = { name: [{ required: true, message: '名称を入力', trigger: 'blur' }] };

async function fetchItems() {
  itemsLoading.value = true;
  itemsLoadError.value = '';
  try {
    const res = await api.getEquipmentItems();
    items.value = res?.items || res || [];
  } catch {
    items.value = [];
    itemsLoadError.value = '備品データの取得に失敗しました';
  } finally {
    itemsLoading.value = false;
  }
}

async function fetchLocations() {
  locationsLoading.value = true;
  locationsLoadError.value = '';
  try {
    const res = await api.getStorageLocations();
    locations.value = res?.items || res || [];
  } catch {
    locations.value = [];
    locationsLoadError.value = '保管場所データの取得に失敗しました';
  } finally {
    locationsLoading.value = false;
  }
}

function openItemDialog(row) {
  editingItemId.value = row?.id || null;
  Object.assign(itemForm, { name: row?.name || '', description: row?.description || '' });
  itemDialogVisible.value = true;
}

function openLocationDialog(row) {
  editingLocationId.value = row?.id || null;
  Object.assign(locationForm, { name: row?.name || '', description: row?.description || '' });
  locationDialogVisible.value = true;
}

async function submitItem() {
  const valid = await itemFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingItemId.value) await api.updateEquipmentItem(editingItemId.value, itemForm);
    else await api.createEquipmentItem(itemForm);
    ElMessage.success('保存しました');
    itemDialogVisible.value = false;
    fetchItems();
  } finally {
    saving.value = false;
  }
}

async function submitLocation() {
  const valid = await locationFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingLocationId.value) await api.updateStorageLocation(editingLocationId.value, locationForm);
    else await api.createStorageLocation(locationForm);
    ElMessage.success('保存しました');
    locationDialogVisible.value = false;
    fetchLocations();
  } finally {
    saving.value = false;
  }
}

async function deleteItem(row) {
  await ElMessageBox.confirm('削除しますか？', '確認', { type: 'warning' });
  await api.deleteEquipmentItem(row.id);
  ElMessage.success('削除しました');
  fetchItems();
}

async function deleteLocation(row) {
  await ElMessageBox.confirm('削除しますか？', '確認', { type: 'warning' });
  await api.deleteStorageLocation(row.id);
  ElMessage.success('削除しました');
  fetchLocations();
}

watch(activeTab, (tab) => {
  if (tab === 'items') fetchItems();
  else fetchLocations();
});

onMounted(fetchItems);
</script>
