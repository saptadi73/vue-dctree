<script setup lang="ts">
defineProps<{
  label: string
  value: string
  note: string
  tone: string
}>()
</script>

<template>
  <article
    class="rounded-[1.8rem] border border-white/10 p-5"
    :class="`bg-gradient-to-br ${tone}`"
  >
    <p class="text-sm font-medium text-slate-200">{{ label }}</p>
    <p class="mt-3 font-heading text-4xl font-semibold tracking-tight text-white">{{ value }}</p>
    <p class="mt-3 text-sm leading-6 text-slate-300">{{ note }}</p>
  </article>
</template>
