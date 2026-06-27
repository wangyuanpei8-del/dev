<template>
  <pre class="json-viewer">{{ formatted }}</pre>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: [Object, Array, String, Number, Boolean, null], default: null },
});

const formatted = computed(() => {
  if (props.data == null) return '—';
  if (typeof props.data === 'string') {
    try {
      return JSON.stringify(JSON.parse(props.data), null, 2);
    } catch {
      return props.data;
    }
  }
  return JSON.stringify(props.data, null, 2);
});
</script>

<style scoped>
.json-viewer {
  margin: 0;
  padding: 16px;
  background: var(--app-fill);
  border-radius: var(--app-radius);
  font-size: 12px;
  line-height: 1.6;
  overflow: auto;
  max-height: 400px;
  color: var(--app-text);
  font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
}
</style>
