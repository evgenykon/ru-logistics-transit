<script setup lang="ts">
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'vue-chartjs';

ChartJS.register(...registerables);

type ChartType = 'bar' | 'line' | 'doughnut' | 'pie';

const props = withDefaults(defineProps<{
  type?: ChartType;
  data: any;
  options?: any;
  height?: number;
  width?: number;
}>(), {
  type: 'bar',
  height: 300,
});

const chartComponents: Record<ChartType, any> = { bar: Bar, line: Line, doughnut: Doughnut, pie: Pie };

const chartComponent = computed(() => chartComponents[props.type]);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
};
</script>

<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }">
    <component
      :is="chartComponent"
      :data="data"
      :options="options || defaultOptions"
      :height="height"
      :width="width"
    />
  </div>
</template>

<style scoped lang="scss">
.chart-wrapper {
  width: 100%;
}
</style>
