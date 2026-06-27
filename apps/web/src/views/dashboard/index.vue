<template>
  <div class="home">
    <header class="home__hero">
      <div>
        <p class="home__date">{{ dateLabel }}</p>
        <h1 class="home__title">おはようございます</h1>
        <p class="home__lead">今日の寮運営状況です</p>
      </div>
    </header>

    <ListLoadAlert :message="loadError" @retry="loadDashboard" />

    <section v-loading="loading" class="home__stats">
      <div class="stat">
        <span class="stat__value">{{ payload.summary?.residentCount ?? '—' }}<small>名</small></span>
        <span class="stat__label">在室</span>
        <span class="stat__hint">退寮未登録の社員</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ payload.summary?.vacantCount ?? '—' }}<small>室</small></span>
        <span class="stat__label">空室</span>
        <span class="stat__hint">今すぐ入居可</span>
      </div>
      <div class="stat">
        <span class="stat__value">
          {{ payload.summary?.occupiedRoomCount ?? '—' }}
          <span class="stat__slash">/</span>
          {{ payload.summary?.totalRooms ?? '—' }}<small>室</small>
        </span>
        <span class="stat__label">使用中</span>
        <span class="stat__hint">物理的に使用中（退寮当日含む）</span>
      </div>
    </section>

    <div class="usage-bar" role="img" :aria-label="usageSummary">
      <span class="usage-bar__fill" :style="{ width: `${occupancyRate}%` }" />
    </div>
    <p class="usage-caption">{{ usageSummary }}</p>

    <DataIssuePanel :issues="payload.issues || []" />

    <section class="home__actions">
      <router-link to="/occupancy/create" class="action-btn action-btn--primary">
        <el-icon><Plus /></el-icon>
        <span>入寮</span>
      </router-link>
      <router-link to="/occupancy/move-out" class="action-btn">
        <el-icon><SwitchButton /></el-icon>
        <span>退寮</span>
      </router-link>
      <router-link to="/allocation-calendar" class="action-btn">
        <el-icon><Calendar /></el-icon>
        <span>寮割</span>
      </router-link>
      <router-link to="/vacancies" class="action-btn">
        <el-icon><Key /></el-icon>
        <span>空室</span>
      </router-link>
    </section>

    <section v-if="hasTodos" class="home__todos">
      <h2 class="section-title">要対応</h2>
      <ul class="todo-list">
        <li v-if="payload.todos?.draftFeeCount">
          <router-link to="/fees?status=DRAFT">下書き寮費 <el-badge :value="payload.todos.draftFeeCount" /></router-link>
        </li>
        <li v-if="payload.todos?.longTermCount">
          <router-link to="/occupancy/long-term">長期利用警告 <el-badge :value="payload.todos.longTermCount" /></router-link>
        </li>
        <li v-if="payload.todos?.inconsistentCount">
          <router-link :to="{ path: '/', hash: '#data-issues' }">データ整合性 <el-badge :value="payload.todos.inconsistentCount" /></router-link>
        </li>
      </ul>
    </section>

    <section v-if="payload.dormBreakdown?.length" class="home__dorms">
      <h2 class="section-title">寮別状況</h2>
      <div v-for="d in payload.dormBreakdown" :key="d.name" class="dorm-row">
        <span class="dorm-row__name">{{ d.name }}</span>
        <div class="dorm-row__bar">
          <span class="dorm-row__fill" :style="{ width: dormRate(d) + '%' }" />
        </div>
        <span class="dorm-row__meta">{{ d.occupied }}/{{ d.total }}室</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Calendar, Key, Plus, SwitchButton } from '@element-plus/icons-vue';
import DataIssuePanel from '@/components/DataIssuePanel.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import { loadDashboardPayload } from '@/api/dashboard';
import { formatJapaneseDate, todayISO } from '@/utils/date';

const loading = ref(false);
const loadError = ref('');
const payload = reactive({
  summary: {},
  issues: [],
  dormBreakdown: [],
  todos: {},
});

const dateLabel = computed(() => formatJapaneseDate(new Date()));

const occupancyRate = computed(() => {
  const total = payload.summary?.totalRooms || 0;
  const occupied = payload.summary?.occupiedRoomCount || 0;
  return total ? Math.round((occupied / total) * 100) : 0;
});

const usageSummary = computed(() => {
  const total = payload.summary?.totalRooms ?? 0;
  const rooms = payload.summary?.occupiedRoomCount ?? 0;
  const people = payload.summary?.residentCount ?? 0;
  let text = `全部屋 ${total}室のうち ${rooms}室が使用中（${occupancyRate.value}%）`;
  if (people !== rooms) {
    text += ` · 退寮未登録 ${people}名`;
    if (people < rooms) {
      text += '（退寮登録済みの当日分が部屋数に含まれる場合があります）';
    }
  }
  return text;
});

const hasTodos = computed(() =>
  (payload.todos?.draftFeeCount || 0) + (payload.todos?.longTermCount || 0) + (payload.todos?.inconsistentCount || 0) > 0,
);

function dormRate(d) {
  return d.total ? Math.round((d.occupied / d.total) * 100) : 0;
}

async function loadDashboard() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await loadDashboardPayload(todayISO());
    Object.assign(payload, data);
  } catch {
    loadError.value = 'ホームデータの取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped>
.home { max-width: 920px; margin: 0 auto; }
.home__hero { margin-bottom: 24px; }
.home__date { margin: 0; font-size: 13px; color: var(--app-text-secondary); }
.home__title { margin: 6px 0 0; font-size: 28px; font-weight: 700; }
.home__lead { margin: 6px 0 0; color: var(--app-text-secondary); }
.home__stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 12px;
}
.stat {
  padding: 18px 20px; background: #fff; border: 1px solid var(--app-border-light); border-radius: 14px;
}
.stat__value { font-size: 28px; font-weight: 700; color: var(--app-accent); }
.stat__value small { font-size: 14px; font-weight: 600; margin-left: 2px; }
.stat__slash { margin: 0 2px; color: var(--app-text-secondary); font-weight: 500; }
.stat__label { display: block; margin-top: 6px; font-weight: 600; }
.stat__hint { display: block; margin-top: 4px; font-size: 12px; color: var(--app-text-secondary); }
.usage-bar { height: 8px; border-radius: 999px; background: var(--app-fill); overflow: hidden; }
.usage-bar__fill {
  display: block; height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--app-accent), #22d3ee);
}
.usage-caption { margin: 10px 0 20px; font-size: 13px; color: var(--app-text-secondary); }
.home__actions {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px;
}
.action-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 12px; border-radius: 14px; background: #fff;
  border: 1px solid var(--app-border-light); text-decoration: none; color: var(--app-text);
  font-weight: 600; transition: border-color 0.15s, box-shadow 0.15s;
}
.action-btn:hover { border-color: var(--app-accent); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.action-btn--primary { background: var(--app-accent); color: #fff; border-color: transparent; }
.action-btn--primary:hover { filter: brightness(1.05); }
.section-title { margin: 0 0 12px; font-size: 15px; font-weight: 700; }
.home__todos, .home__dorms {
  padding: 18px 20px; margin-bottom: 16px; background: #fff;
  border: 1px solid var(--app-border-light); border-radius: 14px;
}
.todo-list { list-style: none; margin: 0; padding: 0; }
.todo-list li + li { margin-top: 8px; }
.todo-list a { color: var(--app-text); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
.dorm-row { display: grid; grid-template-columns: 120px 1fr 72px; gap: 12px; align-items: center; margin-bottom: 10px; }
.dorm-row__name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dorm-row__bar { height: 8px; background: var(--app-fill); border-radius: 999px; overflow: hidden; }
.dorm-row__fill { display: block; height: 100%; background: var(--app-accent); border-radius: 999px; }
.dorm-row__meta { font-size: 12px; color: var(--app-text-secondary); text-align: right; }
@media (max-width: 720px) {
  .home__stats, .home__actions { grid-template-columns: repeat(2, 1fr); }
}
</style>
