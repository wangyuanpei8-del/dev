<template>
  <div class="audit-change">
    <template v-if="diffRows.length">
      <el-table :data="diffRows" size="small" stripe>
        <el-table-column prop="label" label="項目" width="140" />
        <el-table-column label="変更前" min-width="120">
          <template #default="{ row }">
            <span class="audit-change__before">{{ row.before }}</span>
          </template>
        </el-table-column>
        <el-table-column label="変更後" min-width="120">
          <template #default="{ row }">
            <span class="audit-change__after">{{ row.after }}</span>
          </template>
        </el-table-column>
      </el-table>
    </template>
    <template v-else-if="beforeOnly.length || afterOnly.length">
      <div v-if="beforeOnly.length" class="audit-change__block">
        <h5>変更前</h5>
        <dl class="audit-change__dl">
          <div v-for="row in beforeOnly" :key="'b-' + row.key" class="audit-change__row">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.before }}</dd>
          </div>
        </dl>
      </div>
      <div v-if="afterOnly.length" class="audit-change__block">
        <h5>変更後</h5>
        <dl class="audit-change__dl">
          <div v-for="row in afterOnly" :key="'a-' + row.key" class="audit-change__row">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.after || row.before }}</dd>
          </div>
        </dl>
      </div>
    </template>
    <el-empty v-else description="表示できる変更内容がありません" :image-size="64" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { auditSideSummary, diffAuditRecords } from '@/utils/auditDiff';

const props = defineProps({
  before: { type: [Object, String, null], default: null },
  after: { type: [Object, String, null], default: null },
});

const diffRows = computed(() => diffAuditRecords(props.before, props.after));
const beforeOnly = computed(() => (props.before && !props.after ? auditSideSummary(props.before) : []));
const afterOnly = computed(() => (!props.before && props.after ? auditSideSummary(props.after) : []));
</script>

<style scoped>
.audit-change__before {
  color: var(--el-color-danger);
}
.audit-change__after {
  color: var(--el-color-success);
  font-weight: 600;
}
.audit-change__block h5 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-secondary);
}
.audit-change__dl {
  margin: 0;
}
.audit-change__row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--app-border-light);
  font-size: 13px;
}
.audit-change__row dt {
  color: var(--app-text-secondary);
}
.audit-change__row dd {
  margin: 0;
  word-break: break-word;
}
</style>
