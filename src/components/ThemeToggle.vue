<script setup lang="ts">
import { computed } from 'vue'
import { Moon, SunMedium } from '@lucide/vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const isDark = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="isDark = !isDark"
  >
    <span class="theme-toggle__icon">
      <SunMedium v-if="!isDark" class="h-4 w-4" />
      <Moon v-else class="h-4 w-4" />
    </span>
    <span class="theme-toggle__label">{{ isDark ? 'Dark' : 'Light' }}</span>
  </button>
</template>
