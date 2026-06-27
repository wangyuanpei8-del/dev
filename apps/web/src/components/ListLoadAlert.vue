<template>
  <el-alert
    v-if="message"
    type="error"
    :title="message"
    show-icon
    :closable="false"
    class="list-load-alert"
  >
    <template v-if="showRetry" #default>
      <el-button type="primary" link @click="$emit('retry')">再読み込み</el-button>
    </template>
  </el-alert>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  showRetry: { type: Boolean, default: true },
});
defineEmits(['retry']);
</script>

<style scoped>
.list-load-alert {
  margin-bottom: 16px;
}
</style>
