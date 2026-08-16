<script setup lang="ts">
defineProps<{
  label: string
  value: string
  note: string
  tone: string
}>()
</script>

<template>
  <article class="stat-card" :data-tone="tone">
    <p class="stat-card__label">{{ label }}</p>
    <p class="stat-card__value">{{ value }}</p>
    <p class="stat-card__note">{{ note }}</p>
  </article>
</template>
