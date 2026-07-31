<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import { pipelineStages, processSteps } from '../data/decisionTreeDemo'
import { useWorkspaceStore } from '../stores/workspace'

const runStates = ['UPLOADED', 'VALIDATING', 'PROFILED', 'READY', 'INVALID', 'ARCHIVED']
const configStates = ['DRAFT', 'VALIDATING', 'VALID', 'ACTIVE', 'SUPERSEDED', 'INVALID']
const experimentStates = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
const workspace = useWorkspaceStore()

onMounted(() => {
  if (!workspace.latestRun && !workspace.isBootstrapping) {
    workspace.bootstrap()
  }
})

const visibleProcessSteps = computed(() => {
  if (workspace.processWorkflowSteps.length) {
    return workspace.processWorkflowSteps.map((step: any) => ({
      ...step,
      statusLabel:
        step.status === 'available'
          ? 'Ready'
          : step.status === 'configured'
            ? 'Configured'
            : 'Waiting',
    }))
  }

  return processSteps.map((step, index) => ({
    step_number: index + 1,
    title: step.title,
    status: 'waiting',
    statusLabel: 'Waiting',
    notes: step.description,
  }))
})

function getProcessStatusClasses(status: string) {
  if (status === 'available') {
    return {
      card: 'border-emerald-300/20 bg-emerald-300/10',
      badge: 'border border-emerald-300/25 bg-emerald-300/15 text-emerald-100',
    }
  }

  if (status === 'configured') {
    return {
      card: 'border-amber-300/20 bg-amber-300/10',
      badge: 'border border-amber-300/25 bg-amber-300/15 text-amber-100',
    }
  }

  return {
    card: 'border-white/10 bg-black/20',
    badge: 'border border-white/10 bg-white/8 text-slate-200',
  }
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      eyebrow="User Journey"
      title="Urutan proses utama aplikasi"
      description="Ini adalah tahapan yang akan muncul di frontend sebagai panduan proses dari awal analisis sampai interpretasi model."
    >
      <div class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="step in visibleProcessSteps"
          :key="step.step_number"
          class="rounded-[1.6rem] border p-5"
          :class="getProcessStatusClasses(step.status).card"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/12 font-heading text-lg font-semibold text-cyan-100">
                {{ step.step_number }}
              </span>
              <h3 class="font-heading text-xl font-semibold text-white">{{ step.title }}</h3>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              :class="getProcessStatusClasses(step.status).badge"
            >
              {{ step.statusLabel }}
            </span>
          </div>
          <p class="mt-4 text-sm leading-6 text-slate-300">
            {{ step.notes || step.endpoint || step.visualization_type || step.description }}
          </p>
        </article>
      </div>
    </SectionCard>

      <SectionCard
        eyebrow="Workflow"
        title="End-to-end pipeline yang mengikuti spesifikasi backend"
        description="Urutan ini menegaskan kapan data dipisah, kapan preprocessing di-fit, dan kapan artifact atau event stream mulai muncul."
      >
        <div class="grid gap-4 lg:grid-cols-5">
          <article
            v-for="stage in pipelineStages"
            :key="stage.code"
            class="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/20 p-5"
          >
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-emerald-300 to-orange-300" />
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{{ stage.code }}</p>
          <h3 class="mt-3 font-heading text-2xl font-semibold">{{ stage.title }}</h3>
          <p class="mt-3 text-sm leading-6 text-slate-300">{{ stage.summary }}</p>
          <p class="mt-5 text-sm font-semibold text-cyan-100">{{ stage.status }} | {{ stage.progress }}%</p>
          <div class="mt-3 h-1.5 w-full rounded-full bg-white/10">
            <div
              class="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
              :style="{ width: `${stage.progress}%` }"
            />
          </div>
        </article>
      </div>
    </SectionCard>

    <section class="grid gap-6 xl:grid-cols-3">
      <SectionCard eyebrow="Dataset State" title="Lifecycle dataset">
        <div class="flex flex-wrap gap-3">
          <span
            v-for="state in runStates"
            :key="state"
            class="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200"
          >
            {{ state }}
          </span>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Config State" title="Lifecycle konfigurasi">
        <div class="flex flex-wrap gap-3">
          <span
            v-for="state in configStates"
            :key="state"
            class="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200"
          >
            {{ state }}
          </span>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Run State" title="Lifecycle eksperimen">
        <div class="flex flex-wrap gap-3">
          <span
            v-for="state in experimentStates"
            :key="state"
            class="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200"
          >
            {{ state }}
          </span>
        </div>
      </SectionCard>
    </section>

    <SectionCard
      eyebrow="Design Principles"
      title="Guardrails yang harus terlihat di UI"
      description="Ini adalah prinsip desain yang memengaruhi copywriting, warning surface, dan keputusan interaksi di frontend."
    >
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="font-medium text-white">No hidden target selection</p>
          <p class="mt-2 text-sm text-slate-300">Target recommendation selalu butuh konfirmasi user.</p>
        </div>
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="font-medium text-white">Immutable runs</p>
          <p class="mt-2 text-sm text-slate-300">Hasil lama tidak berubah ketika draft config diedit.</p>
        </div>
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="font-medium text-white">Visual payloads, not HTML</p>
          <p class="mt-2 text-sm text-slate-300">Backend mengirim angka, label, node, dan metadata yang siap dirender frontend.</p>
        </div>
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="font-medium text-white">Async-first mindset</p>
          <p class="mt-2 text-sm text-slate-300">Progress board dirancang untuk cocok dengan SSE dan polling fallback.</p>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
