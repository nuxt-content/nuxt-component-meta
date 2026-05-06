import { parseSync } from 'oxc-parser'
import { walk } from 'oxc-walker'
import MagicString from 'magic-string'
import type { ExtendMetaFunction } from '../types/module'

const SCRIPT_BLOCK_RE = /<script(?:\s[^>]*)?>(?<content>[\s\S]*?)<\/script>/

/**
 * For .vue files, extract the script block content and its start offset.
 * Returns the full code unchanged for non-.vue files.
 */
function extractScriptContent(code: string, filename: string): { content: string; offset: number } {
  if (!filename.endsWith('.vue')) {
    return { content: code, offset: 0 }
  }
  const match = SCRIPT_BLOCK_RE.exec(code)
  if (!match?.groups?.content) {
    return { content: '', offset: 0 }
  }
  return {
    content: match.groups.content,
    offset: match.index + match[0].indexOf(match.groups.content)
  }
}

/**
 * Extract metadata from all registered macro calls in `code`.
 * Returns an array of objects (one per matching call), with transforms applied.
 */
export function extractMacroMeta(
  code: string,
  macros: ExtendMetaFunction[],
  filename = 'component.vue'
): Record<string, any>[] {
  if (!macros.length) return []

  const macroNames = new Set(macros.map(m => m.name))
  if (![...macroNames].some(name => code.includes(name))) return []

  const { content } = extractScriptContent(code, filename)
  if (!content.trim()) return []

  let program: any
  try {
    program = parseSync(filename.endsWith('.vue') ? filename.replace('.vue', '.js') : filename, content).program
  } catch {
    return []
  }

  const results: Record<string, any>[] = []

  walk(program, {
    enter(node: any) {
      if (
        node.type !== 'ExpressionStatement' ||
        node.expression.type !== 'CallExpression' ||
        node.expression.callee.type !== 'Identifier'
      ) return

      const macroName = node.expression.callee.name
      if (!macroNames.has(macroName)) return

      const args = node.expression.arguments
      if (!args.length || args[0].type !== 'ObjectExpression') return

      const argSource = content.slice(args[0].start, args[0].end)
      let extracted: Record<string, any>
      try {
        extracted = new Function(`return (${argSource})`)()
      } catch {
        return
      }

      const macro = macros.find(m => m.name === macroName)!
      results.push(macro.transform ? macro.transform(extracted) : extracted)
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
        node.type !== 'ExpressionStatement' ||
        node.expression.type !== 'CallExpression' ||
        node.expression.callee.type !== 'Identifier'
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
