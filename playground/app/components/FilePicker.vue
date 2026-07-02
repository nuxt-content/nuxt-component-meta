<template>
  <div>
    <label>{{ label }}</label>
    <input type="file">
  </div>
</template>

<script setup lang="ts">
import { FieldType } from '../utils/field-type'

extendComponentMeta({
  category: 'form',
  defaultType: FieldType.FILE
})

extendStudioInput({
  filePath: 'file-picker',
  multiple: true
})

defineProps({
  label: {
    type: String,
    default: 'Pick a file'
  }
})
</script>
