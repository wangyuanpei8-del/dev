<template>
  <div class="page-container">
    <PageHeader title="入居登録" subtitle="ウィザード形式で登録">
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
            <span class="mode-card__desc">社員を先に指定し、割当可能な部屋を表示します</span>
          </button>
          <button type="button" class="mode-card" @click="selectMode('dorm')">
            <span class="mode-card__title">寮から選ぶ</span>
            <span class="mode-card__desc">寮・部屋を先に指定し、入居可能な社員を選びます</span>
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
                @visible-change="(v) => v && loadMoveInEmployees()"
                placeholder="クリックして入寮可能な社員を表示"
                no-data-text="入寮可能な社員がいません"
                style="width: 100%"
              >
                <el-option
                  v-for="e in employees"
                  :key="e.id"
                  :label="employeeOptionLabel(e)"
                  :value="e.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
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
          <el-alert v-if="!dormRooms.length && roomsLoaded" type="warning" title="部屋がありません" show-icon :closable="false" />
          <el-radio-group v-model="form.roomId" class="room-list">
            <el-radio v-for="r in dormRooms" :key="r.id" :value="r.id" border class="room-item">
              {{ r.name || r.code }}
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 部屋選択（社員フロー） / 社員選択（寮フロー） -->
        <div v-show="isRoomOrEmployeeStep" class="step-body">
          <template v-if="flowMode === 'employee'">
            <el-alert v-if="!assignableRooms.length && roomsLoaded" type="warning" title="該当する空室がありません" show-icon :closable="false" />
            <el-radio-group v-model="form.roomId" class="room-list">
              <el-radio v-for="r in assignableRooms" :key="r.id" :value="r.id" border class="room-item">
                {{ r.dormName || r.dorm?.name }} — {{ r.name || r.code }}
              </el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-form label-width="100px">
              <el-form-item label="社員" required>
                <el-select
                  v-model="form.employeeId"
                  filterable
                  :loading="employeeLoading"
                  @visible-change="(v) => v && loadMoveInEmployees()"
                  placeholder="入寮可能な社員を選択"
                  no-data-text="入寮可能な社員がいません"
                  style="width: 100%"
                >
                  <el-option
                    v-for="e in employees"
                    :key="e.id"
                    :label="employeeOptionLabel(e)"
                    :value="e.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </template>
        </div>

        <!-- 入居日 -->
        <div v-show="isDateStep" class="step-body">
          <el-form label-width="100px">
            <el-form-item label="入居日" required>
              <el-date-picker v-model="form.moveInDate" type="date" value-format="YYYY-MM-DD" style="width: 240px" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 確認 -->
        <div v-show="isConfirmStep" class="step-body">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="社員">{{ selectedEmployeeName }}</el-descriptions-item>
            <el-descriptions-item label="部屋">{{ selectedRoomLabel }}</el-descriptions-item>
            <el-descriptions-item label="入居日">{{ form.moveInDate }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="step-actions">
          <el-button @click="backStep">{{ step === 0 ? '方法選択へ' : '戻る' }}</el-button>
          <el-button v-if="!isConfirmStep" type="primary" @click="nextStep">次へ</el-button>
          <el-button v-else type="primary" :loading="submitting" @click="submit">登録</el-button>
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
import { getAssignableRooms } from '@/api/vacancies';
import { todayISO } from '@/utils/date';
import {
  fetchMoveInEligibleEmployees,
  employeeOptionLabel,
} from '@/views/occupancy/composables/useEligibleEmployees';

const router = useRouter();
const flowMode = ref('');
const step = ref(0);
const submitting = ref(false);
const employeeLoading = ref(false);
const roomsLoaded = ref(false);
const employees = ref([]);
const assignableRooms = ref([]);
const dorms = ref([]);
const dormRooms = ref([]);

const form = reactive({
  employeeId: '',
  dormId: '',
  roomId: '',
  moveInDate: todayISO(),
});

const stepTitles = computed(() =>
  flowMode.value === 'employee'
    ? ['社員選択', '部屋選択', '入居日', '確認']
    : ['寮選択', '部屋選択', '社員選択', '入居日', '確認'],
);

const roomOrEmployeeStep = computed(() => (flowMode.value === 'employee' ? 1 : 2));
const dateStepIndex = computed(() => (flowMode.value === 'employee' ? 2 : 3));
const confirmStepIndex = computed(() => (flowMode.value === 'employee' ? 3 : 4));
const isRoomOrEmployeeStep = computed(() => step.value === roomOrEmployeeStep.value);
const isDateStep = computed(() => step.value === dateStepIndex.value);
const isConfirmStep = computed(() => step.value === confirmStepIndex.value);

const selectedEmployeeName = computed(() => {
  const e = employees.value.find((x) => x.id === form.employeeId);
  return e?.fullName || e?.full_name || form.employeeId || '—';
});

const selectedRoomLabel = computed(() => {
  const all = [...assignableRooms.value, ...dormRooms.value];
  const r = all.find((x) => x.id === form.roomId);
  if (!r) return form.roomId || '—';
  const dormName = r.dormName || r.dorm?.name || '';
  const roomName = r.name || r.code || '';
  return [dormName, roomName].filter(Boolean).join(' — ') || form.roomId || '—';
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

async function loadMoveInEmployees() {
  employeeLoading.value = true;
  try {
    const gender = form.dormId
      ? dorms.value.find((d) => d.id === form.dormId)?.genderType || dorms.value.find((d) => d.id === form.dormId)?.gender_type
      : undefined;
    employees.value = await fetchMoveInEligibleEmployees({ gender });
  } finally {
    employeeLoading.value = false;
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
  dormRooms.value = [];
  roomsLoaded.value = false;
  if (!form.dormId) return;
  try {
    const res = await getRooms(form.dormId, { page: 1, pageSize: 200 });
    dormRooms.value = res?.items || [];
  } catch {
    dormRooms.value = [];
  } finally {
    roomsLoaded.value = true;
  }
}

async function loadAssignableRooms() {
  roomsLoaded.value = false;
  try {
    const res = await getAssignableRooms({
      employeeId: form.employeeId,
      moveInDate: form.moveInDate,
      roomId: flowMode.value === 'dorm' ? form.roomId : undefined,
    });
    assignableRooms.value = res?.items || res || [];
  } catch {
    assignableRooms.value = [];
  } finally {
    roomsLoaded.value = true;
  }
}

async function nextStep() {
  if (flowMode.value === 'employee') {
    if (step.value === 0 && !form.employeeId) {
      ElMessage.warning('社員を選択してください');
      return;
    }
    if (step.value === 1 && !form.roomId) {
      ElMessage.warning('部屋を選択してください');
      return;
    }
    if (step.value === 2 && !form.moveInDate) {
      ElMessage.warning('入居日を選択してください');
      return;
    }
    if (step.value === 0) await loadAssignableRooms();
  } else {
    if (step.value === 0 && !form.dormId) {
      ElMessage.warning('寮を選択してください');
      return;
    }
    if (step.value === 1 && !form.roomId) {
      ElMessage.warning('部屋を選択してください');
      return;
    }
    if (step.value === 2 && !form.employeeId) {
      ElMessage.warning('社員を選択してください');
      return;
    }
    if (step.value === 3 && !form.moveInDate) {
      ElMessage.warning('入居日を選択してください');
      return;
    }
  }
  if (flowMode.value === 'employee' && step.value === 0) await loadAssignableRooms();
  step.value++;
  if (flowMode.value === 'employee' && step.value === 1) await loadAssignableRooms();
}

async function submit() {
  submitting.value = true;
  try {
    await occupancyApi.createOccupancy({
      employeeId: form.employeeId,
      roomId: form.roomId,
      moveInDate: form.moveInDate,
    });
    ElMessage.success('入居を登録しました');
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
.room-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.room-item {
  width: 100%;
  margin: 0 !important;
  padding: 14px 16px;
  border-radius: var(--app-radius);
}
@media (max-width: 640px) {
  .mode-select__cards { grid-template-columns: 1fr; }
}
</style>
