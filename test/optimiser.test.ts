import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { optimiseJSON } from '../src/parser/optimiser'

describe('optimiser', () => {
  it('should handle already optimized content', () => {
    const content = 'const _test = [];\n\nexport default { test: _test }'
    const result = optimiseJSON(content)
    
    // Should return as-is or optimized further
    expect(result).toBeTruthy()
    expect(result).toContain('export default')
  })
  
  it('should handle empty export default', () => {
    const content = 'export default {};'
    const result = optimiseJSON(content)
    
    expect(result.split('\n').pop()).toBe(content)
  })
  
  it('should extract common strings', () => {
    const content = `export default {
      "ComponentA": {
        "meta": {
          "props": [
            { "name": "test", "type": "string", "description": "common description" },
            { "name": "other", "type": "string", "description": "common description" }
          ]
        }
      },
      "ComponentB": {
        "meta": {
          "props": [
            { "name": "test", "type": "string", "description": "common description" }
          ]
        }
      }
    }`
    
    const result = optimiseJSON(content)
    
    // Should extract duplicate strings or props
    expect(result).toContain('const _')
  })
  
  it('should extract empty arrays', () => {
    const content = `export default {
      "a": { "items": [] },
      "b": { "items": [] },
      "c": { "items": [] }
    }`
    
    const result = optimiseJSON(content)
    
    // Should extract the entire duplicate object (which includes the empty array)
    expect(result).toContain('const _')
    expect(result).toContain('[]')
  })
  
  it('should extract duplicate objects', () => {
    const content = `export default {
      "ComponentA": {
        "meta": {
          "props": [
            { "name": "disabled", "type": "boolean", "required": false, "global": false, "tags": [], "description": "" }
          ],
          "slots": [],
          "events": [],
          "exposed": []
        }
      },
      "ComponentB": {
        "meta": {
          "props": [
            { "name": "disabled", "type": "boolean", "required": false, "global": false, "tags": [], "description": "" }
          ],
          "slots": [],
          "events": [],
          "exposed": []
        }
      },
      "ComponentC": {
        "meta": {
          "props": [
            { "name": "disabled", "type": "boolean", "required": false, "global": false, "tags": [], "description": "" }
          ],
          "slots": [],
          "events": [],
          "exposed": []
        }
      }
    }`
    
    const result = optimiseJSON(content)
    
    // Should extract the duplicate prop and empty arrays
    expect(result).toContain('const _')
    expect(result).toMatch(/boolean/)
  })

  it.skip('should optimize big-json.json and reduce file size', () => {
    const inputPath = join(__dirname, './data/big-json.json')
    const outputPath = join(__dirname, './data/big-json.optimized.mjs')
    
    // Read the big JSON file
    const content = readFileSync(inputPath, 'utf-8')
    const originalSize = content.length
    const originalLines = content.split('\n').length
    
    console.log(`\nOriginal file:`)
    console.log(`  Size: ${(originalSize / 1024).toFixed(2)} KB`)
    console.log(`  Lines: ${originalLines}`)
    
    // Optimize it
    const startTime = performance.now()
    const optimized = optimiseJSON(content)
    const endTime = performance.now()
    
    const optimizedSize = optimized.length
    const optimizedLines = optimized.split('\n').length
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2)
    const lineReduction = ((originalLines - optimizedLines) / originalLines * 100).toFixed(2)
    
    console.log(`\nOptimized file:`)
    console.log(`  Size: ${(optimizedSize / 1024).toFixed(2)} KB`)
    console.log(`  Lines: ${optimizedLines}`)
    console.log(`  Size reduction: ${reduction}%`)
    console.log(`  Line reduction: ${lineReduction}%`)
    console.log(`  Time taken: ${(endTime - startTime).toFixed(2)}ms`)
    
    // Write optimized output for inspection
    writeFileSync(outputPath, optimized, 'utf-8')
    console.log(`\nOptimized file written to: ${outputPath}`)
    
    // Verify optimization worked
    expect(optimizedSize).toBeLessThan(originalSize)
    expect(optimized).toContain('const _')
    expect(optimized).toContain('export default')
    
    const noComments = optimized.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').trim()
    // Verify the optimized file can be parsed back
    const exportMatch = noComments.match(/^((?:const .+\n)*)\nexport default (.+)$/s)
    expect(exportMatch).toBeTruthy()

  })
  
})

