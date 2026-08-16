<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import {
  Blocks,
  BrainCircuit,
  ChartColumn,
  ClipboardList,
  Database,
  FileJson,
  GitBranchPlus,
  Radar,
} from '@lucide/vue'
import ThemeToggle from './components/ThemeToggle.vue'

const route = useRoute()
const isDark = ref(true)

onMounted(() => {
  const savedTheme = localStorage.getItem('dctree-theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  }
})

watch(
  isDark,
  (value) => {
    document.documentElement.dataset.theme = value ? 'dark' : 'light'
    localStorage.setItem('dctree-theme', value ? 'dark' : 'light')
  },
  { immediate: true },
)

const navigationGroups = [
  {
    items: [
      { name: 'Overview', path: '/', icon: Radar },
      { name: 'Pipeline', path: '/pipeline', icon: GitBranchPlus },
      { name: 'EDA', path: '/eda', icon: Radar },
      { name: 'Config', path: '/config-studio', icon: FileJson },
    ],
  },
  {
    items: [
      { name: 'Tree', path: '/tree-explorer', icon: BrainCircuit },
      { name: 'Evaluation', path: '/evaluation-lab', icon: ChartColumn },
      { name: 'Workflow', path: '/workflow-detail', icon: GitBranchPlus },
      { name: 'Manual Survey', path: '/manual-survey', icon: ClipboardList },
      { name: 'Data List', path: '/data-list', icon: Database },
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
  '/eda':
    'Ringkasan EDA, missing ratio, unique ratio, dan distribusi data dari endpoint dataset-level.',
  '/config-studio': 'Editor konfigurasi JSON dan validasi yang mengikuti kontrak backend.',
  '/tree-explorer': 'Eksplorasi node decision tree dan rules hasil training.',
  '/evaluation-lab': 'Metrik, confusion matrix, dan feature importance dari backend.',
  '/workflow-detail': 'Timeline detail 7 langkah analisis dari workflow visualization backend.',
  '/manual-survey':
    'Halaman tersendiri untuk input respons survei manual, analisis dataset, dan training model dengan workflow manual.',
  '/data-list':
    'Daftar data yang sudah siap ditelusuri, difilter, dan dipaginasi untuk review cepat.',
  '/api-atlas': 'Ringkasan endpoint dan modul backend yang dipakai frontend.',
}
</script>

<template>
  <div class="app-shell" :class="isDark ? 'theme-dark' : 'theme-light'">
    <div class="app-shell__glow" />

    <div class="app-shell__layout">
      <aside class="app-shell__sidebar app-panel">
        <div class="brand-card">
          <div class="brand-card__logo-wrap">
            <img src="/decision.png" alt="Decision Tree logo" class="brand-card__logo" />
          </div>
          <div>
            <p class="brand-card__title">Decision Tree OS</p>
            <p class="brand-card__subtitle">ML cockpit</p>
          </div>
        </div>

        <div class="sidebar-nav">
          <section
            v-for="(group, groupIndex) in navigationGroups"
            :key="groupIndex"
            class="sidebar-nav__group"
          >
            <nav class="sidebar-nav__list">
              <RouterLink
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="sidebar-nav__item"
                active-class="is-active"
              >
                <div class="sidebar-nav__icon">
                  <component :is="item.icon" class="h-5 w-5" />
                </div>
                <p>{{ item.name }}</p>
              </RouterLink>
            </nav>
          </section>
        </div>
      </aside>

      <main class="app-shell__main">
        <header class="app-header app-panel">
          <div class="app-header__content">
            <div>
              <p class="app-header__eyebrow">Friday, July 31, 2026</p>
              <h1 class="app-header__title">
                {{ activeItem.name }}
              </h1>
              <p class="app-header__description">
                {{ pageDescriptions[route.path] }} Experience ini memetakan alur upload dataset,
                konfigurasi JSON, training Decision Tree, evaluasi, dan kontrak API yang ada pada
                desain FastAPI.
              </p>
            </div>

            <div class="app-header__actions">
              <ThemeToggle v-model="isDark" />
              <div class="mini-stat">
                <p class="mini-stat__label">Run State</p>
                <p class="mini-stat__value success">COMPLETED</p>
              </div>
              <div class="mini-stat">
                <p class="mini-stat__label">Artifacts</p>
                <p class="mini-stat__value warn">11 outputs</p>
              </div>
            </div>
          </div>
        </header>

        <RouterView />
      </main>
    </div>
  </div>
</template>
