import { parseSync } from 'oxc-parser'
import { walk } from 'oxc-walker'
import MagicString from 'magic-string'
import { existsSync, readFileSync } from 'fs'
import { dirname, extname, join } from 'pathe'
import type { ExtendMetaFunction } from '../types/module'

const SCRIPT_BLOCK_RE = /<script(?:\s[^>]*)?>(?<content>[\s\S]*?)<\/script>/

/**
 * For .vue files, extract the script block content.
 * Returns the full code unchanged for non-.vue files.
 */
function extractScriptContent(code: string, filename: string): string {
  if (!filename.endsWith('.vue')) return code
  return SCRIPT_BLOCK_RE.exec(code)?.groups?.content ?? ''
}

/**
 * Resolve a relative import specifier to an absolute file path.
 * Returns undefined for bare package specifiers or unresolvable paths.
 */
function resolveImportFile(importSource: string, fromDir: string): string | undefined {
  if (!importSource.startsWith('.')) return undefined

  const base = join(fromDir, importSource)

  if (extname(base) && existsSync(base)) return base

  for (const ext of ['.ts', '.js', '.mts', '.mjs', '.tsx', '.jsx']) {
    const candidate = base + ext
    if (existsSync(candidate)) return candidate
  }

  for (const ext of ['.ts', '.js', '.mts', '.mjs']) {
    const candidate = join(base, 'index' + ext)
    if (existsSync(candidate)) return candidate
  }

  return undefined
}

/**
 * Find the import source path for a given local identifier name in a parsed program.
 */
function findImportSource(program: any, localName: string): string | undefined {
  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration') continue
    for (const spec of node.specifiers) {
      if (
        (spec.type === 'ImportDefaultSpecifier' && spec.local.name === localName) ||
        (spec.type === 'ImportSpecifier' && spec.local.name === localName)
      ) {
        return node.source.value as string
      }
    }
  }
  return undefined
}

/**
 * Find an exported constant's value in a parsed program.
 * If `propertyName` is provided, looks up that property on the exported object.
 */
function findExportedValue(program: any, exportName: string, propertyName: string): any {
  for (const node of program.body) {
    let decls: any[] | null = null

    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
      decls = node.declaration.declarations
    }
    else if (node.type === 'VariableDeclaration') {
      decls = node.declarations
    }

    if (!decls) continue

    for (const decl of decls) {
      if (decl.id?.name !== exportName) continue

      let init = decl.init
      // Unwrap TypeScript wrappers like `as const`
      while (init?.type === 'TSAsExpression' || init?.type === 'TSSatisfiesExpression') {
        init = init.expression
      }

      if (init?.type === 'ObjectExpression') {
        return readObjectProperty(init, propertyName)
      }
    }
  }
  return undefined
}

/**
 * Read a single named property's literal value from an ObjectExpression node.
 */
function readObjectProperty(objectExpr: any, propertyName: string): any {
  for (const prop of objectExpr.properties) {
    if (prop.type !== 'Property') continue
    const keyName = prop.key.type === 'Identifier' ? prop.key.name
      : prop.key.type === 'Literal' ? String(prop.key.value)
      : undefined
    if (keyName !== propertyName) continue

    let value = prop.value
    while (value?.type === 'TSAsExpression' || value?.type === 'TSSatisfiesExpression') {
      value = value.expression
    }
    return value?.type === 'Literal' ? value.value : undefined
  }
  return undefined
}

/**
 * Recursively evaluate an AST node to a plain JS value.
 * Handles literals, objects, arrays, and MemberExpressions resolved via imports.
 */
function evaluateNode(node: any, program: any, fromDir: string): any {
  if (!node) return undefined

  // Unwrap TypeScript wrappers
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') {
    return evaluateNode(node.expression, program, fromDir)
  }

  switch (node.type) {
    case 'Literal':
      return node.value

    case 'TemplateLiteral':
      if (!node.expressions.length && node.quasis.length === 1) {
        return node.quasis[0].value.cooked ?? undefined
      }
      return undefined

    case 'ObjectExpression': {
      const result: Record<string, any> = {}
      for (const prop of node.properties) {
        if (prop.type !== 'Property') continue
        const key = prop.key.type === 'Identifier' ? prop.key.name
          : prop.key.type === 'Literal' ? String(prop.key.value)
          : undefined
        if (!key) continue
        result[key] = evaluateNode(prop.value, program, fromDir)
      }
      return result
    }

    case 'ArrayExpression':
      return node.elements.map((el: any) => el ? evaluateNode(el, program, fromDir) : null)

    case 'UnaryExpression':
      if (node.operator === '-') {
        const val = evaluateNode(node.argument, program, fromDir)
        return typeof val === 'number' ? -val : undefined
      }
      return undefined

    case 'MemberExpression': {
      if (node.object.type !== 'Identifier' || node.property.type !== 'Identifier') return undefined

      const objectName: string = node.object.name
      const propertyName: string = node.property.name

      const importSource = findImportSource(program, objectName)
      if (!importSource) return undefined

      const importFile = resolveImportFile(importSource, fromDir)
      if (!importFile) return undefined

      let importedSource: string
      try {
        importedSource = readFileSync(importFile, 'utf-8')
      }
      catch {
        return undefined
      }

      let importedProgram: any
      try {
        importedProgram = parseSync(importFile, importedSource).program
      }
      catch {
        return undefined
      }

      return findExportedValue(importedProgram, objectName, propertyName)
    }

    default:
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
  }
  catch {
    return []
  }

  const fromDir = dirname(filename)
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
      if (!args.length || args[0].type !== 'ObjectExpression') return

      const extracted = evaluateNode(args[0], program, fromDir)
      if (!extracted || typeof extracted !== 'object') return

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
  }
  catch {
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
