<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { BarChart3, FolderTree, House, Settings } from '@lucide/vue'

const route = useRoute()

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: House },
  { name: 'Structure', path: '/structure', icon: FolderTree },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
]

const pageTitle = computed(() => {
  return navigationItems.find((item) => item.path === route.path)?.name ?? 'Dashboard'
})
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,_#f7efe5,_#f3f4f6_42%,_#e5eef7)] text-slate-900">
    <div class="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
      <aside class="border-b border-white/60 bg-white/70 px-6 py-6 backdrop-blur lg:min-h-screen lg:w-72 lg:border-r lg:border-b-0">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
            <FolderTree class="h-6 w-6" />
          </div>
          <div>
            <p class="font-heading text-xl font-semibold tracking-tight">Vue DCTree</p>
            <p class="text-sm text-slate-500">Navigation starter kit</p>
          </div>
        </div>

        <nav class="mt-8 flex flex-col gap-2">
          <RouterLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            class="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-900 hover:text-white"
            active-class="bg-slate-900 text-white shadow-lg shadow-slate-900/15"
          >
            <component :is="item.icon" class="h-5 w-5" />
            <span>{{ item.name }}</span>
          </RouterLink>
        </nav>
      </aside>

      <main class="flex-1 px-6 py-8 lg:px-10">
        <header class="mb-8 flex flex-col gap-2">
          <p class="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Workspace</p>
          <h1 class="font-heading text-4xl font-semibold tracking-tight">{{ pageTitle }}</h1>
        </header>

        <RouterView />
      </main>
    </div>
  </div>
</template>
