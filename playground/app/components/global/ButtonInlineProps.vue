<template>
  <button :class="`btn-${size} btn-${appearance}`">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import type { ButtonInlineProps } from '../../../shared/types/button-inline-props'

const {
  size = 'medium',
  appearance = 'default',
} = defineProps<ButtonInlineProps>()
</script>
