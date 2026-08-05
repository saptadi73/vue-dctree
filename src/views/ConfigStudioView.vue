<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import { useWorkspaceStore } from '../stores/workspace'

const workspace = useWorkspaceStore()

onMounted(async () => {
  if (!workspace.activeDataset && !workspace.isBootstrapping) {
    await workspace.bootstrap()
  }
})

const targetColumn = computed(() =>
  workspace.targetConversionPreview?.target_column ??
  workspace.recommendedConfig?.task?.target_column ??
  '',
)

const positiveClass = computed(() => {
  const value = workspace.targetConversionPreview?.positive_class ?? workspace.recommendedConfig?.task?.positive_class
  if (value) return value
  return workspace.selectedPreset === 'india' ? 'Tidak berlaku (multiclass)' : '--'
})

function handlePresetChange(event: Event) {
  void workspace.selectDatasetPreset((event.target as HTMLInputElement).value)
}

const configHighlights = computed(() => {
  const target = targetColumn.value || 'Pilih preset dataset'
  const preprocessingMode =
    workspace.preprocessingSummary?.preprocessing_config?.mode ??
    workspace.recommendedConfig?.preprocessing?.mode ??
    '--'
  const transformedCount = workspace.preprocessingSummary?.feature_count_after_encoding ?? '--'

  return [
    {
      key: 'task.target_column',
      value: target,
      description: 'Target yang direkomendasikan backend untuk proses klasifikasi.',
    },
    {
      key: 'task.positive_class',
      value: positiveClass.value,
      description: 'Positive class untuk perhitungan metrik biner.',
    },
    {
      key: 'preprocessing.mode',
      value: preprocessingMode,
      description: 'Mode preprocessing yang aktif menurut kontrak backend baru.',
    },
    {
      key: 'features.after_encoding',
      value: `${transformedCount}`,
      description: 'Jumlah fitur setelah encoding pada preprocessing summary run aktif.',
    },
  ]
})

const configJson = computed(() => workspace.configEditorText)
const targetDistribution = computed(() => workspace.targetConversionPreview?.target_distribution ?? [])
const preprocessingSummary = computed(() => workspace.preprocessingSummary)

const targetTotal = computed(() => {
  return targetDistribution.value.reduce((sum: number, row: any) => sum + row.count, 0)
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
    <SectionCard
      eyebrow="Dataset Preset"
      title="Pilih konfigurasi dataset"
      description="Preset yang sama digunakan untuk rekomendasi konfigurasi dan preview konversi target."
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <label
          v-for="preset in workspace.configurationPresets"
          :key="preset.id"
          class="cursor-pointer rounded-[1.5rem] border p-4 transition"
          :class="workspace.selectedPreset === preset.id
            ? 'border-cyan-300/50 bg-cyan-300/10'
            : 'border-white/10 bg-black/20 hover:border-white/20'"
        >
          <div class="flex items-start gap-3">
            <input
              type="radio"
              name="config-preset"
              :value="preset.id"
              :checked="workspace.selectedPreset === preset.id"
              :disabled="workspace.isLoadingPreset"
              class="mt-1 accent-cyan-300"
              @change="handlePresetChange"
            />
            <span>
              <span class="block font-medium text-white">{{ preset.label }}</span>
              <span class="mt-1 block text-sm leading-6 text-slate-300">{{ preset.description }}</span>
            </span>
          </div>
        </label>
      </div>
      <p v-if="workspace.isLoadingPreset" class="mt-4 text-sm text-cyan-100">Memuat konfigurasi preset...</p>
      <p v-if="workspace.errorMessage" class="mt-4 text-sm text-rose-200">{{ workspace.errorMessage }}</p>
    </SectionCard>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
      <SectionCard
        eyebrow="Config Lens"
        title="JSON sebagai sumber instruksi pipeline"
        description="Halaman ini menonjolkan ide utama dokumen: konfigurasi bukan model. Ia hanyalah instruksi pipeline yang dapat divalidasi, diberi versi, dan diaktifkan."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <article
            v-for="item in configHighlights"
            :key="item.key"
            class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">{{ item.key }}</p>
            <p class="mt-2 line-clamp-2 min-h-[4rem] font-heading text-xl font-semibold leading-tight text-white">
              {{ item.value }}
            </p>
            <p class="mt-2 text-sm leading-6 text-slate-300">{{ item.description }}</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Target Conversion"
        title="Preview konversi target atau CGPA ke kategori"
        description="Bagian ini mengikuti endpoint `GET /datasets/{dataset_id}/target-conversion-preview` dari dokumentasi baru."
      >
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <p class="text-sm text-slate-400">Target Column</p>
              <p class="mt-2 font-heading text-2xl text-white">
                {{ targetColumn || '--' }}
              </p>
            </div>
            <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <p class="text-sm text-slate-400">Positive Class</p>
              <p class="mt-2 font-heading text-2xl text-white">
                {{ positiveClass }}
              </p>
            </div>
          </div>

          <div class="grid gap-3">
            <article
              v-for="item in targetDistribution"
              :key="item.label"
              class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
            >
              <div class="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>{{ item.label }}</span>
                <span>{{ item.count }}</span>
              </div>
              <div class="h-2 rounded-full bg-white/8">
                <div
                  class="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                  :style="{ width: `${Math.min((item.count / (targetTotal || 1)) * 100, 100)}%` }"
                />
              </div>
            </article>
          </div>
        </div>
      </SectionCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard
        eyebrow="Canonical JSON"
        title="Draft konfigurasi yang bisa divalidasi"
        description="Editor ini sekarang mengikuti payload config yang dipakai frontend untuk `upload-train`."
      >
        <div class="rounded-[1.7rem] border border-white/10 bg-[#08101e] p-3">
          <pre class="max-h-[620px] overflow-auto rounded-[1.25rem] bg-[#06101d] p-5 text-sm leading-7 text-cyan-100"><code>{{ configJson }}</code></pre>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Preprocessing Summary"
        title="Ringkasan preprocessing per run"
        description="Data ini berasal dari endpoint preprocessing summary milik run aktif."
      >
        <div class="grid gap-4 grid-cols-1">
          <div class="min-w-0 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">Before Encoding</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ preprocessingSummary?.feature_count_before_encoding ?? '--' }}</p>
          </div>
          <div class="min-w-0 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">After Encoding</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ preprocessingSummary?.feature_count_after_encoding ?? '--' }}</p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <div class="min-w-0 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Numeric</p>
            <p class="mt-2 break-words leading-6">{{ preprocessingSummary?.numeric_features?.join(', ') || '--' }}</p>
          </div>
          <div class="min-w-0 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Categorical</p>
            <p class="mt-2 break-words leading-6">{{ preprocessingSummary?.categorical_features?.join(', ') || '--' }}</p>
          </div>
          <div class="min-w-0 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Ordinal</p>
            <p class="mt-2 break-words leading-6">{{ preprocessingSummary?.ordinal_features?.join(', ') || '--' }}</p>
          </div>
        </div>
      </SectionCard>
    </section>

    <SectionCard
      eyebrow="Validation Surface"
      title="Error dan warning perlu dibedakan secara tegas"
      description="Sesuai desain backend, error menghentikan training, sedangkan warning memberi konteks risiko. UI perlu membuat keduanya mudah dibaca dan diambil tindakannya."
    >
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-[1.7rem] border border-rose-400/20 bg-rose-400/8 p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-rose-200">Blocking Errors</p>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-rose-50/90">
            <li>Target column tidak ditemukan atau lebih dari satu.</li>
            <li>Tidak ada feature aktif setelah cleaning.</li>
            <li>Positive class tidak ada pada data.</li>
            <li>Parameter model di luar rentang valid.</li>
          </ul>
        </div>
        <div class="rounded-[1.7rem] border border-amber-300/20 bg-amber-300/8 p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-100">Actionable Warnings</p>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-amber-50/90">
            <li>Possible identifier masih dipakai sebagai feature.</li>
            <li>High-cardinality categorical feature meningkatkan kompleksitas encoding.</li>
            <li>Class imbalance bisa membuat accuracy terlihat lebih baik dari real quality.</li>
            <li>Missing ratio tinggi butuh review strategi imputasi.</li>
          </ul>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
