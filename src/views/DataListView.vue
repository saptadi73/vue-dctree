<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SectionCard from '../components/SectionCard.vue'
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
      title="List data dengan searching dan pagination"
      description="Halaman ini dibuat sebagai tampilan umum untuk daftar data survei manual, siap dikembangkan ke dataset lain di masa depan."
    >
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
