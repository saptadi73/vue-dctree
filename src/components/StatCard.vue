<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    note?: string
    tone?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'
  }>(),
  {
    tone: 'cyan',
  },
)
</script>

<template>
  <article class="stat-card" :data-tone="tone">
    <p class="stat-card__label">{{ label }}</p>
    <p class="stat-card__value">{{ value }}</p>
    <p v-if="note" class="stat-card__note">{{ note }}</p>
  </article>
</template>
