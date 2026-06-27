<template>
  <div class="page-container">
    <PageHeader title="退寮登録" subtitle="ウィザード形式で登録">
      <template #actions>
        <el-button @click="$router.push('/occupancy')">キャンセル</el-button>
      </template>
    </PageHeader>

    <div class="page-card">
      <div v-if="!flowMode" class="mode-select">
        <p class="mode-select__lead">登録方法を選択してください</p>
        <div class="mode-select__cards">
          <button type="button" class="mode-card" @click="selectMode('employee')">
            <span class="mode-card__title">社員から選ぶ</span>
            <span class="mode-card__desc">社員を先に指定し、在室中の履歴を表示します</span>
          </button>
          <button type="button" class="mode-card" @click="selectMode('dorm')">
            <span class="mode-card__title">寮から選ぶ</span>
            <span class="mode-card__desc">寮・部屋を指定し、在室中の社員を選びます</span>
          </button>
        </div>
      </div>

      <template v-else>
        <el-steps :active="step" finish-status="success" align-center class="steps">
          <el-step v-for="(s, i) in stepTitles" :key="i" :title="s" />
        </el-steps>

        <!-- 社員から：社員選択 -->
        <div v-show="flowMode === 'employee' && step === 0" class="step-body">
          <el-form label-width="100px">
            <el-form-item label="社員" required>
              <el-select
                v-model="form.employeeId"
                filterable
                :loading="employeeLoading"
                @visible-change="(v) => v && loadMoveOutEmployees()"
                @change="onEmployeeChange"
                placeholder="クリックして退寮可能な社員を表示"
                no-data-text="退寮可能な社員がいません"
                style="width: 100%"
              >
                <el-option
                  v-for="e in employees"
                  :key="e.id"
                  :label="employeeOptionLabel(e)"
                  :value="e.id"
                />
              </el-select>
              <p v-if="employeesLoaded && !employees.length" class="field-hint field-hint--warn">
                現在在室中の社員がいません。
              </p>
            </el-form-item>
          </el-form>
        </div>

        <!-- 社員から：履歴選択 -->
        <div v-show="flowMode === 'employee' && step === 1" class="step-body">
          <el-alert v-if="!activeRecords.length && recordsLoaded" type="warning" title="在室中の履歴がありません" show-icon :closable="false" />
          <el-radio-group v-model="form.historyId" class="record-list">
            <el-radio v-for="h in activeRecords" :key="h.id" :value="h.id" border class="record-item">
              {{ h.dormName }} / {{ h.roomName }}（入居 {{ h.moveInDate }}）
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 寮から：寮選択 -->
        <div v-show="flowMode === 'dorm' && step === 0" class="step-body">
          <el-form label-width="100px">
            <el-form-item label="寮" required>
              <el-select v-model="form.dormId" filterable placeholder="寮を選択" style="width: 100%" @change="onDormChange">
                <el-option v-for="d in dorms" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- 寮から：部屋選択 -->
        <div v-show="flowMode === 'dorm' && step === 1" class="step-body">
          <el-radio-group v-model="form.roomId" class="room-list" @change="onRoomChange">
            <el-radio v-for="r in dormRooms" :key="r.id" :value="r.id" border class="room-item">
              {{ r.name || r.code }}
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 寮から：在室者選択 -->
        <div v-show="flowMode === 'dorm' && step === 2" class="step-body">
          <el-alert v-if="!dormOccupants.length && occupantsLoaded" type="warning" title="この部屋に在室者がいません" show-icon :closable="false" />
          <el-radio-group v-model="form.historyId" class="record-list">
            <el-radio v-for="h in dormOccupants" :key="h.id" :value="h.id" border class="record-item">
              {{ h.employeeName }}（入居 {{ h.moveInDate }}）
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 退寮日 -->
        <div v-show="isDateStep" class="step-body">
          <el-form label-width="100px">
            <el-form-item label="退寮日" required>
              <el-date-picker v-model="form.moveOutDate" type="date" value-format="YYYY-MM-DD" style="width: 240px" />
            </el-form-item>
            <el-form-item label="備考">
              <el-input v-model="form.moveOutReason" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 確認 -->
        <div v-show="isConfirmStep" class="step-body">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="社員">{{ selectedRecord?.employeeName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="寮・部屋">{{ selectedRecord?.dormName }} / {{ selectedRecord?.roomName }}</el-descriptions-item>
            <el-descriptions-item label="入居日">{{ selectedRecord?.moveInDate || '—' }}</el-descriptions-item>
            <el-descriptions-item label="退寮日">{{ form.moveOutDate }}</el-descriptions-item>
            <el-descriptions-item v-if="form.moveOutReason" label="備考">{{ form.moveOutReason }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="step-actions">
          <el-button @click="backStep">{{ step === 0 ? '方法選択へ' : '戻る' }}</el-button>
          <el-button v-if="!isConfirmStep" type="primary" @click="nextStep">次へ</el-button>
          <el-button v-else type="primary" :loading="submitting" @click="submit">退寮登録</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import * as occupancyApi from '@/api/occupancy';
import { getDorms } from '@/api/dorms';
import { getRooms } from '@/api/rooms';
import { todayISO } from '@/utils/date';
import {
  fetchMoveOutEligibleEmployees,
  employeeOptionLabel,
} from '@/views/occupancy/composables/useEligibleEmployees';

const router = useRouter();
const flowMode = ref('');
const step = ref(0);
const submitting = ref(false);
const employeeLoading = ref(false);
const employeesLoaded = ref(false);
const recordsLoaded = ref(false);
const occupantsLoaded = ref(false);
const employees = ref([]);
const activeRecords = ref([]);
const dorms = ref([]);
const dormRooms = ref([]);
const dormOccupants = ref([]);

const form = reactive({
  employeeId: '',
  dormId: '',
  roomId: '',
  historyId: '',
  moveOutDate: todayISO(),
  moveOutReason: '',
});

const stepTitles = computed(() =>
  flowMode.value === 'employee'
    ? ['社員選択', '履歴選択', '退寮日', '確認']
    : ['寮選択', '部屋選択', '在室者', '退寮日', '確認'],
);

const dateStepIndex = computed(() => (flowMode.value === 'employee' ? 2 : 3));
const confirmStepIndex = computed(() => (flowMode.value === 'employee' ? 3 : 4));
const isDateStep = computed(() => step.value === dateStepIndex.value);
const isConfirmStep = computed(() => step.value === confirmStepIndex.value);

const selectedRecord = computed(() => {
  const all = [...activeRecords.value, ...dormOccupants.value];
  return all.find((h) => h.id === form.historyId) || null;
});

function selectMode(mode) {
  flowMode.value = mode;
  step.value = 0;
  if (mode === 'dorm') loadDorms();
}

function backStep() {
  if (step.value === 0) {
    flowMode.value = '';
    return;
  }
  step.value--;
}

async function loadMoveOutEmployees() {
  employeeLoading.value = true;
  employeesLoaded.value = false;
  try {
    employees.value = await fetchMoveOutEligibleEmployees();
  } finally {
    employeeLoading.value = false;
    employeesLoaded.value = true;
  }
}

async function onEmployeeChange() {
  form.historyId = '';
  recordsLoaded.value = false;
  if (!form.employeeId) {
    activeRecords.value = [];
    return;
  }
  try {
    const res = await occupancyApi.getOccupancyHistories({
      employeeId: form.employeeId,
      occupancyStatus: 'active',
      page: 1,
      pageSize: 50,
    });
    activeRecords.value = (res?.items || []).filter(
      (h) => !(h.employeeDeleted || h.employee_deleted),
    );
  } catch {
    activeRecords.value = [];
  } finally {
    recordsLoaded.value = true;
  }
}

async function loadDorms() {
  if (dorms.value.length) return;
  try {
    const res = await getDorms({ page: 1, pageSize: 200 });
    dorms.value = res?.items || [];
  } catch {
    dorms.value = [];
  }
}

async function onDormChange() {
  form.roomId = '';
  form.historyId = '';
  dormRooms.value = [];
  if (!form.dormId) return;
  try {
    const res = await getRooms(form.dormId, { page: 1, pageSize: 200 });
    dormRooms.value = res?.items || [];
  } catch {
    dormRooms.value = [];
  }
}

async function onRoomChange() {
  form.historyId = '';
  occupantsLoaded.value = false;
  if (!form.roomId) {
    dormOccupants.value = [];
    return;
  }
  try {
    const res = await occupancyApi.getOccupancyHistories({
      roomId: form.roomId,
      occupancyStatus: 'active',
      page: 1,
      pageSize: 50,
    });
    dormOccupants.value = (res?.items || []).filter(
      (h) => !(h.employeeDeleted || h.employee_deleted),
    );
  } catch {
    dormOccupants.value = [];
  } finally {
    occupantsLoaded.value = true;
  }
}

async function nextStep() {
  if (flowMode.value === 'employee') {
    if (step.value === 0 && !form.employeeId) {
      ElMessage.warning('社員を選択してください');
      return;
    }
    if (step.value === 1 && !form.historyId) {
      ElMessage.warning('履歴を選択してください');
      return;
    }
    if (step.value === 2 && !form.moveOutDate) {
      ElMessage.warning('退寮日を選択してください');
      return;
    }
  } else {
    if (step.value === 0 && !form.dormId) {
      ElMessage.warning('寮を選択してください');
      return;
    }
    if (step.value === 1 && !form.roomId) {
      ElMessage.warning('部屋を選択してください');
      return;
    }
    if (step.value === 2 && !form.historyId) {
      ElMessage.warning('在室者を選択してください');
      return;
    }
    if (step.value === 3 && !form.moveOutDate) {
      ElMessage.warning('退寮日を選択してください');
      return;
    }
  }
  step.value++;
}

async function submit() {
  if (!form.historyId) return;
  submitting.value = true;
  try {
    await occupancyApi.moveOut(form.historyId, {
      moveOutDate: form.moveOutDate,
      moveOutReason: form.moveOutReason || undefined,
    });
    ElMessage.success('退寮を登録しました');
    router.push('/occupancy/history');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.mode-select__lead {
  margin: 0 0 20px;
  font-size: 15px;
  color: var(--app-text-secondary);
}
.mode-select__cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.mode-card {
  text-align: left;
  padding: 20px;
  border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border);
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.mode-card:hover {
  border-color: var(--app-accent);
  box-shadow: var(--app-shadow-sm);
}
.mode-card__title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}
.mode-card__desc {
  display: block;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.5;
}
.steps { margin-bottom: 32px; }
.step-body { min-height: 200px; padding: 8px 0 24px; }
.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--app-border-light);
  padding-top: 20px;
}
.record-list, .room-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.record-item, .room-item {
  width: 100%;
  margin: 0 !important;
  padding: 14px 16px;
  border-radius: var(--app-radius);
}
.field-hint { margin: 8px 0 0; font-size: 13px; color: var(--app-text-secondary); }
.field-hint--warn { color: #b45309; }
@media (max-width: 640px) {
  .mode-select__cards { grid-template-columns: 1fr; }
}
</style>
