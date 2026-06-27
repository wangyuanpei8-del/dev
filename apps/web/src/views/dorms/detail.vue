<template>
  <div class="page-container">
    <PageHeader :title="dorm?.name || '寮詳細'" subtitle="基本情報・部屋・履歴">
      <template #actions>
        <el-button @click="$router.push('/dorms')">一覧へ</el-button>
        <el-button v-if="dorm" v-permission="'rooms:write'" type="primary" @click="openRoomDialog()">部屋追加</el-button>
      </template>
    </PageHeader>

    <DetailNotFound
      v-if="!loading && !dorm"
      title="寮が見つかりません"
      sub-title="削除されたか、URL が正しくない可能性があります。"
      back-to="/dorms"
      back-label="寮一覧へ"
      :show-retry="!!loadError"
      @retry="fetchDorm"
    />

    <el-tabs v-else-if="dorm" v-model="activeTab" class="page-card">
      <el-tab-pane label="基本情報" name="info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="コード">{{ dorm.code }}</el-descriptions-item>
          <el-descriptions-item label="寮名">{{ dorm.name }}</el-descriptions-item>
          <el-descriptions-item label="住所" :span="2">{{ dorm.address }}</el-descriptions-item>
          <el-descriptions-item label="間取">{{ dorm.layoutType || dorm.layout_type }}</el-descriptions-item>
          <el-descriptions-item label="区分">{{ DormGenderTypeLabels[dorm.genderType || dorm.gender_type] }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="部屋一覧" name="rooms">
        <ListLoadAlert :message="roomsLoadError" @retry="fetchRooms" />
        <el-table :data="rooms" stripe v-loading="roomsLoading">
          <el-table-column prop="code" label="部屋コード" width="120" />
          <el-table-column prop="name" label="部屋名" min-width="120" />
          <el-table-column prop="areaSqm" label="面積(㎡)" width="100">
            <template #default="{ row }">{{ row.areaSqm ?? row.area_sqm }}</template>
          </el-table-column>
          <el-table-column prop="roomType" label="タイプ" width="120">
            <template #default="{ row }">{{ RoomTypeLabels[row.roomType || row.room_type] }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button v-permission="'rooms:write'" link type="primary" @click="openRoomDialog(row)">編集</el-button>
              <el-button v-permission="'rooms:write'" link type="danger" @click="handleDeleteRoom(row)">削除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!roomsLoading && !rooms.length" description="部屋データがありません" />
      </el-tab-pane>

      <el-tab-pane label="履歴" name="history">
        <el-empty description="履歴データはシステム連携後に表示されます" />
      </el-tab-pane>
    </el-tabs>
    <div v-else v-loading="loading" class="detail-loading" />

    <el-dialog v-model="roomDialogVisible" :title="editingRoomId ? '部屋編集' : '部屋登録'" width="480px" destroy-on-close>
      <el-form ref="roomFormRef" :model="roomForm" :rules="roomRules" label-width="110px">
        <el-form-item label="コード" prop="code"><el-input v-model="roomForm.code" /></el-form-item>
        <el-form-item label="部屋名" prop="name"><el-input v-model="roomForm.name" /></el-form-item>
        <el-form-item label="面積(㎡)" prop="areaSqm">
          <el-input-number v-model="roomForm.areaSqm" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="タイプ" prop="roomType">
          <el-select v-model="roomForm.roomType" style="width: 100%">
            <el-option v-for="(label, key) in RoomTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roomDialogVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="saving" @click="submitRoom">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import DetailNotFound from '@/components/DetailNotFound.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import * as dormApi from '@/api/dorms';
import * as roomApi from '@/api/rooms';
import { DormGenderTypeLabels, RoomTypeLabels } from '@/constants/enums';

const route = useRoute();
const dormId = route.params.id;
const loading = ref(false);
const loadError = ref('');
const roomsLoading = ref(false);
const roomsLoadError = ref('');
const saving = ref(false);
const dorm = ref(null);
const rooms = ref([]);
const activeTab = ref('info');
const roomDialogVisible = ref(false);
const editingRoomId = ref(null);
const roomFormRef = ref();
const roomForm = reactive({ code: '', name: '', areaSqm: null, roomType: '', version: null });

const roomRules = {
  code: [{ required: true, message: 'コードを入力', trigger: 'blur' }],
  name: [{ required: true, message: '部屋名を入力', trigger: 'blur' }],
  areaSqm: [{ required: true, message: '面積を入力', trigger: 'blur' }],
  roomType: [{ required: true, message: 'タイプを選択', trigger: 'change' }],
};

async function fetchDorm() {
  loading.value = true;
  loadError.value = '';
  try {
    dorm.value = await dormApi.getDorm(dormId);
  } catch {
    dorm.value = null;
    loadError.value = '寮データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

async function fetchRooms() {
  roomsLoading.value = true;
  roomsLoadError.value = '';
  try {
    const res = await roomApi.getRooms(dormId);
    rooms.value = res?.items || res || [];
  } catch {
    rooms.value = [];
    roomsLoadError.value = '部屋データの取得に失敗しました';
  } finally {
    roomsLoading.value = false;
  }
}

function openRoomDialog(row) {
  editingRoomId.value = row?.id || null;
  Object.assign(roomForm, {
    code: row?.code || '',
    name: row?.name || '',
    areaSqm: row?.areaSqm ?? row?.area_sqm ?? null,
    roomType: row?.roomType || row?.room_type || '',
    version: row?.version ?? null,
  });
  roomDialogVisible.value = true;
}

async function submitRoom() {
  const valid = await roomFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingRoomId.value) await roomApi.updateRoom(editingRoomId.value, roomForm);
    else await roomApi.createRoom(dormId, roomForm);
    ElMessage.success('保存しました');
    roomDialogVisible.value = false;
    fetchRooms();
  } finally {
    saving.value = false;
  }
}

async function handleDeleteRoom(row) {
  await ElMessageBox.confirm('この部屋を削除しますか？', '確認', { type: 'warning' });
  await roomApi.deleteRoom(row.id);
  ElMessage.success('削除しました');
  fetchRooms();
}

watch(activeTab, (tab) => {
  if (tab === 'rooms' && !rooms.value.length) fetchRooms();
});

onMounted(() => {
  fetchDorm();
  fetchRooms();
});
</script>

<style scoped>
.detail-loading {
  min-height: 240px;
}
</style>
