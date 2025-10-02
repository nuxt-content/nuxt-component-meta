import type { ComponentMeta, PropertyMetaSchema } from 'vue-component-meta'
import type { JsonSchema } from '../types/schema'

/**
 * Converts Vue component props metadata to JSON Schema format
 * @param props Array of Vue component prop metadata
 * @returns JSON Schema object
 */
export function propsToJsonSchema(props: ComponentMeta['props']): JsonSchema {
  const schema: JsonSchema = {
    type: 'object',
    properties: {},
    required: []
  }

  for (const prop of props) {
    const propSchema: any = {}

    // Add description (only if non-empty)
    if (prop.description) {
      propSchema.description = prop.description
    }

    // Convert Vue prop type to JSON Schema type
    const propType = convertVueTypeToJsonSchema(prop.type, prop.schema as any)
    // Ignore if the prop type is undefined
    if (!propType) {
      continue
    }

    Object.assign(propSchema, propType)

    // Add default value if available and not already present, only for primitive types or for object with '{}'
    if (prop.default !== undefined && propSchema.default === undefined) {
      propSchema.default = parseDefaultValue(prop.default)
    }
    
    // Also check for default values in tags
    if (propSchema.default === undefined && prop.tags) {
      const defaultValueTag = prop.tags.find(tag => tag.name === 'defaultValue')
      if (defaultValueTag) {
        propSchema.default = parseDefaultValue((defaultValueTag as unknown as { text: string }).text)
      }
    }

    // Add the property to the schema
    schema.properties![prop.name] = propSchema

    // Add to required array if the prop is required
    if (prop.required) {
      schema.required!.push(prop.name)
    }
  }

  // Remove required array if empty
  if (schema.required!.length === 0) {
    delete schema.required
  }

  return schema
}

function convertVueTypeToJsonSchema(vueType: string, vueSchema: PropertyMetaSchema): any {
  // Skip function/event props as they're not useful in JSON Schema
  if (isFunctionProp(vueType, vueSchema)) {
    return undefined
  }
  
  // Check for intersection types first (but only for simple cases, not union types)
  if (!vueType.includes('|') && vueType.includes(' & ')) {
    const intersectionSchema = convertIntersectionType(vueType)
    if (intersectionSchema) {
      return intersectionSchema
    }
  }
  
  // Check if this is an enum type
  if (isEnumType(vueType, vueSchema)) {
    return convertEnumToJsonSchema(vueType, vueSchema)
  }
  
  // Handle union types when schema is a string (e.g., "string | number | symbol")
  if (typeof vueSchema === 'string' && vueSchema.includes('|')) {
    return convertUnionTypeFromString(vueSchema)
  }
  
  // Unwrap enums for optionals/unions
  const { type: unwrappedType, schema: unwrappedSchema, enumValues } = unwrapEnumSchema(vueType, vueSchema)
  if (enumValues && unwrappedType === 'boolean') {
    return { type: 'boolean', enum: enumValues }
  }
  // Handle array with nested object schema FIRST to avoid union logic for array types
  if (unwrappedType.endsWith('[]')) {
    const itemType = unwrappedType.replace(/\[\]$/, '').trim()
    // If the schema is an object with kind: 'array' and schema is an array, use the first element as the item schema
    // Example: { kind: 'array', type: 'string[]', schema: [ 'string' ] }
    if (
      unwrappedSchema &&
      typeof unwrappedSchema === 'object' &&
      unwrappedSchema.kind === 'array' &&
      Array.isArray(unwrappedSchema.schema) &&
      unwrappedSchema.schema.length > 0
    ) {
      const itemSchema = unwrappedSchema.schema[0]
      return {
        type: 'array',
        items: convertVueTypeToJsonSchema(itemSchema.type || itemType, itemSchema)
      }
    }

    // If the schema is an object with only key '0', treat its value as the item type/schema
    // Example: { kind: 'array', type: 'string[]', schema: { '0': 'string' } }
    if (
      unwrappedSchema &&
      typeof unwrappedSchema === 'object' &&
      'schema' in unwrappedSchema &&
      (unwrappedSchema as any)['schema'] &&
      typeof (unwrappedSchema as any)['schema'] === 'object' &&
      !Array.isArray((unwrappedSchema as any)['schema']) &&
      Object.keys((unwrappedSchema as any)['schema']).length === 1 &&
      Object.keys((unwrappedSchema as any)['schema'])[0] === '0'
    ) {
      const itemSchema = (unwrappedSchema as any)['schema']['0']
      // If itemSchema is a string, treat as primitive
      if (typeof itemSchema === 'string') {
        return {
          type: 'array',
          items: convertSimpleType(itemSchema)
        }
      }
      // If itemSchema is an enum (for union types)
      if (itemSchema && typeof itemSchema === 'object' && itemSchema.kind === 'enum' && Array.isArray((itemSchema as any)['schema'])) {
        return {
          type: 'array',
          items: {
            type: (itemSchema as any)['schema'].map((t: any) => typeof t === 'string' ? t : t.type)
          }
        }
      }
      // Otherwise, recursively convert
      return {
        type: 'array',
        items: convertVueTypeToJsonSchema(itemType, itemSchema)
      }
    }
    // Fallback: treat as primitive
    return {
      type: 'array',
      items: convertSimpleType(itemType)
    }
  }

  // Handle object with nested schema
  if (
    unwrappedType.toLowerCase() === 'object' ||
    unwrappedType.match(/^{.*}$/) ||
    (unwrappedSchema && typeof unwrappedSchema === 'object' && unwrappedSchema.kind === 'object')
  ) {
    // Try to extract nested schema from various possible shapes
    let nested: Record<string, any> | undefined = undefined
    const vs: any = unwrappedSchema
    if (
      vs &&
      typeof vs === 'object' &&
      !Array.isArray(vs) &&
      Object.prototype.hasOwnProperty.call(vs, 'schema') &&
      vs['schema'] &&
      typeof vs['schema'] === 'object'
    ) {
      nested = vs['schema'] as Record<string, any>
    } else if (vs && typeof vs === 'object' && !Array.isArray(vs)) {
      nested = vs
    }
    if (nested) {
      const properties = convertNestedSchemaToJsonSchemaProperties(nested as Record<string, any>)
      // Collect required fields
      const required = Object.entries(nested)
        .filter(([_, v]) => v && typeof v === 'object' && v.required)
        .map(([k]) => k)
      const schemaObj: any = {
        type: 'object',
        properties,
        additionalProperties: false
      }
      if (required.length > 0) {
        schemaObj.required = required
      }
      return schemaObj
    }
    // Fallback to generic object
    return { type: 'object' }
  }
  // Handle simple types
  return convertSimpleType(unwrappedType)
}

function convertNestedSchemaToJsonSchemaProperties(nestedSchema: any): Record<string, any> {
  const properties: Record<string, any> = {}
  for (const key in nestedSchema) {
    const prop = nestedSchema[key]
    // Try to extract type and schema for each nested property
    let type = 'any', schema = undefined, description = '', def = undefined
    if (prop && typeof prop === 'object') {
      type = prop.type || 'any'
      schema = prop.schema || undefined
      description = prop.description || ''
      def = prop.default
    } else if (typeof prop === 'string') {
      type = prop
    }
    const converted = convertVueTypeToJsonSchema(type, schema)
    // Ignore if the converted type is undefined
    if (!converted) {
      continue
    }

    properties[key] = convertVueTypeToJsonSchema(type, schema)
    // Only add description if non-empty
    if (description) {
      properties[key].description = description
    }
    // Only add default if not the default value for the type, except for object with def = {}
    if (def !== undefined) {
      if (
        (type === 'object' && typeof def === 'object' && !Array.isArray(def) && Object.keys(def).length === 0) ||
        (!(type === 'string' && def === '') &&
        !(type === 'number' && def === 0) &&
        !(type === 'boolean' && def === false) &&
        !(type === 'array' && Array.isArray(def) && def.length === 0))
      ) {
        properties[key].default = def
      }
    }
  }
  return properties
}

function convertSimpleType(type: string): any {
  switch (type.toLowerCase()) {
    case 'string':
      return { type: 'string' }
    case 'number':
      return { type: 'number' }
    case 'boolean':
      return { type: 'boolean' }
    case 'symbol':
      return { type: 'string' } // JSON Schema doesn't have symbol type, map to string
    case 'object':
      return { type: 'object' }
    case 'array':
      return { type: 'array' }
    case 'null':
      return { type: 'null' }
    default:
      // For complex types, return object type as fallback
      if (type.includes('{}') || type.includes('Object')) {
        return { type: 'object' }
      }
      return {} // unknown types
  }
}

function parseDefaultValue(defaultValue: string): any {
  try {
    // Remove quotes if it's a string literal (both single and double quotes)
    if ((defaultValue.startsWith('"') && defaultValue.endsWith('"')) ||
        (defaultValue.startsWith("'") && defaultValue.endsWith("'"))) {
      return defaultValue.slice(1, -1)
    }

    // Handle boolean literals
    if (defaultValue === 'true') return true
    if (defaultValue === 'false') return false

    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(defaultValue)) {
      return parseFloat(defaultValue)
    }

    // Handle objects and arrays
    if (defaultValue.startsWith('{') || defaultValue.startsWith('[')) {
      return JSON.parse(defaultValue)
    }

    return defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Here are some examples of vueSchema:
 * 
 * ```
 * {
 *   kind: 'enum',
 *   type: 'string | undefined', // <-- vueType
 *   schema: { '0': 'undefined', '1': 'string' }
 * }
 * ```
 * ```
 * {
 *   kind: 'enum',
 *   type: '{ hello: string; } | undefined', // <-- vueType
 *   schema: {
 *     '0': 'undefined',
 *     '1': { kind: 'object', type: '{ hello: string; }', schema: [...] }
 *   }
 * }
 * ```
 * 
 * 
 */
function unwrapEnumSchema(vueType: string, vueSchema: PropertyMetaSchema): { type: string, schema: any, enumValues?: any[] } {
  // If schema is an enum with undefined, unwrap to the defined type
  if (
    typeof vueSchema === 'object' &&
    vueSchema?.kind === 'enum' &&
    vueSchema?.schema && typeof vueSchema?.schema === 'object'
  ) {
    // Collect all non-undefined values
    const values = Object.values(vueSchema.schema).filter(v => v !== 'undefined')
    // Special handling for boolean enums
    if (values.every(v => v === 'true' || v === 'false')) {
      // If both true and false, it's a boolean
      if (values.length === 2) {
        return { type: 'boolean', schema: undefined }
      } else if (values.length === 1) {
        // Only one value, still boolean but with enum
        return { type: 'boolean', schema: undefined, enumValues: [values[0] === 'true'] }
      }
    }
    // If only one non-undefined value, unwrap it
    if (values.length === 1) {
      const s = values[0]
      let t = vueType
      if (typeof s === 'object' && s.type) t = s.type
      else if (typeof s === 'string') t = s
      return { type: t, schema: s }
    }
    // Otherwise, fallback to first non-undefined
    for (const s of values) {
      if (s !== 'undefined') {
        let t = vueType
        if (typeof s === 'object' && s.type) t = s.type
        else if (typeof s === 'string') t = s
        return { type: t, schema: s }
      }
    }
  }

  return { type: vueType, schema: vueSchema }
}

/**
 * Check if a type is an enum (union of string literals or boolean values)
 */
function isEnumType(vueType: string, vueSchema: PropertyMetaSchema): boolean {
  // Check if it's a union type with string literals or boolean values
  if (typeof vueSchema === 'object' && vueSchema?.kind === 'enum') {
    const schema = vueSchema.schema
    if (schema && typeof schema === 'object') {
      const values = Object.values(schema)
      // Check if all non-undefined values are string literals
      const stringLiterals = values.filter(v => 
        v !== 'undefined' && 
        typeof v === 'string' && 
        v.startsWith('"') && 
        v.endsWith('"')
      )
      // Check if all non-undefined values are boolean literals
      const booleanLiterals = values.filter(v => 
        v !== 'undefined' && 
        (v === 'true' || v === 'false')
      )
      // Check if all non-undefined values are primitive types
      const primitiveTypes = values.filter(v => 
        v !== 'undefined' && 
        typeof v === 'string' && 
        ['string', 'number', 'boolean', 'symbol'].includes(v)
      )
      return stringLiterals.length > 0 || booleanLiterals.length > 0 || primitiveTypes.length > 0
    }
  }
  
  // Check if the type string contains string literals
  if (vueType.includes('"') && vueType.includes('|')) {
    return true
  }
  
  return false
}

/**
 * Convert enum type to JSON Schema
 */
function convertEnumToJsonSchema(vueType: string, vueSchema: PropertyMetaSchema): any {
  if (typeof vueSchema === 'object' && vueSchema?.kind === 'enum') {
    const schema = vueSchema.schema
    if (schema && typeof schema === 'object') {
      const enumValues: any[] = []
      const types = new Set<string>()
      
      // Extract enum values and types
      Object.values(schema).forEach(value => {
        if (value === 'undefined') {
          // Handle optional types
          return
        }
        
        if (typeof value === 'string') {
          if (value === 'true' || value === 'false') {
            enumValues.push(value === 'true')
            types.add('boolean')
          } else if (value.startsWith('"') && value.endsWith('"')) {
            enumValues.push(value.slice(1, -1)) // Remove quotes
            types.add('string')
          } else if (value === 'string') {
            types.add('string')
          } else if (value === 'number') {
            types.add('number')
          } else if (value === 'boolean') {
            types.add('boolean')
          } else if (value === 'symbol') {
            types.add('symbol') // Keep symbol as distinct type for now
          }
        } else if (typeof value === 'object' && value !== null) {
          // Complex type like (string & {}) - convert to allOf schema
          if (value.type) {
            const convertedType = convertIntersectionType(value.type)
            if (convertedType) {
              // For intersection types in enums, we need to handle them differently
              // We'll add a special marker to indicate this is an intersection type
              types.add('__intersection__')
            } else {
              types.add(value.type)
            }
          }
        }
      })
      
      // If we have enum values, create an enum schema
      if (enumValues.length > 0) {
        const result: any = { enum: enumValues }
        
        // Check if we have intersection types
        if (types.has('__intersection__')) {
          // For enums with intersection types, we need to create a more complex schema
          // Find the intersection type in the original schema
          const intersectionType = Object.values(schema).find(v => 
            typeof v === 'object' && v?.type && v.type.includes(' & ')
          )
          
          if (intersectionType) {
            const convertedIntersection = convertIntersectionType((intersectionType as unknown as { type: string }).type)
            if (convertedIntersection) {
              // Create an anyOf schema that combines the enum with the intersection type
              return {
                anyOf: [
                  { enum: enumValues },
                  convertedIntersection
                ]
              }
            }
          }
        }
        
        // Add type if it's consistent
        if (types.size === 1) {
          const type = Array.from(types)[0]
          result.type = type === 'symbol' ? 'string' : type
        } else if (types.size > 1) {
          const mappedTypes = Array.from(types).map(type => type === 'symbol' ? 'string' : type)
          // Remove duplicates after mapping
          const uniqueTypes = [...new Set(mappedTypes)]
          result.type = uniqueTypes.length === 1 ? uniqueTypes[0] : uniqueTypes
        }
        
        // Special case: if it's a boolean enum with just true/false, treat as regular boolean
        if (types.size === 1 && types.has('boolean') && enumValues.length === 2 && 
            enumValues.includes(true) && enumValues.includes(false)) {
          return { type: 'boolean' }
        }
        
        return result
      }
      
      // If no enum values but we have types, create a union type
      if (types.size > 1) {
        const mappedTypes = Array.from(types).map(type => type === 'symbol' ? 'string' : type)
        // Remove duplicates after mapping
        const uniqueTypes = [...new Set(mappedTypes)]
        return { type: uniqueTypes.length === 1 ? uniqueTypes[0] : uniqueTypes }
      } else if (types.size === 1) {
        const type = Array.from(types)[0]
        return { type: type === 'symbol' ? 'string' : type }
      }
    }
  }
  
  // Fallback: try to extract from type string
  if (vueType.includes('"') && vueType.includes('|')) {
    const enumValues: string[] = []
    const parts = vueType.split('|').map(p => p.trim())
    
    parts.forEach(part => {
      if (part.startsWith('"') && part.endsWith('"')) {
        enumValues.push(part.slice(1, -1))
      } else if (part === 'undefined') {
        // Skip undefined
      }
    })
    
    if (enumValues.length > 0) {
      return { type: 'string', enum: enumValues }
    }
  }
  
  // Final fallback
  return { type: 'string' }
}

/**
 * Check if a prop is a function/event prop that should be excluded from JSON Schema
 */
function isFunctionProp(type: string, schema: any): boolean {
  // Check if the type contains function signatures
  if (type && typeof type === 'string') {
    // Look for function patterns like (event: MouseEvent) => void
    if (type.includes('=>') || type.includes('(event:') || type.includes('void')) {
      return true
    }
  }

  // Check if the schema contains event handlers
  if (schema && typeof schema === 'object') {
    // Check for event kind in enum schemas
    if (schema.kind === 'enum' && schema.schema) {
      const values = Object.values(schema.schema) as Record<string, unknown>[]
      for (const value of values) {
        if (typeof value === 'object' && value?.kind === 'event') {
          return true
        }
        // Check nested arrays for event handlers
        if (typeof value === 'object' && value?.kind === 'array' && value.schema) {
          for (const item of value.schema as Record<string, unknown>[]) {
            if (typeof item === 'object' && item?.kind === 'event') {
              return true
            }
          }
        }
      }
    }
  }

  return false
}

/**
 * Convert TypeScript intersection types to JSON Schema allOf
 */
function convertIntersectionType(typeString: string): any | null {
  // Handle string & {} pattern
  if (typeString === 'string & {}') {
    return {
      allOf: [
        { type: 'string' },
        { type: 'object', additionalProperties: false }
      ]
    }
  }
  
  // Handle other intersection patterns
  if (typeString.includes(' & ')) {
    const parts = typeString.split(' & ').map(p => p.trim())
    const allOfSchemas = parts.map(part => {
      if (part === 'string') {
        return { type: 'string' }
      } else if (part === 'number') {
        return { type: 'number' }
      } else if (part === 'boolean') {
        return { type: 'boolean' }
      } else if (part === 'object') {
        return { type: 'object' }
      } else if (part === '{}') {
        return { type: 'object', additionalProperties: false }
      } else if (part === 'null') {
        return { type: 'null' }
      } else {
        // For other types, return as-is
        return { type: part }
      }
    })
    
    return {
      allOf: allOfSchemas
    }
  }
  
  return null
}

/**
 * Convert union type from string to JSON Schema
 */
function convertUnionTypeFromString(unionString: string): any {
  const types = unionString.split('|').map(t => t.trim())
  const jsonTypes = types.map(type => {
    if (type === 'symbol') {
      return 'string' // JSON Schema doesn't have symbol type, map to string
    }
    return type
  })
  
  // Remove duplicates
  const uniqueTypes = [...new Set(jsonTypes)]
  
  if (uniqueTypes.length === 1) {
    return { type: uniqueTypes[0] }
  } else {
    return { type: uniqueTypes }
  }
}