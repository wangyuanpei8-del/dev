<template>
  <div class="page-container">
    <PageHeader title="寮費算定" subtitle="対象年月の寮費を一括算定">
      <template #actions>
        <el-button @click="$router.push('/fees')">一覧へ</el-button>
      </template>
    </PageHeader>

    <div class="page-card" style="max-width: 480px">
      <el-form ref="formRef" :model="form" :rules="calculateRules" label-width="100px">
        <el-form-item label="対象年月" prop="yearMonth">
          <el-input v-model="form.yearMonth" placeholder="2026-05" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleCalculate">算定実行</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/PageHeader.vue';
import { calculateFees } from '@/api/fees';
import { currentYearMonth } from '@/utils/date';

const router = useRouter();
const loading = ref(false);
const formRef = ref();
const form = reactive({ yearMonth: currentYearMonth() });

const calculateRules = {
  yearMonth: [{
    required: true,
    validator: (_rule, value, callback) => {
      if (!/^\d{4}-\d{2}$/.test(value || '')) {
        callback(new Error('YYYY-MM 形式'));
        return;
      }
      const month = Number.parseInt(String(value).split('-')[1], 10);
      if (month < 1 || month > 12) {
        callback(new Error('YYYY-MM 形式'));
        return;
      }
      callback();
    },
    trigger: 'blur',
  }],
};

async function handleCalculate() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await calculateFees(form);
    ElMessage.success('算定が完了しました');
    router.push('/fees');
  } finally {
    loading.value = false;
  }
}
</script>
