<script setup lang="ts">
import { ref, computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
);

interface DataPoint {
  date: string;
  open: number;
}

const props = defineProps<{
  chartData: DataPoint[];
  ticker: string;
}>();

const data = computed<ChartData<'line'>>(() => ({
  datasets: [
    {
      label: `История цены ${props.ticker}`,
      backgroundColor: '#42b983',
      borderColor: '#42b983',
      data: props.chartData.map((d) => ({ x: new Date(d.date).valueOf(), y: d.open })),
    },
  ],
}));

const options = ref<ChartOptions<'line'>>({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
        tooltipFormat: 'PP',
      },
      title: {
        display: true,
        text: 'Дата',
      },
    },
    y: {
      title: {
        display: true,
        text: 'Цена ($)',
      },
    },
  },
  plugins: {
    legend: {
      display: true,
    },
  },
});
</script>

<template>
  <div style="height: 400px">
    <Line :data="data" :options="options" v-if="chartData.length" />
    <p v-else>Загрузка данных для графика...</p>
  </div>
</template>
