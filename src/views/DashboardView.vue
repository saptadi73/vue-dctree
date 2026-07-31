<script setup lang="ts">
import { computed } from 'vue'

const series = computed(() => [
  {
    name: 'Nodes',
    data: [22, 31, 40, 28, 51, 42],
  },
])

const chartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'Poppins, sans-serif',
  },
  colors: ['#0f172a'],
  dataLabels: { enabled: false },
  grid: {
    borderColor: '#e2e8f0',
    strokeDashArray: 4,
  },
  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: '48%',
    },
  },
  stroke: {
    show: true,
    width: 0,
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (value: number) => `${value}`,
    },
  },
}))

const summaryCards = [
  { label: 'Active branches', value: '124', note: '+12% this month' },
  { label: 'Pending review', value: '18', note: 'Needs quick follow-up' },
  { label: 'Linked menus', value: '36', note: 'Navigation synced' },
]
</script>

<template>
  <section class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
    <div class="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-slate-500">Overview</p>
          <h2 class="font-heading text-2xl font-semibold tracking-tight">Tree activity growth</h2>
        </div>
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live data demo</span>
      </div>

      <apexchart type="bar" height="320" :options="chartOptions" :series="series" />
    </div>

    <div class="grid gap-4">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-lg shadow-slate-200/40 backdrop-blur"
      >
        <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
        <p class="mt-3 font-heading text-4xl font-semibold tracking-tight">{{ card.value }}</p>
        <p class="mt-2 text-sm text-slate-600">{{ card.note }}</p>
      </article>
    </div>
  </section>
</template>
