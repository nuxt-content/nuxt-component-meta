<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />

    <SomeComponent :prop="$slots.variable" />
    <SomeComponent :prop="$slots['foo-bar']" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  stringProp: {
    type: String,
    default: 'Hello'
  },
  booleanProp: {
    type: Boolean,
    default: false
  },
  numberProp: {
    type: Number,
    default: 1.3
  },
  arrayProp: {
    type: Array,
    default: () => []
  },
  typedArrayProps: {
    type: Array as PropType<string[]>,
    default: () => ([]),
    required: false
  },
  objectProp: {
    type: Object,
    default: () => ({})
  }
})
defineEmits(['change', 'delete'])
</script>
