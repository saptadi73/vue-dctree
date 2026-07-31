<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { DatabaseZap, FileUp, Play, Server, Sparkles, TriangleAlert } from '@lucide/vue'
import MetricTile from '../components/MetricTile.vue'
import SectionCard from '../components/SectionCard.vue'
import { processSteps } from '../data/decisionTreeDemo'
import { useWorkspaceStore } from '../stores/workspace'

const workspace = useWorkspaceStore()
const selectedFile = ref<File | null>(null)

onMounted(() => {
  if (!workspace.activeDataset && !workspace.isBootstrapping) {
    workspace.bootstrap()
  }
})

const summaryMetrics = computed(() => {
  const summary = workspace.profileSummary
  const accuracy = workspace.latestMetrics?.accuracy
  const split = workspace.latestRun?.result_json?.dataset_split

  return [
    {
      label: 'Rows',
      value: summary?.rows ? `${summary.rows}` : '--',
      note: 'Jumlah observasi dari dataset aktif',
      tone: 'from-cyan-400/25 to-cyan-500/10',
    },
    {
      label: 'Columns',
      value: summary?.columns ? `${summary.columns}` : '--',
      note: 'Kolom yang dibaca backend dari workbook',
      tone: 'from-emerald-400/25 to-emerald-500/10',
    },
    {
      label: 'Accuracy',
      value: typeof accuracy === 'number' ? `${(accuracy * 100).toFixed(2)}%` : '--',
      note: split ? `Testing ${split.testing_rows} rows` : 'Belum ada hasil training',
      tone: 'from-orange-400/25 to-orange-500/10',
    },
    {
      label: 'Runs',
      value: `${workspace.runs.length}`,
      note: 'Eksperimen yang tersedia di backend',
      tone: 'from-fuchsia-400/25 to-fuchsia-500/10',
    },
  ]
})

const topRecommendations = computed(() => {
  return workspace.recommendedConfig?.recommendations?.slice(0, 4) ?? []
})

const previewColumns = computed(() => workspace.datasetPreview?.columns ?? [])
const previewRows = computed(() => workspace.datasetPreview?.rows ?? [])

const visibleProcessSteps = computed(() => {
  if (workspace.processWorkflowSteps.length) {
    return workspace.processWorkflowSteps.map((step: any) => ({
      code: `${step.step_number}`,
      title: step.title,
      description: step.data?.target_column
        ? `Target: ${step.data.target_column}`
        : step.notes || step.endpoint || step.visualization_type || 'Connected to backend workflow.',
      route:
        step.code === 'eda'
          ? '/'
          : step.code === 'preprocessing' || step.code === 'target-conversion'
            ? '/config-studio'
            : step.code === 'model-training'
              ? '/pipeline'
              : step.code === 'confusion-matrix' || step.code === 'metrics'
                ? '/evaluation-lab'
                : '/tree-explorer',
      status: step.status,
      statusLabel:
        step.status === 'available'
          ? 'Ready'
          : step.status === 'configured'
            ? 'Configured'
            : 'Waiting',
    }))
  }

  return processSteps.map((step) => ({
    ...step,
    status: 'waiting',
    statusLabel: 'Waiting',
  }))
})

const healthCards = computed(() => [
  {
    key: 'live',
    label: '/health/live',
    status: workspace.healthStatuses.live,
    description: 'Memastikan API proses utama merespons.',
  },
  {
    key: 'ready',
    label: '/health/ready',
    status: workspace.healthStatuses.ready,
    description: 'Memastikan service siap menerima trafik.',
  },
  {
    key: 'db',
    label: '/health/db',
    status: workspace.healthStatuses.db,
    description: 'Memastikan koneksi database backend aktif.',
  },
])

function getProcessStatusClasses(status: string) {
  if (status === 'available') {
    return {
      card: 'border-emerald-300/20 bg-emerald-300/10',
      badge: 'border border-emerald-300/25 bg-emerald-300/15 text-emerald-100',
      icon: 'OK',
    }
  }

  if (status === 'configured') {
    return {
      card: 'border-amber-300/20 bg-amber-300/10',
      badge: 'border border-amber-300/25 bg-amber-300/15 text-amber-100',
      icon: 'CFG',
    }
  }

  return {
    card: 'border-white/10 bg-black/20',
    badge: 'border border-white/10 bg-white/8 text-slate-200',
    icon: 'WAIT',
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function handleUpload() {
  if (!selectedFile.value) return
  await workspace.uploadFile(selectedFile.value)
}

async function handleTrain() {
  if (!selectedFile.value) return
  await workspace.trainUploadedFile(selectedFile.value)
}
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(17,24,39,0.96),rgba(8,16,30,0.92),rgba(42,157,143,0.16))] p-7 shadow-2xl shadow-black/20">
        <div class="flex flex-wrap items-center gap-3">
          <span class="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            Live Backend
          </span>
          <span class="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
            {{ workspace.apiBaseUrl }}
          </span>
        </div>

        <h2 class="mt-6 max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-tight text-white lg:text-5xl">
          Workspace decision tree yang sekarang membaca dataset, profiling, rekomendasi, dan run langsung dari backend.
        </h2>

        <p class="mt-5 max-w-3xl text-base leading-8 text-slate-300 lg:text-lg">
          Fokus tampilan ini saya rapikan menjadi dashboard operasional: blok upload, koneksi server, metrik dataset, preview nyata, dan action train. Jadi halaman tidak terasa penuh placeholder lagi.
        </p>

        <div class="mt-7 flex flex-wrap gap-3">
          <div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100">
            <Server class="h-4 w-4 text-cyan-200" />
            <span>{{ workspace.healthOk ? 'Backend connected' : 'Backend unavailable' }}</span>
          </div>
          <div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100">
            <DatabaseZap class="h-4 w-4 text-emerald-300" />
            <span>{{ workspace.activeDataset?.original_filename ?? 'Belum ada dataset aktif' }}</span>
          </div>
          <div class="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100">
            <Sparkles class="h-4 w-4 text-orange-200" />
            <span>{{ workspace.latestRun?.run_name ?? 'Belum ada run terbaru' }}</span>
          </div>
        </div>
      </div>

      <SectionCard
        eyebrow="Backend Health"
        title="Status live, ready, dan db"
        description="Panel ini membaca ketiga endpoint health backend agar kita bisa membedakan API aktif, readiness, dan koneksi database."
      >
        <div class="space-y-3">
          <article
            v-for="health in healthCards"
            :key="health.key"
            class="flex items-start justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <div>
              <p class="font-medium text-white">{{ health.label }}</p>
              <p class="mt-1 text-sm text-slate-300">{{ health.description }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              :class="
                health.status
                  ? 'border border-emerald-300/20 bg-emerald-300/12 text-emerald-100'
                  : 'border border-rose-300/20 bg-rose-300/12 text-rose-100'
              "
            >
              {{ health.status ? 'OK' : 'DOWN' }}
            </span>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Upload & Train"
        title="Panel aksi yang lebih fokus"
        description="Gunakan file Excel/CSV Anda sendiri. Untuk pengujian lokal, file yang sama juga sudah saya verifikasi dari folder docs ke backend localhost:8000."
      >
        <div class="space-y-4">
          <label class="block rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-4">
            <span class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
              <FileUp class="h-4 w-4 text-cyan-200" />
              Pilih dataset
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              class="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-300/12 file:px-4 file:py-2 file:font-medium file:text-cyan-100"
              @change="onFileChange"
            />
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              class="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!selectedFile || workspace.isUploading"
              @click="handleUpload"
            >
              <FileUp class="h-4 w-4" />
              {{ workspace.isUploading ? 'Uploading...' : 'Upload + Profile' }}
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-300/16 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!selectedFile || workspace.isTraining"
              @click="handleTrain"
            >
              <Play class="h-4 w-4" />
              {{ workspace.isTraining ? 'Training...' : 'Upload + Train' }}
            </button>
          </div>

          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <p class="font-medium text-white">File uji yang sudah diverifikasi</p>
            <p class="mt-2">`docs/Pengaruh Medsos Nilai Akademik Mahasiswa Indonesia.xlsx` berhasil saya upload, profile, preview, dan train ke backend lokal.</p>
          </div>

          <div v-if="workspace.errorMessage" class="rounded-[1.5rem] border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
            <div class="flex items-start gap-2">
              <TriangleAlert class="mt-0.5 h-4 w-4" />
              <p>{{ workspace.errorMessage }}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>

    <section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <MetricTile
        v-for="metric in summaryMetrics"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        :note="metric.note"
        :tone="metric.tone"
      />
    </section>

    <SectionCard
      eyebrow="Main Process"
      title="Tahapan proses yang tampil di frontend"
      description="Bagian ini merangkum alur yang Anda minta agar pengguna bisa melihat setiap proses utama dari EDA sampai visualisasi pohon keputusan."
    >
      <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="step in visibleProcessSteps"
          :key="step.code"
          :to="step.route"
          class="rounded-[1.6rem] border p-5 transition hover:border-cyan-300/20 hover:bg-white/8"
          :class="getProcessStatusClasses(step.status).card"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/12 font-heading text-lg font-semibold text-cyan-100">
                {{ step.code }}
              </span>
              <p class="font-heading text-xl font-semibold text-white">{{ step.title }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              :class="getProcessStatusClasses(step.status).badge"
            >
              {{ getProcessStatusClasses(step.status).icon }}
            </span>
          </div>
          <p class="mt-4 text-sm leading-6 text-slate-300">{{ step.description }}</p>
          <p class="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
            {{ step.statusLabel }}
          </p>
        </RouterLink>
      </div>
    </SectionCard>

    <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SectionCard
        eyebrow="Dataset Snapshot"
        title="Ringkasan nyata dari profiling backend"
        description="Informasi ini berasal dari endpoint upload, profile, preview, dan recommend-config pada backend FastAPI lokal."
      >
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Dataset</p>
            <p class="mt-2 font-heading text-2xl text-white">{{ workspace.activeDataset?.original_filename ?? '--' }}</p>
            <p class="mt-3 text-sm text-slate-300">Status: {{ workspace.activeDataset?.status ?? '--' }}</p>
            <p class="mt-1 text-sm text-slate-300">SHA-256: {{ workspace.activeDataset?.sha256?.slice(0, 18) ?? '--' }}...</p>
          </div>
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Summary</p>
            <p class="mt-2 text-sm text-slate-300">Rows: {{ workspace.profileSummary?.rows ?? '--' }}</p>
            <p class="mt-1 text-sm text-slate-300">Columns: {{ workspace.profileSummary?.columns ?? '--' }}</p>
            <p class="mt-1 text-sm text-slate-300">Missing cells: {{ workspace.profileSummary?.missing_cells ?? '--' }}</p>
            <p class="mt-1 text-sm text-slate-300">Duplicate rows: {{ workspace.profileSummary?.duplicate_rows ?? '--' }}</p>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10">
          <table class="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead class="bg-white/8 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Column</th>
                <th class="px-4 py-3 font-medium">Type</th>
                <th class="px-4 py-3 font-medium">Unique</th>
                <th class="px-4 py-3 font-medium">Missing</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-black/20 text-slate-100">
              <tr v-for="column in workspace.profileColumns.slice(0, 6)" :key="column.name">
                <td class="px-4 py-3">{{ column.name }}</td>
                <td class="px-4 py-3">{{ column.inferred_type }}</td>
                <td class="px-4 py-3">{{ column.unique_count }}</td>
                <td class="px-4 py-3">{{ column.missing_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Recommendations"
        title="Evidence dari recommend-config"
        description="Bagian ini membantu melihat kolom target, identifier, dan confidence rekomendasi sebelum training."
      >
        <div class="space-y-3">
          <article
            v-for="recommendation in topRecommendations"
            :key="recommendation.column"
            class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-medium text-white">{{ recommendation.column }}</p>
                <p class="mt-1 text-sm text-slate-300">{{ recommendation.recommended_role }}</p>
              </div>
              <span class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                {{ Math.round(recommendation.confidence * 100) }}%
              </span>
            </div>
            <p class="mt-3 text-sm text-slate-300">{{ recommendation.reasons?.join(', ') }}</p>
          </article>
        </div>
      </SectionCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard
        eyebrow="Preview"
        title="Cuplikan data dari endpoint preview"
        description="Tabel ini membaca langsung output `/preview?limit=5`, jadi strukturnya mengikuti dataset nyata yang sedang aktif."
      >
        <div class="overflow-x-auto rounded-[1.5rem] border border-white/10">
          <table class="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead class="bg-white/8 text-slate-300">
              <tr>
                <th v-for="column in previewColumns" :key="column" class="px-4 py-3 font-medium">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-black/20 text-slate-100">
              <tr v-for="(row, rowIndex) in previewRows" :key="rowIndex">
                <td v-for="column in previewColumns" :key="`${rowIndex}-${column}`" class="px-4 py-3">
                  {{ row[column] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Config Editor"
        title="JSON siap kirim ke upload-train"
        description="Editor ini menjadi payload `config_json` saat Anda menjalankan training dari frontend."
      >
        <textarea
          v-model="workspace.configEditorText"
          rows="18"
          class="w-full rounded-[1.5rem] border border-white/10 bg-[#08101e] p-4 font-mono text-sm leading-6 text-cyan-100 outline-none"
        />
      </SectionCard>
    </section>
  </div>
</template>
