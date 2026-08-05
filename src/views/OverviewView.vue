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
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (!workspace.activeDataset && !workspace.isBootstrapping) {
    workspace.bootstrap()
  }
})

const presetOptions = computed(() => workspace.configurationPresets)

const edaSummary = computed(() => workspace.edaVisualization?.summary ?? workspace.profileSummary)
const datasetTableColumns = computed(() => workspace.datasetTable?.columns ?? [])
const datasetTableRows = computed(() => workspace.datasetTable?.rows ?? [])
const tableMode = ref<'original' | 'normalized'>('original')
const activeTable = computed(() =>
  tableMode.value === 'normalized' ? workspace.normalizedDatasetTable : workspace.datasetTable,
)
const activeTableColumns = computed(() => activeTable.value?.columns ?? datasetTableColumns.value)
const activeTableRows = computed(() => activeTable.value?.rows ?? datasetTableRows.value)
const activeTablePagination = computed(() => {
  if (tableMode.value === 'normalized') {
    return workspace.normalizedDatasetTable?.pagination ?? null
  }

  return workspace.datasetTable?.pagination ?? null
})
const missingColumns = computed(() => workspace.edaVisualization?.charts?.missing_ratio_by_column?.slice(0, 5) ?? [])
const uniqueColumns = computed(() => workspace.edaVisualization?.charts?.unique_ratio_by_column?.slice(0, 5) ?? [])
const canTrain = computed(() => workspace.hasReadyTrainingContext)
const canUseCachedFile = computed(() => workspace.hasCachedUploadedFile)

const summaryMetrics = computed(() => {
  const accuracy = workspace.latestMetrics?.accuracy
  const split = workspace.latestRun?.result_json?.dataset_split

  return [
    {
      label: 'Rows',
      value: edaSummary.value?.rows ? `${edaSummary.value.rows}` : '--',
      note: 'Jumlah observasi dari dataset aktif',
      tone: 'from-cyan-400/25 to-cyan-500/10',
    },
    {
      label: 'Columns',
      value: edaSummary.value?.columns ? `${edaSummary.value.columns}` : '--',
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
  const uploadedFileName = selectedFile.value.name
  await workspace.uploadFile(selectedFile.value)

  if (workspace.lastUploadedFileName === uploadedFileName) {
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function handleTrain() {
  await workspace.trainUploadedFile(selectedFile.value ?? undefined)
}

function handlePresetChange(event: Event) {
  const preset = (event.target as HTMLInputElement).value
  void workspace.selectDatasetPreset(preset)
}

async function goToPreviousTablePage() {
  if (!workspace.activeDataset?.id || !activeTablePagination.value?.has_previous) return
  const prevPage = Number(activeTablePagination.value.page) - 1
  await workspace.loadDatasetTablePage(
    workspace.activeDataset.id,
    prevPage,
    tableMode.value === 'normalized',
  )
}

async function goToNextTablePage() {
  if (!workspace.activeDataset?.id || !activeTablePagination.value?.has_next) return
  const nextPage = Number(activeTablePagination.value.page) + 1
  await workspace.loadDatasetTablePage(
    workspace.activeDataset.id,
    nextPage,
    tableMode.value === 'normalized',
  )
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
          Frontend sekarang mengikuti kontrak dataset-level dan run-level yang terbaru.
        </h2>

        <p class="mt-5 max-w-3xl text-base leading-8 text-slate-300 lg:text-lg">
          Halaman ini memakai `eda-visualization`, `table`, `target-conversion-preview`, dan workflow run untuk memisahkan tahap persiapan dataset dari hasil analisis model.
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
        eyebrow="Upload & Train"
        title="Panel aksi yang lebih fokus"
        description="Gunakan file Excel/CSV Anda sendiri. Untuk pengujian lokal, file yang sama juga sudah saya verifikasi dari folder docs ke backend localhost:8000."
      >
        <div class="space-y-4">
          <div v-if="presetOptions.length" class="space-y-3">
            <p class="text-sm text-slate-200">Pilih preset dataset (wajib):</p>
            <div class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="preset in presetOptions"
                :key="preset.id"
                class="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100"
              >
                <input
                  type="radio"
                  name="dataset-preset"
                  :value="preset.id"
                  :checked="workspace.selectedPreset === preset.id"
                  class="h-4 w-4 accent-cyan-300"
                  :disabled="!workspace.activeDataset || workspace.isLoadingPreset"
                  @change="handlePresetChange"
                />
                <div>
                  <p class="font-semibold">{{ preset.label }}</p>
                  <p class="text-xs text-slate-300">{{ preset.description }}</p>
                </div>
              </label>
            </div>
            <p v-if="workspace.isLoadingPreset" class="text-xs text-slate-300">Memuat rekomendasi preset...</p>
          </div>

          <label class="block rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-4">
            <span class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
              <FileUp class="h-4 w-4 text-cyan-200" />
              Pilih dataset
            </span>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              class="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-300/12 file:px-4 file:py-2 file:font-medium file:text-cyan-100"
              @change="onFileChange"
            />
          </label>

          <div
            v-if="workspace.lastUploadedFileName"
            class="flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100"
          >
            <FileUp class="h-4 w-4 shrink-0" />
            <span>
              File tersimpan: <strong>{{ workspace.lastUploadedFileName }}</strong>. File ini akan dipakai saat training jika tidak ada file baru yang dipilih.
            </span>
          </div>

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
              :disabled="workspace.isTraining || !canTrain || (!selectedFile && !canUseCachedFile)"
              @click="handleTrain"
            >
              <Play class="h-4 w-4" />
              {{ workspace.isTraining ? 'Training...' : canUseCachedFile ? 'Upload + Train' : 'Upload + Train (upload dulu)' }}
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

    <section class="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <SectionCard
        eyebrow="EDA Visualization"
        title="Ringkasan kualitas data dari endpoint baru"
        description="Bagian ini membaca `GET /datasets/{dataset_id}/eda-visualization` sesuai dokumentasi workflow yang baru."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">Rows</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ edaSummary?.rows ?? '--' }}</p>
          </div>
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">Columns</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ edaSummary?.columns ?? '--' }}</p>
          </div>
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">Missing Cells</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ edaSummary?.missing_cells ?? '--' }}</p>
          </div>
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">Duplicate Rows</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ edaSummary?.duplicate_rows ?? '--' }}</p>
          </div>
        </div>

        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Missing Ratio</p>
            <div class="mt-4 space-y-3">
              <div v-for="item in missingColumns" :key="item.column">
                <div class="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{{ item.column }}</span>
                  <span>{{ (item.missing_ratio * 100).toFixed(1) }}%</span>
                </div>
                <div class="h-2 rounded-full bg-white/8">
                  <div class="h-2 rounded-full bg-gradient-to-r from-rose-300 to-orange-300" :style="{ width: `${item.missing_ratio * 100}%` }" />
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Unique Ratio</p>
            <div class="mt-4 space-y-3">
              <div v-for="item in uniqueColumns" :key="item.column">
                <div class="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{{ item.column }}</span>
                  <span>{{ (item.unique_ratio * 100).toFixed(1) }}%</span>
                </div>
                <div class="h-2 rounded-full bg-white/8">
                  <div class="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" :style="{ width: `${Math.min(item.unique_ratio * 100, 100)}%` }" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Dataset Table"
      title="Tabel dataset dari endpoint paginated"
      description="Preview ini sekarang mengikuti kontrak `GET /datasets/{dataset_id}/table` yang baru."
      >
        <div class="mb-4 flex items-center justify-between text-sm text-slate-300">
          <div class="flex items-center gap-2">
            <button
              class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              :class="tableMode === 'original' ? 'bg-cyan-300 text-slate-950' : 'border border-white/10 bg-white/8 text-slate-200'"
              @click="tableMode = 'original'"
            >
              Original
            </button>
            <button
              class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              :class="tableMode === 'normalized' ? 'bg-cyan-300 text-slate-950' : 'border border-white/10 bg-white/8 text-slate-200'"
              @click="tableMode = 'normalized'"
            >
              Normalized
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              :disabled="!activeTablePagination?.has_previous"
              @click="goToPreviousTablePage"
            >
              Sebelumnya
            </button>
            <button
              class="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              :disabled="!activeTablePagination?.has_next"
              @click="goToNextTablePage"
            >
              Berikutnya
            </button>
          </div>
          <span>
            Page {{ activeTable?.pagination?.page ?? 1 }} / {{ activeTable?.pagination?.total_pages ?? 1 }}
          </span>
        </div>

        <div class="overflow-x-auto rounded-[1.5rem] border border-white/10">
          <table class="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead class="bg-white/8 text-slate-300">
              <tr>
                <th v-for="column in activeTableColumns" :key="column" class="px-4 py-3 font-medium">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-black/20 text-slate-100">
              <tr v-for="(row, rowIndex) in activeTableRows" :key="rowIndex">
                <td v-for="column in activeTableColumns" :key="`${rowIndex}-${column}`" class="px-4 py-3">
                  {{ row[column] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </section>

    <SectionCard
      eyebrow="Main Process"
      title="Tahapan proses yang tampil di frontend"
      description="Bagian ini membaca workflow visual run-level dan menautkan user ke halaman yang sesuai."
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
  </div>
</template>
