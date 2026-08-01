<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import { confusionMatrix, featureImportanceOptions, featureImportanceSeries } from '../data/decisionTreeDemo'
import { useWorkspaceStore } from '../stores/workspace'

const workspace = useWorkspaceStore()

type ConfusionCell = {
  value: number
  label: string
  emphasis: string
}

onMounted(() => {
  if (!workspace.latestRun && !workspace.isBootstrapping) {
    workspace.bootstrap()
  }
})

const normalizeMatrixRow = (row: unknown): number[] => {
  if (Array.isArray(row)) {
    return row.map((value) => Number(value ?? 0))
  }

  if (row && typeof row === 'object') {
    return Object.values(row).map((value) => Number(value ?? 0))
  }

  return []
}

const liveConfusionLabels = computed(() => {
  const labels = workspace.latestConfusionMatrix?.labels

  if (Array.isArray(labels) && labels.length) {
    return labels.map((label: unknown) => String(label))
  }

  return ['Tidak', 'Ya']
})

const confusionLabelAt = (index: number | string) => {
  const numericIndex = Number(index)
  return liveConfusionLabels.value[numericIndex] ?? numericIndex + 1
}

const liveConfusionMatrix = computed(() => {
  const matrix = workspace.latestConfusionMatrix

  if (!matrix?.values?.length) {
    return confusionMatrix
  }

  const labels = liveConfusionLabels.value
  const rows = Array.isArray(matrix.values) ? matrix.values : []

  return rows.map((row: unknown, rowIndex: number) =>
    normalizeMatrixRow(row).map((value: number, columnIndex: number) => ({
      value,
      label: `Actual ${labels[rowIndex] ?? rowIndex + 1} / Pred ${labels[columnIndex] ?? columnIndex + 1}`,
      emphasis: value >= 50 ? 'high' : value >= 10 ? 'alert' : value >= 3 ? 'mid' : 'low',
    })),
  ).filter((row: ConfusionCell[]) => row.length)
})

const classMetrics = computed(() => {
  return workspace.latestClassMetrics?.map((metric: any) => ({
    label: metric.class_label,
    precision: metric.precision?.toFixed(4) ?? '--',
    recall: metric.recall?.toFixed(4) ?? '--',
    f1: metric.f1_score?.toFixed(4) ?? '--',
    support: `${metric.support ?? '--'}`,
  })) ?? [
    { label: 'Tidak', precision: '0.4286', recall: '0.1071', f1: '0.1714', support: '28' },
    { label: 'Ya', precision: '0.7423', recall: '0.9474', f1: '0.8324', support: '76' },
  ]
})

const aggregatedMetrics = computed(() => {
  const metrics = workspace.latestMetrics

  if (metrics) {
    return [
      { label: 'Accuracy', value: typeof metrics.accuracy === 'number' ? metrics.accuracy.toFixed(4) : '--' },
      { label: 'Precision', value: typeof metrics.precision === 'number' ? metrics.precision.toFixed(4) : '--' },
      { label: 'Recall', value: typeof metrics.recall === 'number' ? metrics.recall.toFixed(4) : '--' },
      { label: 'F1-Score', value: typeof (metrics.f1_score ?? metrics.f1) === 'number' ? (metrics.f1_score ?? metrics.f1).toFixed(4) : '--' },
    ]
  }

  const classification = workspace.latestRun?.result_json?.classification_report

  if (!classification) {
    return [
      { label: 'Accuracy', value: '0.7212' },
      { label: 'Macro F1', value: '0.4777' },
      { label: 'Weighted F1', value: '0.6423' },
      { label: 'Macro Recall', value: '0.5160' },
    ]
  }

  return [
    { label: 'Accuracy', value: Number(classification.accuracy ?? 0).toFixed(4) },
    { label: 'Macro F1', value: Number(classification['macro avg']?.['f1-score'] ?? 0).toFixed(4) },
    { label: 'Weighted F1', value: Number(classification['weighted avg']?.['f1-score'] ?? 0).toFixed(4) },
    { label: 'Macro Recall', value: Number(classification['macro avg']?.recall ?? 0).toFixed(4) },
  ]
})

const liveImportanceOptions = computed(() => {
  const features = workspace.latestImportance

  if (!features.length) {
    return featureImportanceOptions
  }

  return {
    ...featureImportanceOptions,
    xaxis: {
      ...featureImportanceOptions.xaxis,
      categories: features.slice(0, 8).map((item: any) => item.feature),
    },
  }
})

const liveImportanceSeries = computed(() => {
  const features = workspace.latestImportance

  if (!features.length) {
    return featureImportanceSeries
  }

  return [
    {
      name: 'Importance',
      data: features.slice(0, 8).map((item: any) => Number(item.importance.toFixed(4))),
    },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        eyebrow="Confusion Matrix"
        title="Orientasi yang eksplisit dan bisa diaudit"
        description="Rows merepresentasikan actual labels dan columns merepresentasikan predicted labels, persis seperti kontrak evaluasi di dokumen."
      >
        <div class="space-y-4">
          <div
            class="grid gap-3 text-center text-sm"
            :style="{ gridTemplateColumns: `120px repeat(${liveConfusionLabels.length}, minmax(0, 1fr))` }"
          >
            <div />
            <div
              v-for="label in liveConfusionLabels"
              :key="`pred-${label}`"
              class="rounded-2xl border border-white/10 bg-white/8 px-3 py-3"
            >
              Pred {{ label }}
            </div>

            <template v-for="(row, rowIndex) in liveConfusionMatrix" :key="rowIndex">
              <div class="rounded-2xl border border-white/10 bg-white/8 px-3 py-6">
                Actual {{ confusionLabelAt(rowIndex) }}
              </div>
              <div
                v-for="cell in row"
                :key="cell.label"
                class="rounded-[1.7rem] border px-3 py-6"
                :class="{
                  'border-emerald-300/20 bg-emerald-300/10': cell.emphasis === 'high',
                  'border-amber-300/20 bg-amber-300/10': cell.emphasis === 'mid',
                  'border-rose-300/20 bg-rose-300/10': cell.emphasis === 'alert',
                  'border-white/10 bg-black/20': cell.emphasis === 'low',
                }"
              >
                <p class="font-heading text-4xl font-semibold text-white">{{ cell.value }}</p>
                <p class="mt-2 text-xs uppercase tracking-[0.18em] text-slate-300">{{ cell.label }}</p>
              </div>
            </template>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Importance"
        title="Original feature importance yang siap divisualisasikan"
        description="Importance transformed dapat di-aggregate kembali ke variabel asli, lalu dibandingkan dengan permutation importance pada testing set."
      >
        <apexchart type="bar" height="360" :options="liveImportanceOptions" :series="liveImportanceSeries" />
      </SectionCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <SectionCard eyebrow="Aggregate Metrics" title="Ringkasan metrik global">
        <div class="grid gap-4 sm:grid-cols-2">
          <article
            v-for="metric in aggregatedMetrics"
            :key="metric.label"
            class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <p class="text-sm text-slate-400">{{ metric.label }}</p>
            <p class="mt-2 font-heading text-3xl font-semibold text-white">{{ metric.value }}</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Classification Report"
        title="Per-class metrics untuk binary atau multiclass"
        description="Frontend memformat angka 0-1 menjadi persen bila perlu, sementara backend mengirim raw decimals untuk presisi dan konsistensi."
      >
        <div class="overflow-hidden rounded-[1.6rem] border border-white/10">
          <table class="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead class="bg-white/8 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Class</th>
                <th class="px-4 py-3 font-medium">Precision</th>
                <th class="px-4 py-3 font-medium">Recall</th>
                <th class="px-4 py-3 font-medium">F1</th>
                <th class="px-4 py-3 font-medium">Support</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-black/20 text-slate-100">
              <tr v-for="row in classMetrics" :key="row.label">
                <td class="px-4 py-4 font-medium">{{ row.label }}</td>
                <td class="px-4 py-4">{{ row.precision }}</td>
                <td class="px-4 py-4">{{ row.recall }}</td>
                <td class="px-4 py-4">{{ row.f1 }}</td>
                <td class="px-4 py-4">{{ row.support }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </section>
  </div>
</template>
