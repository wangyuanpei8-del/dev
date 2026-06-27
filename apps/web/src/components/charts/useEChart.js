import * as echarts from 'echarts';
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

export function useEChart(optionRef) {
  const elRef = ref(null);
  const chart = shallowRef(null);

  function render() {
    if (!elRef.value || !optionRef.value) return;
    if (!chart.value) {
      chart.value = echarts.init(elRef.value);
    }
    chart.value.setOption(optionRef.value, { notMerge: true });
  }

  function resize() {
    chart.value?.resize();
  }

  onMounted(() => {
    render();
    window.addEventListener('resize', resize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', resize);
    chart.value?.dispose();
    chart.value = null;
  });

  watch(optionRef, render, { deep: true });

  return { elRef, chart, render, resize };
}
