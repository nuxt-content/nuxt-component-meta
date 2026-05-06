import { describe, test, expect } from 'vitest'
import { join } from 'path'
import { extractMacroMeta } from '../src/parser/macro-extractor'

describe('extractMacroMeta', () => {
  const filename = join(__dirname, 'component.ts')

  test('extracts a plain object argument', () => {
    const code = `extendComponentMeta({ hello: 'world', foo: 'bar' })`
    const results = extractMacroMeta(code, [{ name: 'extendComponentMeta' }], filename)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ hello: 'world', foo: 'bar' })
  })

  test('applies transform to object argument', () => {
    const code = `extendProps({ filePath: 'file-picker' })`
    const results = extractMacroMeta(code, [
      { name: 'extendProps', transform: extracted => ({ _studio: extracted }) }
    ], filename)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ _studio: { filePath: 'file-picker' } })
  })

  test('extracts array argument when transform is provided', () => {
    const code = `defineStudioInputs([{ name: 'filePath', type: 'file' }, { name: 'label', type: 'string' }])`
    const results = extractMacroMeta(code, [
      { name: 'defineStudioInputs', transform: (inputs: any) => ({ _studio: { inputs } }) }
    ], filename)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      _studio: {
        inputs: [
          { name: 'filePath', type: 'file' },
          { name: 'label', type: 'string' },
        ]
      }
    })
  })

  test('skips array argument when no transform is configured', () => {
    const code = `extendComponentMeta([{ foo: 'bar' }])`
    const results = extractMacroMeta(code, [{ name: 'extendComponentMeta' }], filename)
    expect(results).toHaveLength(0)
  })

  test('returns nothing for unknown macro names', () => {
    const code = `unknownMacro({ foo: 'bar' })`
    const results = extractMacroMeta(code, [{ name: 'extendComponentMeta' }], filename)
    expect(results).toHaveLength(0)
  })

  test('handles empty macro list', () => {
    const code = `extendComponentMeta({ foo: 'bar' })`
    const results = extractMacroMeta(code, [], filename)
    expect(results).toHaveLength(0)
  })

  test('extracts multiple macro calls', () => {
    const code = [
      `extendComponentMeta({ hello: 'world' })`,
      `extendProps({ filePath: 'file-picker' })`,
    ].join('\n')
    const results = extractMacroMeta(code, [
      { name: 'extendComponentMeta' },
      { name: 'extendProps', transform: extracted => ({ _studio: extracted }) }
    ], filename)
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ hello: 'world' })
    expect(results[1]).toEqual({ _studio: { filePath: 'file-picker' } })
  })
})
