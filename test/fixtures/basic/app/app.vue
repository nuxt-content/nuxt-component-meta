<template>
  <div>
    <h2>Components</h2>
    <pre>{{ data }}</pre>
  </div>
</template>

<script setup>
const { data } = await useAsyncData('metas', () => $fetch('/api/component-meta'))
</script>
