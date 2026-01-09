<template>
  <div>
    <hr>
    TestComponent
    <hr>
    <slot />
    <slot name="nuxt" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

interface ArrayItem {
  name: string
  age: number
}

defineProps({
  name: {
    type: String,
    required: true
  },
  /**
   * The foo property.
   *
   * @since v1.0.0
   */
  foo: {
    type: String,
    default: 'Hello'
  },
  /**
   * The hello property.
   *
   * @since v1.0.0
   */
  hello: {
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
  data: {
    type: Object as PropType<{ gello: string }>,
    default: () => ({})
  },
  array: {
    type: Array as PropType<Array<ArrayItem>>,
    default: () => []
  },
  stringArray: {
    type: Array as PropType<Array<string>>,
    default: () => []
  },
  numberArray: {
    type: Array as PropType<Array<number>>,
    default: () => []
  }
})

defineEmits(['change', 'delete'])

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const test = {}
</script>
