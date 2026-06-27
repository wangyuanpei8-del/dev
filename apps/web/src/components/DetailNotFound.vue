<template>
  <div class="page-card detail-not-found">
    <el-result icon="warning" :title="title" :sub-title="subTitle">
      <template #extra>
        <el-button type="primary" @click="$router.push(backTo)">{{ backLabel }}</el-button>
        <el-button v-if="showRetry" @click="$emit('retry')">再読み込み</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'データが見つかりません' },
  subTitle: { type: String, default: '削除されたか、URL が正しくない可能性があります。' },
  backTo: { type: String, default: '/' },
  backLabel: { type: String, default: '一覧へ戻る' },
  showRetry: { type: Boolean, default: false },
});
defineEmits(['retry']);
</script>

<style scoped>
.detail-not-found {
  max-width: 560px;
  margin: 0 auto;
}
</style>
