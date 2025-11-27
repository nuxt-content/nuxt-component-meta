import { camelCase } from "scule"
import type { ComponentMeta } from 'vue-component-meta'
import type { ModuleOptions } from '../types/module'
import { existsSync } from "fs"

export function refineMeta(meta: ComponentMeta, fields: ModuleOptions['metaFields'] = { type: true, props: true, slots: true, events: true, exposed: true }, overrides: ModuleOptions['overrides'][string] = {}): ComponentMeta {
  const eventProps = new Set<string>(meta.events.map((event :any) => camelCase(`on_${event.name}`)))
  const props = (fields.props ? meta.props : [])
    .filter((prop: any) => !prop.global && !eventProps.has(prop.name as string))
    .sort((a: { type: string, required: boolean }, b: { type: string, required: boolean }) => {
      // sort required properties first
      if (!a.required && b.required) {
        return 1
      }
      if (a.required && !b.required) {
        return -1
      }
      // then ensure boolean properties are sorted last
      if (a.type === 'boolean' && b.type !== 'boolean') {
        return 1
      }
      if (a.type !== 'boolean' && b.type === 'boolean') {
        return -1
      }

      return 0
    })

  const refinedMeta = {
    type: meta.type,
    props: props.map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, true)),
    slots: (fields.slots ? meta.slots : []).map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, true)),
    exposed: (fields.exposed ? meta.exposed : []).map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, true)),
    events: (fields.events ? meta.events : []).map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, true)),
  }

  // Remove descriptional fileds to reduce chunk size
  removeFields(refinedMeta, ['declarations'])

  if (fields.slots === 'no-schema') {
    removeFields(refinedMeta.slots, ['schema'])
  }
  if (fields.events === 'no-schema') {
    removeFields(refinedMeta.events, ['schema'])
  }
  if (fields.exposed === 'no-schema') {
    removeFields(refinedMeta.exposed, ['schema'])
  }
  if (fields.props === 'no-schema') {
    removeFields(refinedMeta.props, ['schema'])
  }

  for (const meta in overrides) {
    const metaOverrides = overrides[meta as keyof typeof overrides]
    const metaFields = refinedMeta[meta as keyof ComponentMeta]
    if (Array.isArray(metaFields)) {
      for (const fieldName in metaOverrides) {
        const override = metaOverrides[fieldName]
        const index = metaFields.findIndex((field: any) => field.name === fieldName)
        if (index !== -1) {
          metaFields[index] = override
        }
      }
    }
  }
  return refinedMeta
}

function stripeTypeScriptInternalTypesSchema (type: any, topLevel: boolean = true): any {
  if (!type) {
    return type
  }

  if (!topLevel && type.declarations && type.declarations.find((d: any) => d.file.includes('node_modules/typescript') || d.file.includes('@vue/runtime-core'))) {
    return false
  }

  if (Array.isArray(type)) {
    return type.map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, false)).filter(r => r !== false)
  }

  if (Array.isArray(type.schema)) {
    return {
      ...type,
      declarations: undefined,
      schema: type.schema.map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, false)).filter((r: any) => r !== false)
    }
  }

  if (!type.schema || typeof type.schema !== 'object') {
    return typeof type === 'object' ? { ...type, declarations: undefined } : type
  }

  const schema: any = {}
  Object.keys(type.schema).forEach((sch) => {
    if (sch === 'schema' && type.schema[sch]) {
      schema[sch] = schema[sch] || {}
      Object.keys(type.schema[sch]).forEach((sch2) => {
        const res = stripeTypeScriptInternalTypesSchema(type.schema[sch][sch2], false)
        if (res !== false) {
          schema[sch][sch2] = res
        }
      })
      return
    }
    const res = stripeTypeScriptInternalTypesSchema(type.schema[sch], false)

    if (res !== false) {
      schema[sch] = res
    }
  })

  return {
    ...type,
    declarations: undefined,
    schema
  }
}

function removeFields(obj: Record<string, any>, fieldsToRemove: string[]): any {
  // Check if the obj is an object or array, otherwise return it as-is
  if (obj && typeof obj === 'object') {
    // Handle the object and its children recursively
    for (const key in obj) {
      // If the key is in fieldsToRemove, delete it
      if (fieldsToRemove.includes(key)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        // If the value is an object (or array), recurse into it
        removeFields(obj[key], fieldsToRemove);
      }
    }
  }
  return obj;
}

export function tryResolveTypesDeclaration(fullPath: string): string {
  // Check if the component is in node_modules and adjust configuration accordingly
  const isNodeModule = fullPath.includes('node_modules')
  
  // For node_modules components, try to find the TypeScript declaration file first
  let resolvedPath = fullPath
  if (isNodeModule && fullPath.endsWith('.vue')) {
    // Try different TypeScript declaration file patterns
    const patterns = [
      fullPath.replace('.vue', '.d.vue.ts'),
      fullPath.replace('.vue', '.vue.d.ts'),
      fullPath.replace('.vue', '.d.ts')
    ]
    
    for (const pattern of patterns) {
      if (existsSync(pattern)) {
        resolvedPath = pattern
        break
      }
    }
  }

  return resolvedPath
}