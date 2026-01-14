import { describe, test, expect } from 'vitest'
import { getComponentMeta } from '../src/parser'
import { propsToJsonSchema } from '../src/utils/schema'

describe('ComponentMetaParser', () => {
  test('should be able to fetch component meta', async () => {
    const meta = getComponentMeta('playground/app/components/TestComponent.vue')

    expect(meta).toBeDefined()
    expect(meta.props).toBeDefined()

    const propsNames = meta.props.map(prop => prop.name)
    expect(propsNames).toContain('foo')
    expect(propsNames).toContain('hello')
    expect(propsNames).toContain('booleanProp')
    expect(propsNames).toContain('numberProp')
  })

  test('propsToJsonSchema should convert props to JSON Schema format', async () => {
    const meta = getComponentMeta('playground/app/components/TestComponent.vue')
    const jsonSchema = propsToJsonSchema(meta.props)
    expect(jsonSchema).toBeDefined()
    expect(jsonSchema.type).toBe('object')
    expect(jsonSchema.properties).toBeDefined()

    // Check that properties are correctly converted
    expect(jsonSchema.properties?.foo).toEqual({
      type: 'string',
      description: 'The foo property.',
      default: 'Hello'
    })

    expect(jsonSchema.properties?.booleanProp).toEqual({
      type: 'boolean',
      default: false
    })

    expect(jsonSchema.properties?.numberProp).toEqual({
      type: 'number',
      default: 1.3
    })

    expect(jsonSchema.properties?.data).toEqual({
      "type": "object",
      "properties": {
        "gello": {
          "type": "string"
        }
      },
      "additionalProperties": false,
      "default": {},
      "required": ["gello"]
    })

    expect(jsonSchema.properties?.array).toEqual({
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "age": {
            "type": "number"
          }
        },
        "required": [
          "name",
          "age"
        ],
        "additionalProperties": false
      },
      "default": []
    })

    expect(jsonSchema.properties?.stringArray).toEqual({
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": []
    })

    expect(jsonSchema.properties?.numberArray).toEqual({
      "type": "array",
      "items": {
        "type": "number"
      },
      "default": []
    })

    // Since no props are required, the required array should not exist
    expect(jsonSchema.required).toEqual(['name'])
  })

  test('TestD.vue', () => {
    const meta = getComponentMeta('playground/app/components/TestD.vue')
    const result = propsToJsonSchema(meta.props)

    expect(result.properties?.foo).toEqual({
      description: "FOOOOOO",
      "type": "array",
      "items": {
        "type": "string"
      }
    })

    expect(result.properties?.bar).toEqual({
      "type": "array",
      "items": {
        "type": [
          "string",
          "number"
        ]
      }
    })
  })

  test('should handle Interface[] syntax correctly', () => {
    const meta = getComponentMeta('playground/app/components/TestInterfaceArray.vue')
    const jsonSchema = propsToJsonSchema(meta.props)

    // Test required Interface[] prop
    expect(jsonSchema.properties?.books).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          isbn: { type: 'string' },
          publishedYear: { type: 'number' }
        },
        required: ['title', 'isbn', 'publishedYear'],
        additionalProperties: false
      }
    })

    // Test optional Interface[] prop with enum
    expect(jsonSchema.properties?.authors).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          role: {
            type: 'string',
            enum: ['admin', 'user', 'guest']
          }
        },
        required: ['name', 'email'],
        additionalProperties: false
      }
    })

    // Test required array should include 'books'
    expect(jsonSchema.required).toContain('books')
    expect(jsonSchema.required).not.toContain('authors')
  })

  test('should handle array props with primitive types', () => {
    const meta = getComponentMeta('playground/app/components/TestInterfaceArray.vue')
    const jsonSchema = propsToJsonSchema(meta.props)

    // Test string array
    expect(jsonSchema.properties?.tags).toEqual({
      type: 'array',
      items: { type: 'string' }
    })

    // Test number array
    expect(jsonSchema.properties?.ratings).toEqual({
      type: 'array',
      items: { type: 'number' }
    })
  })

  test('forceUseTs option should work with TypeScript components', () => {
    // This test verifies that TypeScript-only features work
    const meta = getComponentMeta('playground/app/components/TestInterfaceArray.vue')

    // Should successfully parse TypeScript interface definitions
    expect(meta.props).toBeDefined()
    expect(meta.props.length).toBeGreaterThan(0)

    // Verify it can extract interface types
    const authorsProp = meta.props.find(p => p.name === 'authors')
    expect(authorsProp).toBeDefined()
    expect(authorsProp?.type).toContain('Author[]')

    const booksProp = meta.props.find(p => p.name === 'books')
    expect(booksProp).toBeDefined()
    expect(booksProp?.type).toContain('Book[]')
  })

  test('should parse JS components without forceUseTs', () => {
    // Test that JS components (non-TypeScript Vue SFCs) still work
    const meta = getComponentMeta('playground/app/components/TestJSComponent.vue')
    const jsonSchema = propsToJsonSchema(meta.props)

    expect(jsonSchema.properties?.message).toEqual({
      type: 'string',
      default: 'Hello from JS'
    })

    expect(jsonSchema.properties?.count).toEqual({
      type: 'number'
    })

    expect(jsonSchema.required).toEqual(['count'])
  })

  test('should simplify native browser types', () => {
    const meta = getComponentMeta('playground/app/components/TextDefine.vue')
    const jsonSchema = propsToJsonSchema(meta.props)

    expect(jsonSchema.properties?.canvas).toEqual({
      type: 'object',
      description: 'Native type: HTMLCanvasElement'
    })

    const canvasPropJSON = jsonSchema.properties?.canvas as any
    expect(canvasPropJSON.properties).toBeUndefined()
    expect(canvasPropJSON.required).toBeUndefined()
  })

  test('should simplify Partial<NativeType> in union types', () => {
    const meta = getComponentMeta('playground/app/components/testTyped.vue')
    const jsonSchema = propsToJsonSchema(meta.props)

    // partialImage is: string | (Partial<HTMLImageElement> & { [key: string]: any })
    // Should be converted to anyOf with string and the intersection
    expect(jsonSchema.properties?.partialImage).toEqual({
      anyOf: [
        { type: 'string' },
        {
          allOf: [
            { type: 'Partial<HTMLImageElement>' },
            { type: '{ [key: string]: any; }' }
          ]
        }
      ]
    })
  })

  test('should handle prop interfaces imported from nuxt aliases (e.g. `#import`', async () => {
    const meta = getComponentMeta('playground/app/components/global/TestButton.vue')

    expect(meta).toBeDefined()
    expect(meta.props).toBeDefined()
    expect(meta.props.length).toEqual(2)

    const propsNames = meta.props.map(prop => prop.name)
    expect(propsNames).toContain('appearance')
    expect(propsNames).toContain('size')
    expect(propsNames).not.toContain('TestButtonProps')

    const sizeProp = meta.props.find(prop => prop.name === 'size')
    expect(sizeProp?.type).toBe("\"small\" | \"medium\" | \"large\"")
  })
})
