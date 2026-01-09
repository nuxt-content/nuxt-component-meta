<template>
  <div>
    Dummy component to test useSlots
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { title, default: dd } = useSlots()
</script>
