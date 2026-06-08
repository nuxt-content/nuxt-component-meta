import { bench, describe } from 'vitest'
import { parse as parseSfc } from '@vue/compiler-sfc'

// The shipped implementation (regex) — see src/parser/macro-extractor.ts
const SCRIPT_BLOCK_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
function regexExtract(code: string): string {
  const blocks: string[] = []
  let m: RegExpExecArray | null
  SCRIPT_BLOCK_RE.lastIndex = 0
  while ((m = SCRIPT_BLOCK_RE.exec(code))) blocks.push(m[1]!)
  return blocks.join('\n')
}

// The previous implementation (full SFC parse) that pulled in @vue/compiler-sfc.
function sfcExtract(code: string, filename: string): string {
  const { descriptor } = parseSfc(code, { filename, ignoreEmpty: false })
  return [descriptor.script?.content, descriptor.scriptSetup?.content]
    .filter(Boolean)
    .join('\n')
}

const small = `<template>
  <div><label>{{ label }}</label><input type="file"></div>
</template>

<script setup lang="ts">
import { FieldType } from '../utils/field-type'
extendComponentMeta({ category: 'form', defaultType: FieldType.FILE })
extendStudioInput({ filePath: 'file-picker', multiple: true })
defineProps({ label: { type: String, default: 'Pick a file' } })
</script>`

// A larger component: both a normal <script> and a <script setup>, plus a
// realistic template, to reflect a heavier real-world SFC.
const large = `<template>
  <div class="card">
    <header><h2>{{ title }}</h2><slot name="actions" /></header>
    <ul>
      <li v-for="(item, i) in items" :key="i" @click="select(item)">
        {{ item.label }} — {{ item.value }}
      </li>
    </ul>
    <footer><slot /></footer>
  </div>
</template>

<script lang="ts">
export default { name: 'BigComponent', inheritAttrs: false }
</script>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FieldType } from '../utils/field-type'

interface Item { label: string, value: string }

const props = defineProps<{ title: string, items: Item[] }>()
const emit = defineEmits<{ select: [Item] }>()
const active = ref<Item | null>(null)
const count = computed(() => props.items.length)
function select(item: Item) { active.value = item; emit('select', item) }

extendComponentMeta({
  category: 'form',
  icon: 'i-lucide-list',
  studio: {
    inputs: [
      { name: 'title', type: 'string', required: true },
      { name: 'items', type: 'array', default: FieldType.TEXT }
    ]
  }
})
extendStudioInput({ filePath: 'big-component', multiple: false })
</script>

<style scoped>
.card { padding: 1rem; }
</style>`

describe('small SFC', () => {
  bench('regex', () => {
    regexExtract(small)
  })
  bench('@vue/compiler-sfc parse', () => {
    sfcExtract(small, 'small.vue')
  })
})

describe('large SFC (2 script blocks)', () => {
  bench('regex', () => {
    regexExtract(large)
  })
  bench('@vue/compiler-sfc parse', () => {
    sfcExtract(large, 'large.vue')
  })
})
