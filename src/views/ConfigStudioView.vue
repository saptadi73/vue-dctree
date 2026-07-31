<script setup lang="ts">
import { computed, onMounted } from 'vue'
import SectionCard from '../components/SectionCard.vue'
import { useWorkspaceStore } from '../stores/workspace'

const workspace = useWorkspaceStore()

onMounted(() => {
  if (!workspace.activeDataset && !workspace.isBootstrapping) {
    workspace.bootstrap()
  }
})

const configHighlights = computed(() => {
  const target = workspace.targetConversionPreview?.target_column ?? 'Target not available'
  const positiveClass = workspace.targetConversionPreview?.positive_class ?? '--'
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
      value: positiveClass,
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
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        eyebrow="Config Lens"
        title="JSON sebagai sumber instruksi pipeline"
        description="Halaman ini menonjolkan ide utama dokumen: konfigurasi bukan model. Ia hanyalah instruksi pipeline yang dapat divalidasi, diberi versi, dan diaktifkan."
      >
        <div class="space-y-4">
          <article
            v-for="item in configHighlights"
            :key="item.key"
            class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">{{ item.key }}</p>
            <p class="mt-2 font-heading text-2xl font-semibold text-white">{{ item.value }}</p>
            <p class="mt-2 text-sm leading-6 text-slate-300">{{ item.description }}</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Target Conversion"
        title="Preview konversi target atau CGPA ke kategori"
        description="Bagian ini mengikuti endpoint `GET /datasets/{dataset_id}/target-conversion-preview` dari dokumentasi baru."
      >
        <div class="space-y-3">
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
      </SectionCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <SectionCard
        eyebrow="Canonical JSON"
        title="Draft konfigurasi yang bisa divalidasi"
        description="Editor ini sekarang mengikuti payload config yang dipakai frontend untuk `upload-train`."
      >
        <pre class="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-[#08101e] p-5 text-sm leading-7 text-cyan-100"><code>{{ configJson }}</code></pre>
      </SectionCard>

      <SectionCard
        eyebrow="Preprocessing Summary"
        title="Ringkasan preprocessing per run"
        description="Data ini berasal dari endpoint `GET /experiments/runs/{run_id}/preprocessing-summary`."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">Before Encoding</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ preprocessingSummary?.feature_count_before_encoding ?? '--' }}</p>
          </div>
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-sm text-slate-400">After Encoding</p>
            <p class="mt-2 font-heading text-3xl text-white">{{ preprocessingSummary?.feature_count_after_encoding ?? '--' }}</p>
          </div>
        </div>

        <div class="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          <p>Numeric: {{ preprocessingSummary?.numeric_features?.join(', ') || '--' }}</p>
          <p class="mt-2">Categorical: {{ preprocessingSummary?.categorical_features?.join(', ') || '--' }}</p>
          <p class="mt-2">Ordinal: {{ preprocessingSummary?.ordinal_features?.join(', ') || '--' }}</p>
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
