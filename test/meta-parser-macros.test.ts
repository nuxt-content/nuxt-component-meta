import { describe, test, expect, beforeEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'pathe'
import { useComponentMetaParser } from '../src/parser/meta-parser'

const rootDir = join(import.meta.dirname, '.tmp/meta-parser-macros')
const componentsDir = join(rootDir, 'components')
const componentPath = join(componentsDir, 'Card.vue')

function writeComponent(macroArgument: string) {
  writeFileSync(componentPath, `<script setup lang="ts">
extendComponentMeta(${macroArgument})

defineProps<{ title?: string }>()
</script>

<template>
  <div>{{ title }}</div>
</template>
`)
}

function createParser() {
  return useComponentMetaParser({
    rootDir,
    outputDir: rootDir,
    componentDirs: [componentsDir],
    components: [{ pascalName: 'Card', filePath: componentPath }],
  } as any)
}

describe('meta parser macros', () => {
  beforeEach(() => {
    rmSync(rootDir, { recursive: true, force: true })
    mkdirSync(componentsDir, { recursive: true })
  })

  test('uses the new macro output when a component changes', async () => {
    writeComponent(`{ studio: { label: 'Old', tooltip: 'Removed' } }`)
    const parser = createParser()
    await parser.init()
    parser.fetchComponent('Card')

    writeComponent(`{ studio: { label: 'New' } }`)
    parser.fetchComponent('Card')

    expect(parser.components.Card?.meta.studio).toEqual({ label: 'New' })
  })

  test('drops the output of a removed macro call', async () => {
    writeComponent(`{ studio: { label: 'Old' } }`)
    const parser = createParser()
    await parser.init()
    parser.fetchComponent('Card')

    writeComponent(`{}`)
    parser.fetchComponent('Card')

    expect(parser.components.Card?.meta.studio).toBeUndefined()
  })

  test('uses the new macro output when a component changed since the last output was written', async () => {
    writeComponent(`{ studio: { label: 'Old' } }`)
    const parser = createParser()
    await parser.init()
    parser.fetchComponent('Card')
    await parser.updateOutput()

    writeComponent(`{ studio: { label: 'New' } }`)
    const restartedParser = createParser()
    await restartedParser.init()
    restartedParser.fetchComponent('Card')

    expect(restartedParser.components.Card?.meta.studio).toEqual({ label: 'New' })
  })
})
