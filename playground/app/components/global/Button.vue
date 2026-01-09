<template>
  <button :class="`btn-${size} btn-${appearance}`">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import type { ButtonProps } from '#imports'

const {
  size = 'medium',
  appearance = 'default',
} = defineProps<ButtonProps>()
</script>
