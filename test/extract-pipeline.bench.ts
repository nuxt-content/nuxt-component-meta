import { bench, describe, expect } from 'vitest'
import { join } from 'path'
import { parseSync } from 'oxc-parser'
import { walk, isBindingIdentifier } from 'oxc-walker'
import { createJiti } from 'jiti'
import { findStaticImports, parseStaticImport } from 'mlly'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { extractMacroMeta } from '../src/parser/macro-extractor'

/**
 * A configurable replica of `extractMacroMeta` so the script-extraction axis can
 * be varied on identical input:
 *   - 'regex' (shipped) vs 'sfc' (original @vue/compiler-sfc)
 *
 * The `regex` corner is asserted equal to the real exported `extractMacroMeta`
 * below, so the replica is a faithful stand-in.
 */

const SCRIPT_BLOCK_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi

function extractScriptRegex(code: string, filename: string): string {
  if (!filename.endsWith('.vue')) return code
  const blocks: string[] = []
  let m: RegExpExecArray | null
  SCRIPT_BLOCK_RE.lastIndex = 0
  while ((m = SCRIPT_BLOCK_RE.exec(code))) blocks.push(m[1]!)
  return blocks.join('\n')
}

function extractScriptSfc(code: string, filename: string): string {
  if (!filename.endsWith('.vue')) return code
  const { descriptor } = parseSfc(code, { filename, ignoreEmpty: false })
  return [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n')
}

function collectReferencedIdentifiers(node: any): Set<string> {
  const names = new Set<string>()
  walk(node, {
    enter(n: any, parent: any) {
      if (n.type !== 'Identifier') return
      if (isBindingIdentifier(n, parent)) return
      if (parent?.type === 'MemberExpression' && parent.property === n && !parent.computed) return
      if (parent?.type === 'Property' && parent.key === n && !parent.computed) return
      names.add(n.name)
    }
  })
  return names
}

function buildEvalModule(content: string, argNode: any): string {
  const referencedNames = collectReferencedIdentifiers(argNode)
  const argSource = content.slice(argNode.start, argNode.end)
  if (!referencedNames.size) return `export default (${argSource})`

  const neededImports: string[] = []
  for (const rawImport of findStaticImports(content)) {
    const parsed = parseStaticImport(rawImport)
    const importedNames = [
      parsed.defaultImport,
      parsed.namespacedImport,
      ...Object.values(parsed.namedImports ?? {})
    ].filter(Boolean) as string[]
    if (importedNames.some(name => referencedNames.has(name))) neededImports.push(rawImport.code)
  }
  return [...neededImports, `export default (${argSource})`].join('\n')
}

type Opts = { script: 'regex' | 'sfc' }

function makeExtract({ script }: Opts) {
  const extractScript = script === 'regex' ? extractScriptRegex : extractScriptSfc

  return function extract(code: string, macroName: string, filename: string): Record<string, any>[] {
    const content = extractScript(code, filename)
    if (!content.trim()) return []
    const parseFilename = filename.endsWith('.vue') ? filename.replace('.vue', '.ts') : filename

    let program: any
    try {
      program = parseSync(parseFilename, content).program
    } catch {
      return []
    }

    const results: Record<string, any>[] = []
    walk(program, {
      enter(node: any) {
        if (
          node.type !== 'ExpressionStatement'
          || node.expression.type !== 'CallExpression'
          || node.expression.callee.type !== 'Identifier'
          || node.expression.callee.name !== macroName
        ) return
        const args = node.expression.arguments
        if (!args.length || args[0].type !== 'ObjectExpression') return

        try {
          const jiti = createJiti(parseFilename, { moduleCache: false, fsCache: false })
          const value: any = jiti.evalModule(buildEvalModule(content, args[0]), { filename: parseFilename })
          const v = value?.default ?? value
          if (v && typeof v === 'object') results.push(v)
        } catch { /* ignore */ }
      }
    })
    return results
  }
}

// --- Inputs ----------------------------------------------------------------

const dir = join(__dirname, 'fixtures')

// A) literal-only argument — no imports, jiti just evaluates the literal.
const literalFile = join(dir, 'literal-comp.vue')
const literal = `<template><div /></template>
<script setup lang="ts">
extendComponentMeta({
  category: 'form',
  icon: 'i-lucide-file',
  studio: { inputs: [{ name: 'a', type: 'string' }, { name: 'b', type: 'file' }], layout: { columns: 2 } },
  tags: ['upload', 'media', 'forms']
})
defineProps({ title: String })
</script>`

// B) imported-const-ref argument — jiti must resolve & execute a relative import.
const importFile = join(dir, 'import-comp.vue')
const importRef = `<template><div /></template>
<script setup lang="ts">
import { BenchConst } from './bench-const'
extendComponentMeta({ category: 'form', defaultType: BenchConst.FILE })
defineProps({ title: String })
</script>`

// --- Fidelity check: replica corner === real shipped function --------------

const real = (code: string, file: string) => extractMacroMeta(code, [{ name: 'extendComponentMeta' }], file)
const shippedReplica = makeExtract({ script: 'regex' })
expect(shippedReplica(literal, 'extendComponentMeta', literalFile)).toEqual(real(literal, literalFile))
expect(shippedReplica(importRef, 'extendComponentMeta', importFile)).toEqual(real(importRef, importFile))

// --- Benchmarks ------------------------------------------------------------

const variants: Array<{ label: string, opts: Opts }> = [
  { label: 'sfc   (BEFORE all changes)', opts: { script: 'sfc' } },
  { label: 'regex (AFTER / shipped)', opts: { script: 'regex' } }
]

describe('end-to-end: literal-only argument', () => {
  for (const v of variants) {
    const fn = makeExtract(v.opts)
    bench(v.label, () => { fn(literal, 'extendComponentMeta', literalFile) })
  }
})

describe('end-to-end: imported-const-ref argument', () => {
  for (const v of variants) {
    const fn = makeExtract(v.opts)
    bench(v.label, () => { fn(importRef, 'extendComponentMeta', importFile) })
  }
})
