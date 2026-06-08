import { bench, describe } from 'vitest'
import { join } from 'path'
import { extractMacroMeta } from '../src/parser/macro-extractor'

const filename = join(__dirname, 'component.vue')
const macros = [{ name: 'extendComponentMeta' }]

/**
 * The legacy implementation that this PR replaces: a non-greedy regex capture
 * of the first `{...}` argument, evaluated with `eval`. Reproduced here so the
 * benchmark compares the two strategies on identical input.
 */
function legacyExtract(code: string): Record<string, any> | null {
  const match = code.match(/extendComponentMeta\((\{[\s\S]*?\})\)/)
  if (!match?.length) return null
  try {
    // eslint-disable-next-line no-eval
    return eval(`(${match[1]})`)
  } catch {
    // The non-greedy regex captures an unbalanced fragment on nested objects,
    // so `eval` throws here — i.e. the legacy path silently extracts nothing.
    return null
  }
}

// A small, flat object literal — the common case.
const simple = `<template><div /></template>
<script setup lang="ts">
extendComponentMeta({ hello: 'world', foo: 'bar' })
defineProps({ title: String })
</script>`

// A larger, deeply nested literal — closer to real "studio" metadata payloads.
const nested = `<template><div /></template>
<script setup lang="ts">
extendComponentMeta({
  category: 'form',
  icon: 'i-lucide-file',
  studio: {
    inputs: [
      { name: 'filePath', type: 'file', required: true },
      { name: 'label', type: 'string', default: 'Pick a file' },
      { name: 'accept', type: 'array', items: ['image/*', 'application/pdf'] }
    ],
    layout: { columns: 2, gap: 'sm' }
  },
  tags: ['upload', 'media', 'forms']
})
defineProps({ title: String })
</script>`

describe('simple flat object', () => {
  bench('legacy: regex + eval', () => {
    legacyExtract(simple)
  })

  bench('new: oxc AST + jiti', () => {
    extractMacroMeta(simple, macros, filename)
  })
})

describe('large nested object', () => {
  bench('legacy: regex + eval', () => {
    legacyExtract(nested)
  })

  bench('new: oxc AST + jiti', () => {
    extractMacroMeta(nested, macros, filename)
  })
})
