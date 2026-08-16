<script setup lang="ts">
defineProps<{
  title: string
  eyebrow?: string
  description?: string
}>()
</script>

<template>
  <section class="surface-card">
    <div class="surface-card__header">
      <p v-if="eyebrow" class="surface-card__eyebrow">
        {{ eyebrow }}
      </p>
      <h2 class="surface-card__title">
        {{ title }}
      </h2>
      <p v-if="description" class="surface-card__description">
        {{ description }}
      </p>
    </div>

    <slot />
  </section>
</template>
