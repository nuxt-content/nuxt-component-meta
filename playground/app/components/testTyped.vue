<template>
  <div>
    <hr>
    TestTyped
    <hr>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  hello: string,
  booleanProp?: boolean,
  numberProp?: number,
  /**
   * The foo array property.
   *
   * @since v1.0.0
   */
  foo?: string[]
}>(), {
  numberProp: 42,
  foo: () => ['bar', 'baz']
})
defineEmits(['change', 'delete'])
</script>
