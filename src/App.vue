<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import {
  Blocks,
  BrainCircuit,
  ChartColumn,
  FileJson,
  GitBranchPlus,
  Radar,
} from '@lucide/vue'

const route = useRoute()

const navigationGroups = [
  {
    items: [
      { name: 'Overview', path: '/', icon: Radar },
      { name: 'Pipeline', path: '/pipeline', icon: GitBranchPlus },
      { name: 'Config', path: '/config-studio', icon: FileJson },
    ],
  },
  {
    items: [
      { name: 'Tree', path: '/tree-explorer', icon: BrainCircuit },
      { name: 'Evaluation', path: '/evaluation-lab', icon: ChartColumn },
      { name: 'API', path: '/api-atlas', icon: Blocks },
    ],
  },
]

const flatNavigation = navigationGroups.flatMap((group) => group.items)

const defaultNavigationItem = flatNavigation[0]!

const activeItem = computed(() => {
  return flatNavigation.find((item) => item.path === route.path) ?? defaultNavigationItem
})

const pageDescriptions: Record<string, string> = {
  '/': 'Ringkasan dataset, health backend, upload, dan eksperimen terbaru.',
  '/pipeline': 'Peta workflow dataset, konfigurasi, training, dan artifact generation.',
  '/config-studio': 'Editor konfigurasi JSON dan validasi yang mengikuti kontrak backend.',
  '/tree-explorer': 'Eksplorasi node decision tree dan rules hasil training.',
  '/evaluation-lab': 'Metrik, confusion matrix, dan feature importance dari backend.',
  '/api-atlas': 'Ringkasan endpoint dan modul backend yang dipakai frontend.',
}
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-[#0b1020] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(42,157,143,0.3),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(231,111,81,0.22),_transparent_20%),linear-gradient(180deg,_rgba(15,23,42,0.94),_rgba(7,12,24,1))]" />

    <div class="relative mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
      <aside class="border-b border-white/10 bg-white/5 px-6 py-6 backdrop-blur-xl lg:min-h-screen lg:w-[320px] lg:border-r lg:border-b-0">
        <div class="rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl shadow-cyan-950/20">
          <div class="flex items-center gap-4">
            <img
              src="/decision.png"
              alt="Decision Tree logo"
              class="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-cyan-950/40"
            />
            <div>
              <p class="font-heading text-2xl font-semibold tracking-tight">Decision Tree OS</p>
              <p class="text-sm text-slate-300">ML cockpit</p>
            </div>
          </div>
        </div>

        <div class="mt-8 space-y-4">
          <section v-for="(group, groupIndex) in navigationGroups" :key="groupIndex">
            <nav class="space-y-2">
              <RouterLink
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="group flex items-center gap-3 rounded-[1.5rem] border border-transparent px-4 py-3 transition hover:border-white/12 hover:bg-white/8"
                active-class="border-white/10 bg-white/12 shadow-lg shadow-black/20"
              >
                <div class="rounded-2xl bg-white/8 p-2 text-cyan-200 transition group-hover:bg-cyan-400/15">
                  <component :is="item.icon" class="h-5 w-5" />
                </div>
                <p class="font-medium text-white">{{ item.name }}</p>
              </RouterLink>
            </nav>
          </section>
        </div>
      </aside>

      <main class="flex-1 px-5 py-6 lg:px-8 lg:py-8">
        <header class="mb-6 rounded-[2rem] border border-white/10 bg-white/7 p-6 backdrop-blur-xl">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/75">Friday, July 31, 2026</p>
              <h1 class="mt-2 font-heading text-4xl font-semibold tracking-tight">{{ activeItem.name }}</h1>
              <p class="mt-3 max-w-3xl text-slate-300">
                {{ pageDescriptions[route.path] }} Experience ini memetakan alur upload dataset, konfigurasi JSON, training Decision Tree, evaluasi, dan kontrak API yang ada pada desain FastAPI.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 lg:w-[360px]">
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Run State</p>
                <p class="mt-2 font-heading text-2xl text-emerald-300">COMPLETED</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Artifacts</p>
                <p class="mt-2 font-heading text-2xl text-orange-200">11 outputs</p>
              </div>
            </div>
          </div>
        </header>

        <RouterView />
      </main>
    </div>
  </div>
</template>
