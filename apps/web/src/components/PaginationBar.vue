<template>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :total="total"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next"
    background
    @size-change="emitChange"
    @current-change="emitChange"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
});

const emit = defineEmits(['update:page', 'update:pageSize', 'change']);

const currentPage = computed({
  get: () => props.page,
  set: (v) => emit('update:page', v),
});

const pageSize = computed({
  get: () => props.pageSize,
  set: (v) => emit('update:pageSize', v),
});

function emitChange() {
  emit('change');
}
</script>
