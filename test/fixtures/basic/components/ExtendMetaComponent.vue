<template>
  <div>
    <h3>Extended Meta Component</h3>
    <p>This component has extended metadata</p>
    <slot />
  </div>
</template>

<script setup>

extendComponentMeta({
  description: 'A component that demonstrates extendComponentMeta functionality',
  version: '1.0.0',
  tags: ['test', 'meta'],
  customData: {
    for: 'Test Suite',
    category: 'utility'
  }
})

defineProps({
  title: {
    type: String,
    default: 'Default Title'
  },
  enabled: {
    type: Boolean,
    default: true
  }
})

defineEmits(['updated'])

</script>
