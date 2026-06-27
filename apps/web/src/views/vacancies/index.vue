<template>
  <div class="page-container">
    <PageHeader title="空き室" subtitle="基準日時点の空室状況" />

    <div class="page-card" v-loading="loading">
      <ListLoadAlert :message="loadError" @retry="fetchList" />
      <el-form :inline="true" :model="filters" class="filter-bar">
        <el-form-item label="基準日">
          <el-date-picker v-model="filters.asOfDate" type="date" value-format="YYYY-MM-DD" @change="fetchList" />
        </el-form-item>
        <el-form-item label="地域">
          <el-input v-model="filters.location" clearable placeholder="地域" @change="fetchList" />
        </el-form-item>
        <el-form-item label="寮区分">
          <el-select v-model="filters.genderType" clearable placeholder="すべて" @change="fetchList">
            <el-option v-for="(label, key) in DormGenderTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">更新</el-button>
        </el-form-item>
      </el-form>

      <el-collapse v-if="list.length" v-model="expanded">
        <el-collapse-item v-for="dorm in list" :key="dorm.id || dorm.dormId" :name="dorm.id || dorm.dormId">
          <template #title>
            <span class="dorm-title">{{ dorm.name || dorm.dormName }}</span>
            <span class="text-muted" style="margin-left: 12px">{{ dorm.address }}</span>
          </template>
          <div class="room-grid">
            <div v-for="room in (dorm.rooms || [])" :key="room.id" class="room-card">
              <span class="room-name">{{ room.name || room.code }}</span>
              <span :class="badgeClass(room.status)">{{ VacancyStatusLabels[room.status] || room.status }}</span>
              <span v-if="room.status === 'OCCUPIED'" class="occupant">{{ room.occupantName || room.occupant_name }}</span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <el-empty v-if="!loading && !list.length" description="空室データがありません" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import { getVacancies } from '@/api/vacancies';
import { DormGenderTypeLabels, VacancyStatusLabels } from '@/constants/enums';
import { todayISO } from '@/utils/date';

const loading = ref(false);
const loadError = ref('');
const list = ref([]);
const expanded = ref([]);
const filters = reactive({ asOfDate: todayISO(), location: '', genderType: '' });

function badgeClass(status) {
  const map = {
    VACANT: 'status-badge status-badge--success',
    OCCUPIED: 'status-badge status-badge--info',
    RESERVED: 'status-badge status-badge--warning',
  };
  return map[status] || 'status-badge status-badge--neutral';
}

async function fetchList() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await getVacancies(filters);
    list.value = res?.items || res || [];
    expanded.value = list.value.map((d) => d.id || d.dormId).filter(Boolean);
  } catch {
    list.value = [];
    loadError.value = '空室データの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchList);
</script>

<style scoped>
.dorm-title {
  font-weight: 600;
  letter-spacing: -0.02em;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 8px 0;
}

.room-card {
  background: var(--app-fill);
  border-radius: var(--app-radius);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.room-name {
  font-weight: 500;
}

.occupant {
  font-size: 12px;
  color: var(--app-text-secondary);
}
</style>
