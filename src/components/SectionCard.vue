<script setup lang="ts">
defineProps<{
  title: string
  eyebrow?: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl">
    <div class="mb-5">
      <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
        {{ eyebrow }}
      </p>
      <h2 class="mt-2 font-heading text-2xl font-semibold tracking-tight text-white">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-2 max-w-full break-words text-sm leading-6 text-slate-300">
        {{ description }}
      </p>
    </div>

    <slot />
  </section>
</template>
