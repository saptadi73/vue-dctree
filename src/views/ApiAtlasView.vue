<script setup lang="ts">
import SectionCard from '../components/SectionCard.vue'
import { apiEndpointGroups, moduleMap } from '../data/decisionTreeDemo'
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        eyebrow="Backend Modules"
        title="Peta domain FastAPI yang relevan untuk frontend"
        description="Daftar ini memetakan modul yang disebut di dokumen teknis menjadi area tanggung jawab yang mudah dibaca tim frontend dan backend."
      >
        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="module in moduleMap"
            :key="module.name"
            class="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <p class="font-heading text-2xl font-semibold text-white">{{ module.name }}</p>
            <p class="mt-2 text-sm leading-6 text-slate-300">{{ module.role }}</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="API Contracts"
        title="Endpoint clusters yang paling sering dipakai UI"
        description="Tampilan ini cocok dipakai sebagai navigator cepat saat menghubungkan komponen frontend ke service backend."
      >
        <div class="space-y-4">
          <article
            v-for="group in apiEndpointGroups"
            :key="group.title"
            class="rounded-[1.6rem] border border-white/10 bg-black/20 p-5"
          >
            <p class="text-xs uppercase tracking-[0.24em] text-cyan-200/70">{{ group.title }}</p>
            <ul class="mt-3 space-y-2 text-sm leading-6 text-slate-200">
              <li v-for="endpoint in group.endpoints" :key="endpoint">{{ endpoint }}</li>
            </ul>
          </article>
        </div>
      </SectionCard>
    </section>

    <SectionCard
      eyebrow="Realtime + Artifacts"
      title="Dua integrasi yang sering terlupakan tapi penting"
      description="Dokumen backend memberi dua sinyal penting untuk UI modern: progress event stream dan download artifact terotorisasi."
    >
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
          <p class="font-heading text-2xl font-semibold text-white">Server-Sent Events</p>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            `GET /api/v1/runs/{run_id}/events` mengalirkan progress satu arah. UI tetap harus menyediakan polling fallback ke `/status`.
          </p>
        </div>
        <div class="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
          <p class="font-heading text-2xl font-semibold text-white">Artifact Downloads</p>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            Model `.joblib`, `tree.svg`, `metrics.json`, dan report PDF sebaiknya diakses via signed URL singkat atau streaming terotorisasi.
          </p>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
