<template>
  <div>
    <slot />
    <hr>
    <slot name="nuxt" />
  </div>
</template>

<script setup>

extendComponentMeta({
  hello: 'world',
  foo: 'bar'
})

defineProps({
  hello: {
    type: String,
    default: 'Hello'
  }
})
defineEmits(['change', 'delete'])

</script>
