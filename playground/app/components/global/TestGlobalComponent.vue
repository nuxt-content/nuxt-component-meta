<template>
  <div>
    <hr>
    TestComponent
    <hr>
    <slot />
    <slot name="nuxt" />
  </div>
</template>

<script setup>
defineProps({
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
  }
})

defineEmits(['change', 'delete'])

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const test = {}
</script>
