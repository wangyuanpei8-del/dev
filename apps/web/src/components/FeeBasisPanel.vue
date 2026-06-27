<template>
  <div v-if="parsed" class="fee-basis">
    <div v-if="feeContext" class="fee-basis__summary">
      <p v-if="feeContext.employeeName" class="fee-basis__line">
        <span class="fee-basis__label">社員</span>
        <strong>{{ feeContext.employeeName }}</strong>
      </p>
      <p v-if="feeContext.yearMonth" class="fee-basis__line">
        <span class="fee-basis__label">対象年月</span>
        <strong>{{ feeContext.yearMonth }}</strong>
      </p>
      <p v-if="feeContext.totalAmount != null" class="fee-basis__line">
        <span class="fee-basis__label">寮費合計</span>
        <strong class="fee-basis__amount">{{ formatYen(feeContext.totalAmount) }}</strong>
      </p>
    </div>

    <el-alert
      v-if="parsed.legacyNote"
      type="info"
      :title="parsed.legacyNote"
      show-icon
      :closable="false"
      class="fee-basis__alert"
    />

    <template v-if="parsed.parts.length">
      <p class="fee-basis__formula">{{ parsed.formulaText }}</p>
      <p class="fee-basis__meta">当月日数：<strong>{{ parsed.daysInMonth }}</strong> 日</p>

      <article v-for="part in parsed.parts" :key="part.index" class="fee-basis-part">
        <header class="fee-basis-part__head">
          <span class="fee-basis-part__no">部屋 {{ part.index }}</span>
          <strong v-if="part.locationLabel" class="fee-basis-part__place">{{ part.locationLabel }}</strong>
          <span v-else class="fee-basis-part__place">{{ part.roomTypeLabel }}</span>
        </header>

        <dl class="fee-basis-part__grid">
          <div class="fee-basis-part__row">
            <dt>部屋種別</dt>
            <dd>{{ part.roomTypeLabel }}</dd>
          </div>
          <div v-if="part.areaSqm != null" class="fee-basis-part__row">
            <dt>面積</dt>
            <dd>{{ part.areaSqm }} ㎡</dd>
          </div>
          <div v-if="part.dailyRateYen != null" class="fee-basis-part__row">
            <dt>日単価</dt>
            <dd>{{ formatYen(part.dailyRateYen) }} / 日</dd>
          </div>
          <div class="fee-basis-part__row">
            <dt>在室日数</dt>
            <dd>{{ part.occupiedDays }} 日</dd>
          </div>
        </dl>

        <p v-if="part.partAmountYen != null && part.areaSqm != null" class="fee-basis-part__calc">
          {{ part.areaSqm }} × {{ formatYen(part.dailyRateYen) }} × {{ part.occupiedDays }}
          ÷ {{ parsed.daysInMonth }}
          ＝ <strong>{{ formatYen(part.partAmountYen) }}</strong>
        </p>
      </article>

      <footer v-if="parsed.totalFromParts != null && parsed.parts.length > 1" class="fee-basis__total">
        部屋別合計：<strong>{{ formatYen(parsed.totalFromParts) }}</strong>
        <span class="fee-basis__total-hint">（端数処理前の参考値）</span>
      </footer>
    </template>
  </div>

  <el-empty v-else description="内訳データがありません" :image-size="64" />
</template>

<script setup>
import { computed } from 'vue';
import { formatYen, parseFeeBasis } from '@/utils/feeBasis';

const props = defineProps({
  basis: { type: [Object, Array, String], default: null },
  feeContext: {
    type: Object,
    default: () => ({}),
  },
});

const parsed = computed(() => {
  let raw = props.basis;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return parseFeeBasis(raw);
});
</script>

<style scoped>
.fee-basis__summary {
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--app-fill);
}
.fee-basis__line {
  margin: 0 0 8px;
  font-size: 14px;
}
.fee-basis__line:last-child {
  margin-bottom: 0;
}
.fee-basis__label {
  display: inline-block;
  min-width: 5.5em;
  color: var(--app-text-secondary);
}
.fee-basis__amount {
  color: var(--app-accent);
}
.fee-basis__alert {
  margin-bottom: 16px;
}
.fee-basis__formula {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--app-text-secondary);
}
.fee-basis__meta {
  margin: 0 0 16px;
  font-size: 14px;
}
.fee-basis-part {
  margin-bottom: 14px;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
}
.fee-basis-part__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}
.fee-basis-part__no {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-accent);
}
.fee-basis-part__place {
  font-size: 15px;
}
.fee-basis-part__grid {
  margin: 0;
  display: grid;
  gap: 8px;
}
.fee-basis-part__row {
  display: grid;
  grid-template-columns: 6.5em 1fr;
  gap: 8px;
  font-size: 14px;
}
.fee-basis-part__row dt {
  margin: 0;
  color: var(--app-text-secondary);
}
.fee-basis-part__row dd {
  margin: 0;
  font-weight: 500;
}
.fee-basis-part__calc {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px dashed var(--app-border);
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.6;
}
.fee-basis-part__calc strong {
  color: var(--app-text);
  font-size: 15px;
}
.fee-basis__total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
  font-size: 14px;
}
.fee-basis__total-hint {
  margin-left: 6px;
  font-size: 12px;
  color: var(--app-text-secondary);
}
</style>
