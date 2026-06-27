<template>
  <section v-if="issues.length" id="data-issues" class="data-issues">
    <div class="data-issues__head">
      <el-icon class="data-issues__icon"><WarningFilled /></el-icon>
      <div>
        <h2 class="data-issues__title">データに不整合があります</h2>
        <p class="data-issues__lead">該当する項目を開き、表示された操作を行ってください。</p>
      </div>
    </div>

    <article
      v-for="issue in displayIssues"
      :key="issue.id"
      class="data-issue"
    >
      <header class="data-issue__head">
        <h3 class="data-issue__title">{{ issue.message }}</h3>
        <span v-if="issue.count" class="data-issue__badge">{{ issue.count }} 件</span>
      </header>
      <p class="data-issue__guide">{{ issue.actionGuide }}</p>

      <ul v-if="issue.items?.length" class="data-issue-items">
        <li
          v-for="(item, idx) in issue.items"
          :key="item.historyId || item.roomId || item.employeeId || idx"
          class="data-issue-item"
        >
          <div class="data-issue-item__body">
            <strong class="data-issue-item__summary">{{ item.summary || item.employeeName || '—' }}</strong>
            <p v-if="item.detail" class="data-issue-item__detail">{{ item.detail }}</p>
            <p class="data-issue-item__action">{{ item.actionText }}</p>
          </div>
          <div class="data-issue-item__buttons">
            <router-link
              v-for="action in item.actions"
              :key="action.path + action.label"
              v-show="action.path"
              :to="action.path"
            >
              <el-button :type="action.primary ? 'primary' : 'default'" size="small">
                {{ action.label }}
              </el-button>
            </router-link>
          </div>
        </li>
      </ul>

      <div v-else-if="issue.id === 'resident_room_count_mismatch' && issue.relatedCount" class="data-issue__footer">
        <router-link to="#data-issues">
          <el-button size="small" type="primary" plain>↑ 上の個別項目を先に修正</el-button>
        </router-link>
        <router-link to="/occupancy/history">
          <el-button size="small">履歴一覧で確認</el-button>
        </router-link>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';
import { enrichDataIssues } from '@/utils/dataIssueGuide';

const props = defineProps({
  issues: { type: Array, default: () => [] },
});

const displayIssues = computed(() => {
  const enriched = enrichDataIssues(props.issues);
  const detail = enriched.filter((i) => i.id !== 'resident_room_count_mismatch' && (i.items?.length || i.actionGuide));
  const summary = enriched.find((i) => i.id === 'resident_room_count_mismatch');
  if (summary && detail.length) return [...detail, summary];
  return enriched.filter((i) => i.items?.length || i.actionGuide);
});
</script>

<style scoped>
.data-issues {
  padding: 20px 22px;
  margin-bottom: 20px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 16px;
}
.data-issues__head { display: flex; gap: 12px; margin-bottom: 16px; }
.data-issues__icon { font-size: 22px; color: #d97706; flex-shrink: 0; margin-top: 2px; }
.data-issues__title { margin: 0; font-size: 15px; font-weight: 700; color: #92400e; }
.data-issues__lead { margin: 4px 0 0; font-size: 13px; color: #b45309; }
.data-issue {
  padding: 16px; margin-top: 12px; background: #fff;
  border: 1px solid #fde68a; border-radius: 12px;
}
.data-issue__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.data-issue__title { margin: 0; font-size: 14px; font-weight: 600; }
.data-issue__badge {
  font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  background: #fef3c7; color: #92400e;
}
.data-issue__guide { margin: 0 0 12px; font-size: 13px; line-height: 1.6; color: var(--app-text-secondary); }
.data-issue-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.data-issue-item {
  padding: 14px; border-radius: 10px; background: var(--app-fill); border: 1px solid var(--app-border-light);
}
.data-issue-item__summary { display: block; font-size: 14px; }
.data-issue-item__detail { margin: 4px 0 0; font-size: 12px; color: var(--app-text-secondary); }
.data-issue-item__action { margin: 8px 0 0; font-size: 13px; color: #b45309; font-weight: 500; }
.data-issue-item__buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.data-issue__footer { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
