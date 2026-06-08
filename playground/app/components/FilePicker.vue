<template>
  <div>
    <label>{{ label }}</label>
    <input type="file">
  </div>
</template>

<script setup lang="ts">
import { FieldType } from '../utils/field-type'

/**
 * `extendComponentMeta` now resolves imported const references, not just
 * inline object literals — the value is evaluated at build time via the AST
 * extractor, so `FieldType.FILE` lands in the meta as the literal `'file'`.
 */
extendComponentMeta({
  category: 'form',
  defaultType: FieldType.FILE
})

/**
 * `extendStudioInput` is a custom compiler macro registered in nuxt.config via
 * `componentMeta.extendMetaFunctions`. Its `transform` wraps the argument under
 * `_studio`, and the call itself is stripped from the browser bundle.
 */
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
