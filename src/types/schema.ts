
export interface JsonSchema {
  type?: string | string[]
  properties?: Record<string, any>
  required?: string[]
  description?: string
  default?: any
  anyOf?: any[]
  allOf?: any[]
  enum?: any[]
  items?: any
  additionalProperties?: boolean
}