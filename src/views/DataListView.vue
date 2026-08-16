<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import StatCard from '../components/StatCard.vue'
import DataTable, { type DataTableColumn } from '../components/DataTable.vue'
import { useWorkspaceStore } from '../stores/workspace'

const workspace = useWorkspaceStore()
const editingId = ref<string | null>(null)
const editDraft = ref<Record<string, unknown>>({})
const deleteCandidate = ref<{ id: string; name: string } | null>(null)
const deleteStage = ref<'first' | 'final'>('first')

onMounted(() => {
  if (!workspace.manualSurveyResponses.length && !workspace.isBootstrapping) {
    void workspace.loadManualSurveyResponses(null)
  }
})

const rows = computed(() =>
  workspace.manualSurveyResponses.map((item) => ({
    id: item.id,
    name: item.name ?? '-',
    age: item.age ?? '-',
    gender: item.gender ?? '-',
    screenTime: item.daily_screen_time_hours ?? '-',
    studyHours: item.online_study_hours ?? '-',
    currentCgpa: item.current_cgpa ?? '-',
    previousCgpa: item.previous_cgpa ?? '-',
    attendance: item.attendance_percentage ?? '-',
    original: item,
  })),
)

const summaryStats = computed(() => {
  const items = workspace.manualSurveyResponses
  const nonEmptyNumbers = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : null

  const cgpaValues = items
    .map((item) => nonEmptyNumbers(item.current_cgpa))
    .filter((value): value is number => value !== null)

  const attendanceValues = items
    .map((item) => nonEmptyNumbers(item.attendance_percentage))
    .filter((value): value is number => value !== null)

  const genderCounts = items.reduce<Record<string, number>>((acc, item) => {
    const gender = String(item.gender ?? '').trim()
    if (!gender) return acc
    acc[gender] = (acc[gender] ?? 0) + 1
    return acc
  }, {})

  const topGender = Object.entries(genderCounts).sort((a, b) => b[1] - a[1])[0]

  return {
    totalResponses: items.length,
    avgCgpa:
      cgpaValues.length > 0
        ? cgpaValues.reduce((sum, value) => sum + value, 0) / cgpaValues.length
        : 0,
    avgAttendance:
      attendanceValues.length > 0
        ? attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length
        : 0,
    topGender: topGender ? `${topGender[0]} (${topGender[1]})` : 'Belum ada',
  }
})

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Nama' },
  { key: 'age', label: 'Usia' },
  { key: 'gender', label: 'Gender' },
  { key: 'screenTime', label: 'Screen Time' },
  { key: 'studyHours', label: 'Study Hours' },
  { key: 'currentCgpa', label: 'Current CGPA' },
  { key: 'previousCgpa', label: 'Prev CGPA' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'actions', label: 'Aksi', align: 'center' },
]

function normalizeDraftValue(value: unknown) {
  if (value === '' || value === null || value === undefined) return null
  return value
}

function openEdit(row: Record<string, unknown>) {
  const item = row.original as Record<string, unknown>
  editingId.value = String(item.id)
  editDraft.value = {
    name: normalizeDraftValue(item.name),
    age: normalizeDraftValue(item.age),
    gender: normalizeDraftValue(item.gender),
    daily_screen_time_hours: normalizeDraftValue(item.daily_screen_time_hours),
    online_study_hours: normalizeDraftValue(item.online_study_hours),
    current_cgpa: normalizeDraftValue(item.current_cgpa),
    previous_cgpa: normalizeDraftValue(item.previous_cgpa),
    attendance_percentage: normalizeDraftValue(item.attendance_percentage),
  }
}

function closeEditModal() {
  editingId.value = null
  editDraft.value = {}
}

async function saveEdit() {
  if (!editingId.value) return

  const payload: Record<string, unknown> = {
    name: editDraft.value.name ?? '',
    age: editDraft.value.age == null ? null : Number(editDraft.value.age),
    gender: editDraft.value.gender ?? null,
    daily_screen_time_hours:
      editDraft.value.daily_screen_time_hours == null
        ? null
        : Number(editDraft.value.daily_screen_time_hours),
    online_study_hours:
      editDraft.value.online_study_hours == null
        ? null
        : Number(editDraft.value.online_study_hours),
    current_cgpa:
      editDraft.value.current_cgpa == null ? null : Number(editDraft.value.current_cgpa),
    previous_cgpa:
      editDraft.value.previous_cgpa == null ? null : Number(editDraft.value.previous_cgpa),
    attendance_percentage:
      editDraft.value.attendance_percentage == null
        ? null
        : Number(editDraft.value.attendance_percentage),
  }

  await workspace.updateManualSurveyResponse(editingId.value, payload)
  closeEditModal()
}

function requestDelete(row: Record<string, unknown>) {
  const item = row.original as Record<string, unknown>
  deleteCandidate.value = {
    id: String(item.id),
    name: String(item.name ?? 'data ini'),
  }
  deleteStage.value = 'first'
}

function closeDeleteModal() {
  deleteCandidate.value = null
  deleteStage.value = 'first'
}

async function confirmDelete() {
  if (!deleteCandidate.value) return

  if (deleteStage.value === 'first') {
    deleteStage.value = 'final'
    return
  }

  await workspace.deleteManualSurveyResponse(deleteCandidate.value.id)
  closeDeleteModal()
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      eyebrow="Data List"
      title="Manual Survey Dashboard"
      description="Ringkasan operasional data survei manual dalam gaya dashboard berita: cepat dibaca, terukur, dan siap untuk pengambilan keputusan."
    >
      <div class="summary-dashboard">
        <div class="summary-dashboard__header">
          <div>
            <p class="summary-dashboard__eyebrow">Executive summary</p>
            <h3 class="summary-dashboard__title">Aktivitas respon survei</h3>
          </div>
          <div class="summary-dashboard__badge">Live data</div>
        </div>

        <div class="summary-dashboard__stats">
          <StatCard
            label="Total respon"
            :value="String(summaryStats.totalResponses)"
            note="Jumlah semua data yang masuk"
            tone="cyan"
          />
          <StatCard
            label="Avg CGPA"
            :value="summaryStats.avgCgpa ? summaryStats.avgCgpa.toFixed(2) : '0.00'"
            note="Rata-rata nilai saat ini"
            tone="emerald"
          />
          <StatCard
            label="Avg attendance"
            :value="
              summaryStats.avgAttendance ? `${summaryStats.avgAttendance.toFixed(1)}%` : '0.0%'
            "
            note="Kehadiran rata-rata responden"
            tone="amber"
          />
          <StatCard
            label="Gender dominan"
            :value="summaryStats.topGender.split(' (')[0] || 'Belum ada'"
            :note="
              summaryStats.topGender === 'Belum ada'
                ? 'Data gender belum tersedia'
                : `Jumlah ${summaryStats.topGender}`
            "
            tone="violet"
          />
        </div>
      </div>

      <div class="mt-6">
        <DataTable
          :columns="columns"
          :rows="rows"
          :page-size="7"
          search-placeholder="Cari nama, gender, atau CGPA..."
          empty-message="Belum ada data respons manual."
        >
          <template #cell-actions="{ row }">
            <div class="data-list__action-group">
              <button
                type="button"
                class="data-list__action-btn data-list__action-btn--edit"
                @click="openEdit(row)"
              >
                Edit
              </button>
              <button
                type="button"
                class="data-list__action-btn data-list__action-btn--delete"
                @click="requestDelete(row)"
              >
                Delete
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </SectionCard>

    <div v-if="editingId" class="data-list__modal-backdrop" @click.self="closeEditModal()">
      <div class="data-list__modal-panel">
        <div class="data-list__modal-header">
          <div>
            <p class="data-list__modal-eyebrow">Edit Response</p>
            <h3 class="data-list__modal-title">Perbarui data survei</h3>
          </div>
          <button type="button" class="data-list__ghost-btn" @click="closeEditModal()">
            Tutup
          </button>
        </div>

        <div class="data-list__field-grid">
          <label class="data-list__field">
            <span>Nama</span>
            <input v-model="editDraft.name" />
          </label>
          <label class="data-list__field">
            <span>Usia</span>
            <input v-model.number="editDraft.age" type="number" />
          </label>
          <label class="data-list__field">
            <span>Gender</span>
            <input v-model="editDraft.gender" />
          </label>
          <label class="data-list__field">
            <span>Screen Time</span>
            <input v-model.number="editDraft.daily_screen_time_hours" type="number" step="0.01" />
          </label>
          <label class="data-list__field">
            <span>Study Hours</span>
            <input v-model.number="editDraft.online_study_hours" type="number" step="0.01" />
          </label>
          <label class="data-list__field">
            <span>Current CGPA</span>
            <input v-model.number="editDraft.current_cgpa" type="number" step="0.01" />
          </label>
          <label class="data-list__field">
            <span>Previous CGPA</span>
            <input v-model.number="editDraft.previous_cgpa" type="number" step="0.01" />
          </label>
          <label class="data-list__field">
            <span>Attendance</span>
            <input v-model.number="editDraft.attendance_percentage" type="number" step="0.01" />
          </label>
        </div>

        <div class="data-list__modal-actions">
          <button type="button" class="data-list__ghost-btn" @click="closeEditModal()">
            Batal
          </button>
          <button type="button" class="data-list__primary-btn" @click="saveEdit()">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleteCandidate" class="data-list__modal-backdrop" @click.self="closeDeleteModal()">
      <div class="data-list__modal-panel data-list__danger-panel">
        <div class="data-list__modal-header" style="margin-bottom: 0.5rem">
          <div class="data-list__warning-icon">!</div>
          <div style="flex: 1">
            <p class="data-list__modal-eyebrow" style="color: #dc2626">
              {{ deleteStage === 'first' ? 'Konfirmasi' : 'Konfirmasi akhir' }}
            </p>
            <h3 class="data-list__modal-title" style="font-size: 1.5rem; margin-top: 0.8rem">
              {{ deleteStage === 'first' ? 'Hapus data ini?' : 'Yakin ingin menghapus permanen?' }}
            </h3>
          </div>
        </div>

        <p style="margin: 0; line-height: 1.7; color: var(--muted)">
          {{
            deleteStage === 'first'
              ? `Anda akan menghapus ${deleteCandidate.name}.`
              : `Data ${deleteCandidate.name} akan hilang permanen dan tidak dapat dikembalikan.`
          }}
        </p>

        <div class="data-list__modal-actions">
          <button type="button" class="data-list__ghost-btn" @click="closeDeleteModal()">
            Batal
          </button>
          <button
            type="button"
            :class="deleteStage === 'first' ? 'data-list__danger-btn' : 'data-list__danger-btn'"
            @click="confirmDelete()"
          >
            {{ deleteStage === 'first' ? 'Lanjutkan' : 'Hapus permanen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
