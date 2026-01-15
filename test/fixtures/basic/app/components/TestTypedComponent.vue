<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup lang="ts">
export type TestObject = {
  size: string
}

defineProps<{
  stringProp: string,
  booleanProp?: boolean,
  numberProp?: number,
  arrayProp?: string[]
  objectProp?: TestObject
}>()
</script>
