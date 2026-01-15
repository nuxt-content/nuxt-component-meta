import { describe, expect, test } from "vitest";
import { getComponentMeta } from "../src/parser";
import { propsToJsonSchema } from "../src/utils/schema";
import { jsonSchemaToZod } from "json-schema-to-zod";
import Ajv from "ajv";

const validData = {
  name: 'test-component',
  foo: 'bar',
  hello: 'world',
  booleanProp: true,
  numberProp: 42.5,
  data: {
    gello: 'test'
  },
  array: [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 }
  ],
  stringArray: ['apple', 'banana', 'cherry'],
  numberArray: [1, 2, 3, 4.5]
}

// Invalid test cases
const invalidTestCases = [
  {
    description: 'missing required name property',
    data: {
      foo: 'bar',
      hello: 'world'
    }
  },
  {
    description: 'wrong type for foo (should be string)',
    data: {
      name: 'test',
      foo: 123,
      hello: 'world'
    }
  },
  {
    description: 'wrong type for booleanProp',
    data: {
      name: 'test',
      booleanProp: 'not-a-boolean'
    }
  },
  {
    description: 'wrong type for numberProp',
    data: {
      name: 'test',
      numberProp: 'not-a-number'
    }
  },
  {
    description: 'invalid data object structure',
    data: {
      name: 'test',
      data: {
        wrongProperty: 'value'
      }
    }
  },
  {
    description: 'invalid array item structure',
    data: {
      name: 'test',
      array: [
        { name: 'John' } // missing required age property
      ]
    }
  },
  {
    description: 'wrong type in stringArray',
    data: {
      name: 'test',
      stringArray: [123, 'valid-string']
    }
  },
  {
    description: 'wrong type in numberArray',
    data: {
      name: 'test',
      numberArray: [1, 2, 'not-a-number']
    }
  }
]

describe('validation', () => {
  test('Zod', async () => {
    const meta = getComponentMeta('playground/app/components/TestComponent.vue')
    const jsonSchema = propsToJsonSchema(meta.props)
    const zodSchema = jsonSchemaToZod(jsonSchema, { module: "cjs" })
    const zod = eval(zodSchema)


    // Test valid data
    const isValid = zod.parse(validData)
    expect(isValid).toStrictEqual(validData)

    // Test each invalid case
    invalidTestCases.forEach(testCase => {
      expect(() => zod.parse(testCase.data)).toThrow()
    })
  })

  test('AJV', () => {
    const meta = getComponentMeta('playground/app/components/TestComponent.vue')
    const jsonSchema = propsToJsonSchema(meta.props)
    // Create AJV instance
    const ajv = new Ajv({ allErrors: true })
    const validate = ajv.compile(jsonSchema)

    // Test valid data
    const isValid = validate(validData)
    expect(isValid).toBe(true)
    expect(validate.errors).toBe(null)

    // Test each invalid case
    invalidTestCases.forEach(testCase => {
      const isValidInvalid = validate(testCase.data)
      expect(isValidInvalid).toBe(false)
      expect(validate.errors).not.toBe(null)
      expect(validate.errors!.length).toBeGreaterThan(0)
    })
  })
})
