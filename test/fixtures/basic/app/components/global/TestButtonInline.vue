<template>
  <button :class="`btn-${size} btn-${appearance}`">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import type { TestButtonInlineProps } from '../../../shared/types/test-button-inline'

const {
  size = 'medium',
  appearance = 'default',
} = defineProps<TestButtonInlineProps>()
</script>
