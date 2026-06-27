<template>
  <div class="page-container">
    <PageHeader title="インポート" subtitle="Excel データの取り込み" />

    <div class="page-card">
      <el-steps :active="step" finish-status="success" align-center class="steps">
        <el-step title="アップロード" />
        <el-step title="マッピング" />
        <el-step title="プレビュー" />
        <el-step title="結果" />
      </el-steps>

      <div v-show="step === 0" class="step-body">
        <el-upload
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls,.csv"
          :on-change="onFileChange"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="el-upload__text">ファイルをドラッグ、またはクリックして選択</div>
        </el-upload>
        <el-button type="primary" class="upload-btn" :loading="uploading" :disabled="!selectedFile" @click="handleUpload">
          アップロード
        </el-button>
      </div>

      <div v-show="step === 1" class="step-body">
        <el-form label-width="140px">
          <el-form-item v-for="field in mappingFields" :key="field.key" :label="field.label">
            <el-select v-model="mapping[field.key]" clearable placeholder="列を選択" style="width: 100%">
              <el-option v-for="col in columns" :key="col" :label="col" :value="col" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-button type="primary" :loading="mappingLoading" @click="saveMapping">マッピング保存</el-button>
      </div>

      <div v-show="step === 2" class="step-body">
        <el-table :data="previewRows" stripe max-height="400" v-loading="previewLoading">
          <el-table-column
            v-for="col in previewColumns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="120"
            show-overflow-tooltip
          />
        </el-table>
        <el-empty v-if="!previewLoading && !previewRows.length" description="プレビューデータがありません" />
        <el-button type="primary" class="upload-btn" :loading="executing" @click="handleExecute">インポート実行</el-button>
      </div>

      <div v-show="step === 3" class="step-body">
        <el-result
          :icon="jobStatus === 'COMPLETED' ? 'success' : jobStatus === 'FAILED' ? 'error' : 'info'"
          :title="resultTitle"
          :sub-title="jobMessage"
        />
        <el-table v-if="importErrors.length" :data="importErrors" stripe class="error-table">
          <el-table-column prop="row" label="行" width="80" />
          <el-table-column prop="field" label="項目" width="120" />
          <el-table-column prop="message" label="エラー" min-width="200" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import { uploadImport, setMapping, getPreview, executeImport, getImportJob } from '@/api/import';

const step = ref(0);
const selectedFile = ref(null);
const uploading = ref(false);
const mappingLoading = ref(false);
const previewLoading = ref(false);
const executing = ref(false);
const jobId = ref(null);
const jobStatus = ref('');
const jobMessage = ref('');
const columns = ref([]);
const mapping = ref({});
const previewRows = ref([]);
const previewColumns = ref([]);
const importErrors = ref([]);
let pollTimer = null;

const mappingFields = [
  { key: 'employeeCode', label: '社員コード' },
  { key: 'fullName', label: '氏名' },
  { key: 'dormCode', label: '寮コード' },
  { key: 'roomCode', label: '部屋コード' },
];

const resultTitle = computed(() => {
  if (jobStatus.value === 'COMPLETED') return 'インポート完了';
  if (jobStatus.value === 'FAILED') return 'インポート失敗';
  if (jobStatus.value === 'EXECUTING') return '処理中…';
  return '結果';
});

function onFileChange(file) {
  selectedFile.value = file?.raw || null;
}

async function handleUpload() {
  if (!selectedFile.value) return;
  uploading.value = true;
  try {
    const res = await uploadImport(selectedFile.value);
    jobId.value = res.id || res.jobId;
    columns.value = res.columns || res.headers || [];
    step.value = 1;
  } finally {
    uploading.value = false;
  }
}

async function saveMapping() {
  mappingLoading.value = true;
  try {
    await setMapping(jobId.value, { mapping: mapping.value });
    step.value = 2;
    await loadPreview();
  } finally {
    mappingLoading.value = false;
  }
}

async function loadPreview() {
  previewLoading.value = true;
  try {
    const res = await getPreview(jobId.value);
    previewRows.value = res?.rows || res?.items || [];
    if (previewRows.value.length) {
      previewColumns.value = Object.keys(previewRows.value[0]);
    }
  } catch {
    previewRows.value = [];
  } finally {
    previewLoading.value = false;
  }
}

async function handleExecute() {
  executing.value = true;
  try {
    await executeImport(jobId.value);
    step.value = 3;
    pollJobStatus();
  } finally {
    executing.value = false;
  }
}

function pollJobStatus() {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const job = await getImportJob(jobId.value);
      jobStatus.value = job.status;
      jobMessage.value = job.message || '';
      importErrors.value = job.errors || [];
      if (job.status !== 'EXECUTING') {
        clearInterval(pollTimer);
        if (job.status === 'COMPLETED') ElMessage.success('インポートが完了しました');
      }
    } catch {
      clearInterval(pollTimer);
    }
  }, 2000);
}
</script>

<style scoped>
.steps {
  margin-bottom: 28px;
}

.step-body {
  min-height: 240px;
}

.upload-icon {
  font-size: 48px;
  color: var(--app-text-secondary);
}

.upload-btn {
  margin-top: 20px;
}

.error-table {
  margin-top: 20px;
}
</style>
