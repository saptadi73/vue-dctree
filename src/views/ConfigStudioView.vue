<script setup lang="ts">
import SectionCard from '../components/SectionCard.vue'
import { configHighlights, configJson } from '../data/decisionTreeDemo'
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
        eyebrow="Canonical JSON"
        title="Draft konfigurasi yang bisa divalidasi"
        description="Contoh ini diringkas dari dokumen acuan dan menunjukkan bagian yang paling menentukan perilaku eksperimen."
      >
        <pre class="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-[#08101e] p-5 text-sm leading-7 text-cyan-100"><code>{{ configJson }}</code></pre>
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
