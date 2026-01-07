<template>
  <div>
    Dummy component to test useSlots
  </div>
</template>

<script setup lang="ts">
const slots = useSlots()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultSlot = computed(() => slots.default?.())

</script>
