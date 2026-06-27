<template>
  <div class="page-container occupancy-hub">
    <section class="hub-hero">
      <p class="hub-hero__eyebrow">入退寮管理</p>
      <h1 class="hub-hero__title">入退寮</h1>
      <p class="hub-hero__lead">行いたい操作を選んでください</p>
      <p v-if="occupiedCount != null" class="hub-hero__stat">
        現在の在室人数：<strong>{{ occupiedCount }}</strong> 名
      </p>
    </section>

    <ListLoadAlert :message="statError" @retry="loadOccupiedCount" />

    <div class="hub-grid">
      <ActionHubCard
        v-permission="'occupancy:write'"
        title="入寮登録"
        description="社員の入居を登録します。社員から選ぶ／寮から選ぶ、どちらも可能です。"
        :icon="CirclePlusFilled"
        to="/occupancy/create"
        tone="enter"
      />
      <ActionHubCard
        v-permission="'occupancy:write'"
        title="退寮登録"
        description="在室中の社員の退寮を登録します。社員から選ぶ／寮から選ぶ、どちらも可能です。"
        :icon="RemoveFilled"
        to="/occupancy/move-out"
        tone="exit"
      />
      <ActionHubCard
        title="入退寮履歴"
        description="過去の入退寮記録を検索・確認し、CSV 出力もできます。"
        :icon="List"
        to="/occupancy/history"
        tone="history"
        :badge="occupiedCount != null ? `${occupiedCount} 在室` : null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { CirclePlusFilled, RemoveFilled, List } from '@element-plus/icons-vue';
import ActionHubCard from '@/components/ActionHubCard.vue';
import ListLoadAlert from '@/components/ListLoadAlert.vue';
import { getOccupiedCount } from '@/api/occupancy';
import { todayISO } from '@/utils/date';

const occupiedCount = ref(null);
const statError = ref('');

async function loadOccupiedCount() {
  statError.value = '';
  try {
    const res = await getOccupiedCount({ activeOn: todayISO() });
    occupiedCount.value = res?.count ?? res?.occupiedCount ?? null;
  } catch {
    occupiedCount.value = null;
    statError.value = '在室人数の取得に失敗しました';
  }
}

onMounted(loadOccupiedCount);
</script>

<style scoped>
.occupancy-hub {
  max-width: 960px;
  margin: 0 auto;
}

.hub-hero {
  margin-bottom: 32px;
}

.hub-hero__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hub-hero__title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.hub-hero__lead {
  margin: 0;
  font-size: 15px;
  color: var(--app-text-secondary);
}

.hub-hero__stat {
  margin: 16px 0 0;
  font-size: 14px;
  color: var(--app-text-secondary);
}

.hub-hero__stat strong {
  font-size: 20px;
  color: var(--app-text);
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .hub-grid {
    grid-template-columns: 1fr;
  }
}

.hub-grid:has(.hub-card:only-child) {
  grid-template-columns: minmax(280px, 420px);
  justify-content: center;
}
</style>
