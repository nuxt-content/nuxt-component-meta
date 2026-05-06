import { parseSync } from 'oxc-parser'
import { walk, isBindingIdentifier } from 'oxc-walker'
import MagicString from 'magic-string'
import { createJiti } from 'jiti'
import { findStaticImports, parseStaticImport } from 'mlly'
import { parse as parseSfc } from '@vue/compiler-sfc'
import type { ExtendMetaFunction } from '../types/module'

/**
 * For .vue files, extract and concatenate all script block contents
 * (both <script> and <script setup>).
 * Returns the full code unchanged for non-.vue files.
 */
function extractScriptContent(code: string, filename: string): string {
  if (!filename.endsWith('.vue')) return code
  const { descriptor } = parseSfc(code, { filename, ignoreEmpty: false })
  return [descriptor.script?.content, descriptor.scriptSetup?.content]
    .filter(Boolean)
    .join('\n')
}

/**
 * Walk an AST node and collect all referenced identifier names —
 * excludes binding positions, non-computed property keys, and member expression properties.
 */
function collectReferencedIdentifiers(node: any): Set<string> {
  const names = new Set<string>()
  walk(node, {
    enter(n: any, parent: any) {
      if (n.type !== 'Identifier') return
      if (isBindingIdentifier(n, parent)) return
      // Skip `foo` in `obj.foo` (non-computed member property)
      if (parent?.type === 'MemberExpression' && parent.property === n && !parent.computed) return
      // Skip `key` in `{ key: value }` (non-computed object property key)
      if (parent?.type === 'Property' && parent.key === n && !parent.computed) return
      names.add(n.name)
    }
  })
  return names
}

/**
 * Build a self-contained ESM module string for the macro argument.
 * Collects all import statements whose bindings are referenced in the expression.
 */
function buildEvalModule(content: string, argNode: any): string {
  const referencedNames = collectReferencedIdentifiers(argNode)
  const argSource = content.slice(argNode.start, argNode.end)

  if (!referencedNames.size) {
    return `export default (${argSource})`
  }

  const neededImports: string[] = []
  for (const rawImport of findStaticImports(content)) {
    const parsed = parseStaticImport(rawImport)
    const importedNames = [
      parsed.defaultImport,
      parsed.namespacedImport,
      ...Object.values(parsed.namedImports ?? {}),
    ].filter(Boolean) as string[]

    if (importedNames.some(name => referencedNames.has(name))) {
      neededImports.push(rawImport.code)
    }
  }

  return [...neededImports, `export default (${argSource})`].join('\n')
}

/**
 * Evaluate a macro argument (ObjectExpression or ArrayExpression) to a plain JS value.
 * Returns undefined if evaluation fails or the result is not a plain object/array.
 */
function evaluateMacroArgument(content: string, argNode: any, filename: string): Record<string, any> | any[] | undefined {
  const moduleSource = buildEvalModule(content, argNode)

  try {
    const jiti = createJiti(filename, { moduleCache: false, fsCache: false })
    const result = jiti.evalModule(moduleSource, { filename })

    // Handle ESM default export interop
    const value = (result as any)?.default ?? result
    if (value === null || value === undefined) return undefined

    // Accept arrays
    if (Array.isArray(value)) return value as any[]

    if (typeof value !== 'object') return undefined

    // Reject non-plain objects (class instances, etc.)
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return undefined

    return value as Record<string, any>
  } catch {
    return undefined
  }
}

/**
 * Extract metadata from all registered macro calls in `code`.
 * Returns an array of objects (one per matching call), with transforms applied.
 * Supports static object literals and imported const references as values.
 */
export function extractMacroMeta(
  code: string,
  macros: ExtendMetaFunction[],
  filename = 'component.vue'
): Record<string, any>[] {
  if (!macros.length) return []

  const macroNames = new Set(macros.map(m => m.name))
  if (![...macroNames].some(name => code.includes(name))) return []

  const content = extractScriptContent(code, filename)
  if (!content.trim()) return []

  // Use .ts extension so oxc parses TypeScript syntax correctly
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
      ) return

      const macroName: string = node.expression.callee.name
      if (!macroNames.has(macroName)) return

      const args = node.expression.arguments
      if (!args.length) return
      const argType = args[0].type
      if (argType !== 'ObjectExpression' && argType !== 'ArrayExpression') return

      const extracted = evaluateMacroArgument(content, args[0], parseFilename)
      if (!extracted) return

      const macro = macros.find(m => m.name === macroName)!

      if (Array.isArray(extracted)) {
        // Arrays require a transform to produce a mergeable object — skip if none configured
        if (!macro.transform) return
        results.push(macro.transform(extracted))
      } else {
        results.push(macro.transform ? macro.transform(extracted) : extracted)
      }
    }
  })

  return results
}

/**
 * Strip all registered macro call statements from `code`.
 * Returns a magic-string result with sourcemap, or `undefined` if nothing was changed.
 */
export function stripMacroCalls(
  code: string,
  macroNames: string[],
  filename = 'component.js'
): { code: string; map: any } | undefined {
  if (!macroNames.length) return undefined
  if (!macroNames.some(name => code.includes(name))) return undefined

  let program: any
  try {
    program = parseSync(filename, code).program
  } catch {
    return undefined
  }

  const nameSet = new Set(macroNames)
  const s = new MagicString(code)
  let changed = false

  walk(program, {
    enter(node: any) {
      if (
        node.type !== 'ExpressionStatement'
        || node.expression.type !== 'CallExpression'
        || node.expression.callee.type !== 'Identifier'
      ) return

      if (!nameSet.has(node.expression.callee.name)) return

      s.remove(node.start, node.end)
      changed = true
    }
  })

  if (!changed) return undefined

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true })
  }
}
