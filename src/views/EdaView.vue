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

const eda = computed(() => workspace.edaVisualization)
const numericDistributions = computed(() => eda.value?.charts?.numeric_distributions ?? [])
const categoricalDistributions = computed(() => eda.value?.charts?.categorical_distributions ?? [])
const columns = computed(() => eda.value?.columns ?? [])
const missingColumns = computed(() => eda.value?.charts?.missing_ratio_by_column?.slice(0, 6) ?? [])
const uniqueColumns = computed(() => eda.value?.charts?.unique_ratio_by_column?.slice(0, 6) ?? [])

function toPercent(value?: number) {
  return `${((value ?? 0) * 100).toFixed(1)}%`
}

function categoryBarWidth(count: number, maxCount: number) {
  if (!maxCount) return '0%'
  return `${Math.max((count / maxCount) * 100, 10)}%`
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      eyebrow="EDA"
      title="Exploratory Data Analysis"
      description="Halaman ini khusus untuk endpoint dataset-level `eda-visualization`, sehingga tahap EDA punya tempat sendiri yang lebih fokus."
    >
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="text-sm text-slate-400">Rows</p>
          <p class="mt-2 font-heading text-3xl text-white">{{ eda?.summary?.rows ?? '--' }}</p>
        </div>
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="text-sm text-slate-400">Columns</p>
          <p class="mt-2 font-heading text-3xl text-white">{{ eda?.summary?.columns ?? '--' }}</p>
        </div>
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="text-sm text-slate-400">Missing Cells</p>
          <p class="mt-2 font-heading text-3xl text-white">{{ eda?.summary?.missing_cells ?? '--' }}</p>
        </div>
        <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p class="text-sm text-slate-400">Duplicate Rows</p>
          <p class="mt-2 font-heading text-3xl text-white">{{ eda?.summary?.duplicate_rows ?? '--' }}</p>
        </div>
      </div>
    </SectionCard>

    <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        eyebrow="Quality Signals"
        title="Missing dan unique ratio"
        description="Dua indikator ini membantu cepat melihat kolom mana yang bermasalah dan mana yang terlalu identitas."
      >
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Missing Ratio</p>
            <div class="mt-4 space-y-3">
              <div v-for="item in missingColumns" :key="item.column">
                <div class="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{{ item.column }}</span>
                  <span>{{ toPercent(item.missing_ratio) }}</span>
                </div>
                <div class="h-2 rounded-full bg-white/8">
                  <div
                    class="h-2 rounded-full bg-gradient-to-r from-rose-300 to-orange-300"
                    :style="{ width: toPercent(item.missing_ratio) }"
                  />
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
                  <span>{{ toPercent(item.unique_ratio) }}</span>
                </div>
                <div class="h-2 rounded-full bg-white/8">
                  <div
                    class="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                    :style="{ width: toPercent(Math.min(item.unique_ratio, 1)) }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Numeric Stats"
        title="Distribusi numerik"
        description="Backend mengirim statistik siap render untuk kolom numerik."
      >
        <div class="space-y-4">
          <article
            v-for="item in numericDistributions"
            :key="item.column"
            class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <p class="font-medium text-white">{{ item.column }}</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-4 text-sm text-slate-300">
              <div>Min: {{ item.stats?.min ?? '--' }}</div>
              <div>Max: {{ item.stats?.max ?? '--' }}</div>
              <div>Mean: {{ item.stats?.mean?.toFixed?.(2) ?? item.stats?.mean ?? '--' }}</div>
              <div>Median: {{ item.stats?.median ?? '--' }}</div>
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Categorical Stats"
        title="Distribusi kategori"
        description="Untuk kolom kategorikal, frontend membaca top categories yang sudah dihitung backend."
      >
        <div class="space-y-4">
          <article
            v-for="item in categoricalDistributions.slice(0, 4)"
            :key="item.column"
            class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <p class="font-medium text-white">{{ item.column }}</p>
            <div class="mt-4 space-y-3">
              <template v-if="item.top_categories?.length">
                <div
                  v-for="category in item.top_categories.slice(0, 5)"
                  :key="`${item.column}-${category.value}`"
                >
                  <div class="mb-1 flex items-center justify-between text-sm text-slate-300">
                    <span>{{ category.value }}</span>
                    <span>{{ category.count }}</span>
                  </div>
                  <div class="h-2 rounded-full bg-white/8">
                    <div
                      class="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                      :style="{ width: categoryBarWidth(category.count, item.top_categories[0]?.count ?? 0) }"
                    />
                  </div>
                </div>
              </template>
              <div
                v-else
                class="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400"
              >
                Tidak ada kategori dominan yang dikirim backend untuk kolom ini.
              </div>
            </div>
          </article>
        </div>
      </SectionCard>
    </section>

    <SectionCard
      eyebrow="Column Profile"
      title="Profil kolom dataset"
      description="Tabel ini menggabungkan tipe inferensi, unique ratio, dan missing ratio dari endpoint EDA."
    >
      <div class="overflow-x-auto rounded-[1.5rem] border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead class="bg-white/8 text-slate-300">
            <tr>
              <th class="px-4 py-3 font-medium">Column</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Unique Ratio</th>
              <th class="px-4 py-3 font-medium">Missing Ratio</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10 bg-black/20 text-slate-100">
            <tr v-for="column in columns" :key="column.name">
              <td class="px-4 py-3">{{ column.name }}</td>
              <td class="px-4 py-3">{{ column.inferred_type }}</td>
              <td class="px-4 py-3">{{ toPercent(column.unique_ratio) }}</td>
              <td class="px-4 py-3">{{ toPercent(column.missing_ratio) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  </div>
</template>
