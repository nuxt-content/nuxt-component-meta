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
interface PropsObject {
  hello: string,
  booleanProp?: boolean,
  numberProp?: number,
  /**
   * The foo array property.
   *
   * @since v1.0.0
   */
  foo?: string[]
  partialImage?: string | (Partial<HTMLImageElement> & { [key: string]: any })
}
withDefaults(defineProps<PropsObject>(), {
  numberProp: 42,
  foo: () => ['bar', 'baz']
})
defineEmits(['change', 'delete'])
</script>
