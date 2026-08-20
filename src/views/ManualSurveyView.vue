<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Check, Database, FileText, Play, Plus, Trash2, UserRound } from '@lucide/vue'
import SectionCard from '../components/SectionCard.vue'
import { useWorkspaceStore } from '../stores/workspace'
import { decisionTreeApi } from '../lib/api'

const workspace = useWorkspaceStore()
const projectSearch = ref('')
const projectName = ref('')
const projectDescription = ref('')
const projects = ref<Record<string, unknown>[]>([])
const activeProjectId = ref<string | null>(null)
const projectLoading = ref(false)
const projectMessage = ref('')
const isSubmitting = ref(false)
const bulkText = ref('')
const bulkImportState = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const bulkImportMessage = ref('')

const bulkTemplateData = [
  {
    name: 'Budi Santoso',
    age: 20,
    gender: 'Laki-laki',
    daily_screen_time_hours: 5.5,
    social_media_hours: 3,
    online_study_hours: 2,
    gaming_hours: 1.5,
    sleep_hours: 7,
    attendance_percentage: 90,
    offline_study_hours: 2,
    previous_cgpa: 3.1,
    current_cgpa: 3.4,
  },
  {
    name: 'Sinta Wijaya',
    age: 22,
    gender: 'Perempuan',
    daily_screen_time_hours: 4,
    social_media_hours: 2.5,
    online_study_hours: 2.8,
    gaming_hours: 1,
    sleep_hours: 7.5,
    attendance_percentage: 92,
    offline_study_hours: 2.5,
    previous_cgpa: 3.2,
    current_cgpa: 3.5,
  },
]

const manualForm = reactive({
  name: '',
  age: 20,
  gender: 'Laki-laki',
  daily_screen_time_hours: 4,
  social_media_hours: 2,
  online_study_hours: 2,
  gaming_hours: 1,
  sleep_hours: 7,
  attendance_percentage: 90,
  offline_study_hours: 2,
  previous_cgpa: 3.1,
  current_cgpa: 3.2,
})

const tableRows = computed(() => workspace.manualSurveyTable?.rows ?? [])
const tableColumns = computed(() => workspace.manualSurveyTable?.columns ?? [])
const profileSummary = computed(
  () => workspace.manualSurveyProfile?.summary ?? workspace.manualSurveyProfile ?? null,
)
const recommendations = computed(
  () =>
    workspace.manualSurveyConfig?.recommendations ??
    workspace.manualSurveyConfig?.data?.recommendations ??
    [],
)
const targetPreview = computed(
  () => workspace.manualSurveyTargetPreview?.data ?? workspace.manualSurveyTargetPreview ?? null,
)
const selectedIdSet = computed(() => new Set(workspace.manualSurveySelectedResponseIds))
const hasGeneratedAnalysis = computed(() => workspace.hasManualSurveyAnalysis)
const runMetrics = computed(() => workspace.manualSurveyMetricsSummary ?? null)
const runClassMetrics = computed(() => workspace.manualSurveyClassMetrics ?? [])
const runConfusionMatrix = computed(() => workspace.manualSurveyConfusionMatrix?.values ?? [])
const confusionLabels = computed<string[]>(() => {
  const labels = Array.isArray(workspace.manualSurveyConfusionMatrix?.labels)
    ? workspace.manualSurveyConfusionMatrix.labels
    : []

  return labels.map((label: unknown) => String(label))
})
const workflowSteps = computed(() => workspace.manualSurveyWorkflowSteps ?? [])
const preprocessingSummary = computed(() => workspace.manualSurveyPreprocessingSummary ?? null)
const treeNodes = computed(() => workspace.manualSurveyTreeNodes ?? [])
const treeEdges = computed(() => workspace.manualSurveyTreeEdges ?? [])
const hasActiveProject = computed(() => Boolean(activeProjectId.value))

async function loadProjects() {
  projectLoading.value = true
  try {
    const result = await decisionTreeApi.listProjects(projectSearch.value)
    projects.value = Array.isArray(result) ? result : []
  } finally {
    projectLoading.value = false
  }
}

async function selectProject(project: Record<string, unknown>) {
  activeProjectId.value = String(project.id)
  workspace.manualSurveyProjectId = activeProjectId.value
  workspace.manualSurveyResponses = []
  workspace.resetManualSurveyAnalysis()
  projectMessage.value = `Project aktif: ${String(project.name ?? 'Tanpa nama')}`
  await refreshManualSurveyData()
}

async function createProject() {
  if (!projectName.value.trim()) return
  const project = await decisionTreeApi.createProject({
    name: projectName.value.trim(),
    description: projectDescription.value.trim(),
  })
  projectName.value = ''
  projectDescription.value = ''
  await loadProjects()
  await selectProject(project)
}

function getConfusionRowLabel(rowIndex: number) {
  const label = confusionLabels.value[rowIndex]
  return typeof label === 'string' && label.length > 0 ? label : `Row ${rowIndex + 1}`
}

async function refreshManualSurveyData() {
  try {
    await workspace.loadManualSurveyResponses(activeProjectId.value)
    await workspace.refreshManualSurveyAnalysis(activeProjectId.value)
  } catch (error) {
    console.error('Manual survey refresh failed', error)
  }
}

async function submitForm() {
  if (!manualForm.name.trim()) return

  isSubmitting.value = true

  try {
    await workspace.createManualSurveyResponse({
      project_id: activeProjectId.value,
      ...manualForm,
    })
    Object.assign(manualForm, {
      name: '',
      age: 20,
      gender: 'Laki-laki',
      daily_screen_time_hours: 4,
      social_media_hours: 2,
      online_study_hours: 2,
      gaming_hours: 1,
      sleep_hours: 7,
      attendance_percentage: 90,
      offline_study_hours: 2,
      previous_cgpa: 3.1,
      current_cgpa: 3.2,
    })
  } finally {
    isSubmitting.value = false
  }
}

function downloadBulkTemplate() {
  const fileContent = JSON.stringify(bulkTemplateData, null, 2)
  const blob = new Blob([fileContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'manual-survey-bulk-template.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  bulkImportState.value = 'success'
  bulkImportMessage.value =
    'Template JSON bulk berhasil diunduh. Gunakan isi file tersebut sebagai contoh.'
}

function handleBulkFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = String(reader.result ?? '')
      const parsed = JSON.parse(raw)
      const responses = Array.isArray(parsed) ? parsed : parsed.responses
      if (!Array.isArray(responses)) {
        throw new Error('Format file harus array objek atau { responses: [...] }.')
      }
      bulkText.value = JSON.stringify(responses, null, 2)
      bulkImportState.value = 'success'
      bulkImportMessage.value = `File ${file.name} berhasil dibaca. Cek isinya lalu klik Import bulk.`
    } catch (error) {
      bulkImportState.value = 'error'
      bulkImportMessage.value =
        'Format file tidak valid. Gunakan JSON array atau object seperti template.'
      console.error('Bulk file parsing failed', error)
    } finally {
      input.value = ''
    }
  }

  reader.readAsText(file)
}

async function submitBulk() {
  if (!bulkText.value.trim()) {
    bulkImportState.value = 'error'
    bulkImportMessage.value = 'Isi field bulk import terlebih dahulu sebelum klik Import bulk.'
    return
  }

  bulkImportState.value = 'loading'
  bulkImportMessage.value = 'Sedang memproses import bulk...'

  try {
    const parsed = JSON.parse(bulkText.value)
    const responses = Array.isArray(parsed) ? parsed : parsed.responses
    if (!Array.isArray(responses)) {
      throw new Error('Format bulk harus array atau { responses: [...] }')
    }

    await workspace.bulkCreateManualSurveyResponses({
      project_id: activeProjectId.value,
      responses,
    })

    bulkText.value = ''
    bulkImportState.value = 'success'
    bulkImportMessage.value = `Import bulk berhasil. ${responses.length} respons telah ditambahkan.`
  } catch (error) {
    console.error('Bulk survey create failed', error)
    bulkImportState.value = 'error'
    bulkImportMessage.value =
      'Import bulk gagal. Pastikan formatnya seperti template: array objek atau { responses: [...] }.'
  }
}

function toggleSelection(responseId: string) {
  const selected = workspace.manualSurveySelectedResponseIds
  if (selected.includes(responseId)) {
    workspace.manualSurveySelectedResponseIds = selected.filter((id) => id !== responseId)
    return
  }

  workspace.manualSurveySelectedResponseIds = [...selected, responseId]
}

async function deleteResponse(responseId: string) {
  await workspace.deleteManualSurveyResponse(responseId)
}

async function trainSelectedData() {
  const selected = workspace.manualSurveySelectedResponseIds
  if (!selected.length) return

  await workspace.trainManualSurveyRun({
    run_name: `Manual Survey Run ${new Date().toISOString()}`,
    project_id: activeProjectId.value,
    response_ids: selected,
    config: workspace.manualSurveyConfig ?? undefined,
  })
}

async function selectRun(runId: string) {
  if (!runId) return
  await workspace.loadManualSurveyRunDetail(runId)
}

onMounted(() => {
  void loadProjects()
})
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      eyebrow="Manual Survey"
      title="Input respons, analisis, dan training khusus workflow manual"
      description="Halaman ini berdiri sendiri dari upload dataset; semua data respon, analisis profil, rekomendasi config, dan training masuk ke namespace backend /api/v1/manual-survey."
    >
      <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/5 p-4">
          <p class="mb-3 text-sm font-semibold text-cyan-100">Pilih atau buat project</p>
          <div class="flex flex-wrap gap-2">
            <input v-model="projectSearch" @input="loadProjects" placeholder="Cari nama project..." class="min-w-[220px] flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
            <button v-for="project in projects" :key="String(project.id)" type="button" @click="selectProject(project)" class="rounded-2xl border border-cyan-300/20 px-3 py-2 text-sm text-cyan-100" :class="{ 'ring-2 ring-cyan-300': activeProjectId === String(project.id) }">
              {{ project.name || project.project_name || 'Tanpa nama' }}
            </button>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <input v-model="projectName" placeholder="Nama project baru" class="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white" />
            <input v-model="projectDescription" placeholder="Deskripsi (opsional)" class="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 bg-slate-950/60 px-4 py-3 text-sm text-white" />
            <button type="button" :disabled="!projectName.trim() || projectLoading" @click="createProject" class="rounded-2xl bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-50">Buat project</button>
          </div>
          <p class="mt-2 text-xs text-slate-400">{{ projectMessage || (projectLoading ? 'Memuat project...' : 'Pilih project sebelum mengisi survey.') }}</p>
        </div>

        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="text-sm text-slate-300">Status data</p>
          <div class="mt-3 flex items-center gap-2 text-lg font-semibold text-emerald-300">
            <Check class="h-5 w-5" />
            <span>{{ workspace.manualSurveyResponses.length }} respons</span>
          </div>
        </div>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        eyebrow="Data Survei"
        title="Tambah satu respons manual"
        description="Form ini mengikuti struktur ManualSurveyInput yang dijelaskan pada dokumentasi backend."
      >
        <div class="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
          <label class="mb-2 block text-sm font-semibold text-cyan-100" for="manual-project-select">
            Project untuk data survey
          </label>
          <select
            id="manual-project-select"
            :value="activeProjectId ?? ''"
            class="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
            @change="
              (event) => {
                const project = projects.find(
                  (item) => String(item.id) === (event.target as HTMLSelectElement).value,
                )
                if (project) void selectProject(project)
              }
            "
          >
            <option value="" disabled>Pilih project yang sudah dibuat</option>
            <option v-for="project in projects" :key="String(project.id)" :value="String(project.id)">
              {{ project.name || project.project_name || 'Tanpa nama' }}
            </option>
          </select>
          <p class="mt-2 text-xs text-slate-400">
            Data respons akan disimpan ke project yang dipilih. UUID dikelola otomatis oleh frontend.
          </p>
        </div>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submitForm">
          <label class="md:col-span-2">
            <span class="mb-2 block text-sm text-slate-300">Nama</span>
            <input
              v-model="manualForm.name"
              class="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
            />
          </label>

          <label>
            <span class="mb-2 block text-sm text-slate-300">Usia</span>
            <input
              v-model.number="manualForm.age"
              type="number"
              min="15"
              max="100"
              class="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
            />
          </label>

          <label>
            <span class="mb-2 block text-sm text-slate-300">Gender</span>
            <select
              v-model="manualForm.gender"
              class="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
            >
              <option>Laki-laki</option>
              <option>Perempuan</option>
            </select>
          </label>

          <label
            v-for="field in [
              ['daily_screen_time_hours', 'Daily Screen Time'],
              ['social_media_hours', 'Social Media Hours'],
              ['online_study_hours', 'Online Study Hours'],
              ['gaming_hours', 'Gaming Hours'],
              ['sleep_hours', 'Sleep Hours'],
              ['attendance_percentage', 'Attendance %'],
              ['offline_study_hours', 'Offline Study Hours'],
              ['previous_cgpa', 'Previous CGPA'],
              ['current_cgpa', 'Current CGPA'],
            ]"
            :key="field[0]"
          >
            <span class="mb-2 block text-sm text-slate-300">{{ field[1] }}</span>
            <input
              v-model.number="manualForm[field[0]]"
              type="number"
              step="0.1"
              class="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
            />
          </label>

          <div class="md:col-span-2 flex justify-end">
            <button
              type="submit"
              :disabled="isSubmitting || !hasActiveProject"
              class="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 font-semibold text-emerald-100 disabled:opacity-60"
            >
              <Plus class="h-4 w-4" />
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan respons' }}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        eyebrow="Bulk import"
        title="Import banyak respons"
        description="Format yang diterima adalah array objek atau payload { responses: [...] }. Project ID di atas bersifat opsional, tetapi bila diisi maka semua data akan masuk ke project yang aktif."
      >
        <div class="mb-4 flex flex-wrap gap-3">
          <button
            type="button"
            @click="downloadBulkTemplate"
            class="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-semibold text-cyan-100"
          >
            <FileText class="h-4 w-4" />
            Download template JSON
          </button>

          <label
            class="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 font-semibold text-amber-100"
          >
            <FileText class="h-4 w-4" />
            Upload file JSON
            <input type="file" accept=".json,.txt" class="hidden" @change="handleBulkFileUpload" />
          </label>
        </div>

        <textarea
          v-model="bulkText"
          rows="12"
          class="w-full rounded-[1.4rem] border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 outline-none"
          placeholder='[
  {
    "name": "Budi",
    "age": 20,
    "gender": "Laki-laki",
    "daily_screen_time_hours": 6,
    "social_media_hours": 2,
    "online_study_hours": 2,
    "gaming_hours": 1,
    "sleep_hours": 8,
    "attendance_percentage": 90,
    "offline_study_hours": 2,
    "previous_cgpa": 3.1,
    "current_cgpa": 3.2
  }
]'
        />

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            @click="submitBulk"
            :disabled="bulkImportState === 'loading' || !hasActiveProject"
            class="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-semibold text-cyan-100 disabled:opacity-60"
          >
            <FileText class="h-4 w-4" />
            {{ bulkImportState === 'loading' ? 'Memproses...' : 'Import bulk' }}
          </button>

          <span
            v-if="bulkImportMessage"
            :class="['text-sm', bulkImportState === 'error' ? 'text-rose-300' : 'text-emerald-300']"
          >
            {{ bulkImportMessage }}
          </span>
        </div>
      </SectionCard>
    </div>

    <SectionCard
      eyebrow="Analisis Data"
      title="Profil, EDA, konfigurasi, dan target preview"
      description="Saat project aktif dipilih, frontend akan memanggil endpoint dataset table, profile, eda-visualization, recommend-config, dan target-conversion-preview yang berdiri sendiri dari workflow dataset upload."
    >
      <div
        v-if="!hasGeneratedAnalysis"
        class="rounded-[1.4rem] border border-dashed border-white/10 bg-black/15 p-6 text-sm text-slate-300"
      >
        Belum ada analisis manual survey untuk project aktif. Jalankan tombol Terapkan atau masukkan
        minimal satu respons untuk memunculkan data.
      </div>

      <div v-else class="space-y-5">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Rows</p>
            <p class="mt-2 font-heading text-3xl text-white">
              {{ profileSummary?.rows ?? profileSummary?.total_rows ?? 0 }}
            </p>
          </div>
          <div class="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Columns</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ profileSummary?.columns ?? 0 }}</p>
          </div>
          <div class="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Target</p>
            <p class="mt-2 font-heading text-xl text-emerald-200">
              {{
                targetPreview?.target_column ??
                workspace.manualSurveyTargetPreview?.target_column ??
                'current_cgpa'
              }}
            </p>
          </div>
        </div>

        <div
          v-if="recommendations.length"
          class="rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
        >
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Rekomendasi config
          </p>
          <ul class="space-y-2 text-sm text-slate-200">
            <li v-for="(item, index) in recommendations.slice(0, 5)" :key="index">• {{ item }}</li>
          </ul>
        </div>
      </div>
    </SectionCard>

    <SectionCard
      eyebrow="Manajemen respon"
      title="Daftar respons dan pemilihan training"
      description="Frontend memfilter memilih data manual berdasarkan project_id. Hanya ID respons dari project aktif yang boleh dipakai untuk training."
    >
      <div class="overflow-hidden rounded-[1.4rem] border border-white/10">
        <table class="min-w-full text-left text-sm text-slate-200">
          <thead class="bg-white/5 text-slate-300">
            <tr>
              <th class="px-4 py-3">Select</th>
              <th class="px-4 py-3">Nama</th>
              <th class="px-4 py-3">Age</th>
              <th class="px-4 py-3">CGPA</th>
              <th class="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableRows" :key="row.id" class="border-t border-white/10">
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  :checked="selectedIdSet.has(row.id)"
                  @change="toggleSelection(row.id)"
                />
              </td>
              <td class="px-4 py-3">{{ row.name }}</td>
              <td class="px-4 py-3">{{ row.age }}</td>
              <td class="px-4 py-3">{{ row.current_cgpa }}</td>
              <td class="px-4 py-3">
                <button
                  @click="deleteResponse(row.id)"
                  class="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-xs text-rose-100"
                >
                  <Trash2 class="h-3.5 w-3.5" /> Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          @click="trainSelectedData"
          :disabled="workspace.manualSurveySelectedResponseIds.length < 2 || !hasActiveProject"
          class="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 font-semibold text-amber-100 disabled:opacity-50"
        >
          <Play class="h-4 w-4" />
          Train selected data
        </button>
        <span class="text-sm text-slate-300"
          >{{ workspace.manualSurveySelectedResponseIds.length }} respons terpilih</span
        >
      </div>
    </SectionCard>

    <SectionCard
      eyebrow="Run hasil"
      title="Training run manual survey"
      description="Runs manual survey hanya menampilkan source_type = manual_survey dan tidak bercampur dengan workflow upload."
    >
      <div
        v-if="!workspace.manualSurveyRuns.length"
        class="rounded-[1.4rem] border border-dashed border-white/10 bg-black/15 p-4 text-sm text-slate-300"
      >
        Belum ada run manual survey yang dibuat.
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <div
          v-for="run in workspace.manualSurveyRuns"
          :key="run.id"
          class="cursor-pointer rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-black/30"
          @click="selectRun(run.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Run</p>
              <p class="mt-1 font-heading text-xl text-white">
                {{ run.run_name || 'Manual Survey Run' }}
              </p>
            </div>
            <span
              class="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-100"
            >
              {{ run.status || 'created' }}
            </span>
          </div>
          <div class="mt-4 space-y-2 text-sm text-slate-300">
            <p class="flex items-center gap-2">
              <UserRound class="h-4 w-4 text-cyan-200" /> {{ run.source_type || 'manual_survey' }}
            </p>
            <p class="flex items-center gap-2">
              <Database class="h-4 w-4 text-cyan-200" /> {{ run.project_id || 'project_id null' }}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>

    <SectionCard
      v-if="
        workspace.manualSurveyActiveRun ||
        workspace.manualSurveyPreprocessingSummary ||
        workspace.manualSurveyMetrics ||
        workspace.manualSurveyConfusionMatrix ||
        workspace.manualSurveyTree ||
        workspace.manualSurveyWorkflow
      "
      eyebrow="Hasil run"
      title="Detail hasil training survei manual"
      description="Setiap run manual survey menampilkan ringkasan preprocessing, confusion matrix, metrik, tree diagram, dan workflow step summary sesuai 7 langkah yang ada pada backend."
    >
      <div
        v-if="preprocessingSummary"
        class="mb-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          2. Preprocessing summary
        </h3>
        <div class="grid gap-3 md:grid-cols-4">
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">Feature sebelum encoding</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ preprocessingSummary.feature_count_before_encoding ?? 0 }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">Feature setelah encoding</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ preprocessingSummary.feature_count_after_encoding ?? 0 }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">Mode</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ preprocessingSummary.preprocessing_config?.mode ?? 'n/a' }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">Target</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ preprocessingSummary.target_column ?? 'n/a' }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="runMetrics" class="mb-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          6. Accuracy, Precision, Recall, dan F1
        </h3>
        <div class="grid gap-3 md:grid-cols-4">
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">Accuracy</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ (runMetrics.accuracy ?? 0).toFixed(4) }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">Precision</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ (runMetrics.precision ?? 0).toFixed(4) }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">Recall</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ (runMetrics.recall ?? 0).toFixed(4) }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p class="text-xs text-slate-400">F1</p>
            <p class="mt-1 text-xl font-semibold text-white">
              {{ (runMetrics.f1_score ?? runMetrics.f1 ?? 0).toFixed(4) }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="runClassMetrics.length"
        class="mb-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Per-class report
        </h3>
        <div class="overflow-hidden rounded-2xl border border-white/10">
          <table class="min-w-full text-left text-sm text-slate-200">
            <thead class="bg-white/5 text-slate-300">
              <tr>
                <th class="px-3 py-2">Class</th>
                <th class="px-3 py-2">Precision</th>
                <th class="px-3 py-2">Recall</th>
                <th class="px-3 py-2">F1</th>
                <th class="px-3 py-2">Support</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in runClassMetrics"
                :key="index"
                class="border-t border-white/10"
              >
                <td class="px-3 py-2">{{ row.class_label }}</td>
                <td class="px-3 py-2">{{ (row.precision ?? 0).toFixed(4) }}</td>
                <td class="px-3 py-2">{{ (row.recall ?? 0).toFixed(4) }}</td>
                <td class="px-3 py-2">{{ (row.f1_score ?? 0).toFixed(4) }}</td>
                <td class="px-3 py-2">{{ row.support ?? 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="runConfusionMatrix.length"
        class="mb-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          5. Confusion matrix
        </h3>
        <div class="overflow-auto">
          <table
            class="min-w-full border-separate border-spacing-1 text-center text-sm text-slate-200"
          >
            <thead>
              <tr>
                <th class="px-2 py-2 text-slate-300">&nbsp;</th>
                <th
                  v-for="(label, columnIndex) in confusionLabels"
                  :key="`col-${columnIndex}`"
                  class="px-2 py-2 text-slate-300"
                >
                  {{ label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in runConfusionMatrix" :key="`row-${rowIndex}`">
                <th class="px-2 py-2 text-slate-300">
                  {{ getConfusionRowLabel(Number(rowIndex)) }}
                </th>
                <td
                  v-for="(value, columnIndex) in row"
                  :key="`cell-${rowIndex}-${columnIndex}`"
                  class="min-w-[3rem] rounded-xl bg-slate-800 px-2 py-2"
                >
                  {{ value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="treeNodes.length"
        class="mb-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          7. Visualisasi pohon keputusan
        </h3>
        <div class="space-y-2">
          <div
            v-for="node in treeNodes.slice(0, 10)"
            :key="node.node_id"
            class="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"
          >
            <p class="font-semibold text-white">Node {{ node.node_id }}</p>
            <p v-if="node.feature_name">Feature: {{ node.feature_name }}</p>
            <p v-if="node.operator && node.threshold !== null && node.threshold !== undefined">
              Split: {{ node.operator }} {{ node.threshold }}
            </p>
            <p>Samples: {{ node.samples ?? 0 }}</p>
            <p v-if="node.predicted_class">Predicted: {{ node.predicted_class }}</p>
          </div>
        </div>
        <p v-if="treeEdges.length" class="mt-3 text-xs text-slate-400">
          {{ treeEdges.length }} edges terdeteksi dalam format node-edge.
        </p>
      </div>

      <div
        v-if="workflowSteps.length"
        class="rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
      >
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          8. Workflow aggregation
        </h3>
        <div class="space-y-3">
          <div
            v-for="step in workflowSteps"
            :key="step.step_number || step.code"
            class="rounded-2xl border border-white/10 bg-slate-950/40 p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-white">
                {{ step.step_number }}. {{ step.title || step.code }}
              </p>
              <span
                class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100"
              >
                {{ step.status || 'unknown' }}
              </span>
            </div>
            <p v-if="step.endpoint" class="mt-2 text-xs text-slate-400">
              Endpoint: {{ step.endpoint }}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
