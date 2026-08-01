<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import SectionCard from '../components/SectionCard.vue'
import { useWorkspaceStore } from '../stores/workspace'

const workspace = useWorkspaceStore()

onMounted(() => {
  if (!workspace.latestRun && !workspace.isBootstrapping) {
    workspace.bootstrap()
  }
})

const steps = computed(() => workspace.processWorkflowSteps)
const runSummaryCards = computed(() => {
  const metrics = workspace.latestMetrics
  const split = workspace.latestRun?.result_json?.dataset_split

  return [
    {
      label: 'Run',
      value: workspace.latestRun?.run_name ?? '--',
      note: workspace.latestRun?.status ?? 'No run loaded',
    },
    {
      label: 'Accuracy',
      value: typeof metrics?.accuracy === 'number' ? `${(metrics.accuracy * 100).toFixed(2)}%` : '--',
      note: 'Dari endpoint metrics',
    },
    {
      label: 'Testing Rows',
      value: split?.testing_rows ? `${split.testing_rows}` : '--',
      note: 'Dataset split backend',
    },
    {
      label: 'Workflow Steps',
      value: `${steps.value.length || 7}`,
      note: 'Timeline analisis',
    },
  ]
})

function getStatusClass(status: string) {
  if (status === 'available') return 'border-emerald-300/20 bg-emerald-300/10'
  if (status === 'configured') return 'border-amber-300/20 bg-amber-300/10'
  return 'border-white/10 bg-black/20'
}

function getRouteForStep(code: string) {
  if (code === 'eda') return '/eda'
  if (code === 'preprocessing' || code === 'target-conversion') return '/config-studio'
  if (code === 'model-training') return '/pipeline'
  if (code === 'confusion-matrix' || code === 'metrics') return '/evaluation-lab'
  return '/tree-explorer'
}

const routeLabels = {
  'eda': 'Lihat EDA',
  'preprocessing': 'Lihat preprocessing',
  'target-conversion': 'Lihat konversi target',
  'model-training': 'Lihat pipeline',
  'confusion-matrix': 'Lihat confusion matrix',
  'metrics': 'Lihat metrik',
  'decision-tree-visualization': 'Lihat tree',
}

function getRouteLabel(code: string) {
  return routeLabels[code as keyof typeof routeLabels] ?? 'Lihat visual'
}

function getStepPayload(step: any) {
  if (step.code === 'target-conversion') {
    return [
      ['Target', step.data?.target_column ?? workspace.targetConversionPreview?.target_column ?? '--'],
      ['Positive class', step.data?.positive_class ?? workspace.targetConversionPreview?.positive_class ?? '--'],
    ]
  }

  if (step.code === 'preprocessing') {
    return [
      ['Numeric', `${workspace.preprocessingSummary?.numeric_features?.length ?? 0}`],
      ['Categorical', `${workspace.preprocessingSummary?.categorical_features?.length ?? 0}`],
      ['Encoded features', `${workspace.preprocessingSummary?.feature_count_after_encoding ?? '--'}`],
    ]
  }

  if (step.code === 'metrics') {
    const f1Score = workspace.latestMetrics?.f1_score ?? workspace.latestMetrics?.f1

    return [
      ['Accuracy', typeof workspace.latestMetrics?.accuracy === 'number' ? `${(workspace.latestMetrics.accuracy * 100).toFixed(2)}%` : '--'],
      ['F1', typeof f1Score === 'number' ? `${(f1Score * 100).toFixed(2)}%` : '--'],
    ]
  }

  if (step.code === 'confusion-matrix') {
    return [['Labels', workspace.latestConfusionMatrix?.labels?.join(', ') ?? '--']]
  }

  if (step.code === 'decision-tree-visualization') {
    return [['Nodes', `${workspace.latestTree?.nodes?.length ?? 0}`]]
  }

  return []
}
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in runSummaryCards"
        :key="card.label"
        class="rounded-[1.6rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl"
      >
        <p class="text-sm text-slate-400">{{ card.label }}</p>
        <p class="mt-2 font-heading text-2xl font-semibold text-white">{{ card.value }}</p>
        <p class="mt-2 text-sm text-slate-300">{{ card.note }}</p>
      </article>
    </section>

    <SectionCard
      eyebrow="Workflow Detail"
      title="Workflow 7 langkah dari backend"
      description="Setiap kartu di bawah ini memakai struktur `workflow-visualization`, lalu dihubungkan ke halaman frontend yang paling relevan."
    >
      <div class="space-y-4">
        <article
          v-for="step in steps"
          :key="step.step_number"
          class="rounded-[1.7rem] border p-5"
          :class="getStatusClass(step.status)"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/12 font-heading text-lg font-semibold text-cyan-100">
              {{ step.step_number }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <h3 class="font-heading text-2xl font-semibold text-white">{{ step.title }}</h3>
                <span class="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
                  {{ step.status }}
                </span>
              </div>
              <p class="mt-3 text-sm leading-6 text-slate-300">
                {{ step.notes || step.endpoint || step.visualization_type || 'No extra detail available.' }}
              </p>
              <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div class="rounded-[1.3rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  <p>Visualization: {{ step.visualization_type ?? '--' }}</p>
                  <p class="mt-2">Endpoint: {{ step.endpoint ?? 'dataset-level or not attached to this run' }}</p>

                  <div v-if="getStepPayload(step).length" class="mt-4 flex flex-wrap gap-2">
                    <span
                      v-for="[label, value] in getStepPayload(step)"
                      :key="`${step.code}-${label}`"
                      class="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100"
                    >
                      {{ label }}: {{ value }}
                    </span>
                  </div>
                </div>

                <RouterLink
                  :to="getRouteForStep(step.code)"
                  class="inline-flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/20"
                >
                  {{ getRouteLabel(step.code) }}
                </RouterLink>
              </div>
            </div>
          </div>
        </article>
      </div>
    </SectionCard>
  </div>
</template>
