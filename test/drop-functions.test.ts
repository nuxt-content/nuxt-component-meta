import { describe, test, expect } from 'vitest'
import { propsToJsonSchema } from '../src/utils/schema'

describe('Function Prop Filtering', () => {
  test('should filter out function/event props', () => {
    const propsWithFunctions = [
      {
        "name": "color",
        "global": false,
        "description": "The color of the button",
        "tags": [],
        "required": false,
        "type": "\"error\" | \"primary\" | \"secondary\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"error\" | \"primary\" | \"secondary\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"error\"",
            "2": "\"primary\"",
            "3": "\"secondary\""
          }
        }
      },
      {
        "name": "onClick",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "((event: MouseEvent) => void | Promise<void>) | ((event: MouseEvent) => void | Promise<void>)[] | undefined",
        "schema": {
          "kind": "enum",
          "type": "((event: MouseEvent) => void | Promise<void>) | ((event: MouseEvent) => void | Promise<void>)[] | undefined",
          "schema": {
            "0": "undefined",
            "1": {
              "kind": "event",
              "type": "(event: MouseEvent): void | Promise<void>",
              "schema": []
            },
            "2": {
              "kind": "array",
              "type": "((event: MouseEvent) => void | Promise<void>)[]",
              "schema": [
                {
                  "kind": "event",
                  "type": "(event: MouseEvent): void | Promise<void>",
                  "schema": []
                }
              ]
            }
          }
        }
      },
      {
        "name": "size",
        "global": false,
        "description": "The size of the button",
        "tags": [],
        "required": false,
        "type": "\"sm\" | \"md\" | \"lg\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"sm\" | \"md\" | \"lg\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"sm\"",
            "2": "\"md\"",
            "3": "\"lg\""
          }
        }
      }
    ]

    const jsonSchema = propsToJsonSchema(propsWithFunctions as any)
    
    // Should only contain data properties, not function props
    expect(Object.keys(jsonSchema.properties || {})).toEqual(['color', 'size'])
    
    // Function prop should be filtered out
    expect(jsonSchema.properties?.onClick).toBeUndefined()
    
    // Data props should still be present
    expect(jsonSchema.properties?.color).toEqual({
      type: 'string',
      enum: ['error', 'primary', 'secondary'],
      description: 'The color of the button'
    })
    
    expect(jsonSchema.properties?.size).toEqual({
      type: 'string',
      enum: ['sm', 'md', 'lg'],
      description: 'The size of the button'
    })
  })

  test('should filter out various function patterns', () => {
    const functionProps = [
      {
        "name": "onClick",
        "type": "((event: MouseEvent) => void | Promise<void>) | undefined",
        "schema": {
          "kind": "enum",
          "schema": {
            "0": "undefined",
            "1": {
              "kind": "event",
              "type": "(event: MouseEvent): void | Promise<void>"
            }
          }
        }
      },
      {
        "name": "onSubmit",
        "type": "(event: SubmitEvent) => void",
        "schema": null
      },
      {
        "name": "onChange",
        "type": "((value: string) => void) | undefined",
        "schema": {
          "kind": "enum",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "data",
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      }
    ]

    const jsonSchema = propsToJsonSchema(functionProps as any)
    
    // Should only contain the data prop, not the function props
    expect(Object.keys(jsonSchema.properties || {})).toEqual(['data'])
    
    // Function props should be filtered out
    expect(jsonSchema.properties?.onClick).toBeUndefined()
    expect(jsonSchema.properties?.onSubmit).toBeUndefined()
    expect(jsonSchema.properties?.onChange).toBeUndefined()
    
    // Data prop should still be present
    expect(jsonSchema.properties?.data).toEqual({
      type: 'string'
    })
  })
})
