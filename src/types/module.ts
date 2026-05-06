import type { MetaCheckerOptions } from 'vue-component-meta'
import type { ComponentsDir, ComponentsOptions } from '@nuxt/schema'
import type { TransformersHookData, ExtendHookData, NuxtComponentMeta } from '.'
import type { JsonSchema } from './schema'

export interface ExtendMetaFunction {
  /** The function name to recognize as a compiler macro */
  name: string
  /**
   * Optional transform applied to the extracted object before merging into component.meta.
   * Use this to wrap the argument under a namespace key.
   *
   * @example
   * // extendProps({ filePath: 'file-picker' }) → { _studio: { filePath: 'file-picker' } }
   * transform: (extracted) => ({ _studio: extracted })
   */
  transform?: (extracted: Record<string, any>) => Record<string, any>
}

export interface ModuleOptions {
  /**
   * Directory where files metas are outputed upon parsing.
   *
   * It will create `component-meta.d.ts` and `component-meta.mjs` files.
   */
  outputDir?: string
  /**
   * Nuxt root directory.
   *
   * Should be auto-filled by the module/process.
   */
  rootDir?: string
  /**
   * Debug level: true, false or 2.
   *
   * 2 will log every timings for components parsing.
   */
  debug?: boolean | 2
  /**
   * Components directories pushed in the include list.
   */
  componentDirs: (string | ComponentsDir)[]
  /**
   * Components options pushed in include list.
   */
  components?: ComponentsOptions[]
  /**
   * Component paths and/or path regexps to be excluded.
   */
  exclude?: (string | RegExp | ((component: any) => boolean))[]
  /**
   * Component paths and/or path regexps to be included.
   */
  include?: (string | RegExp | ((component: any) => boolean))[]
  /**
   * vue-component-meta checker options.
   */
  checkerOptions?: MetaCheckerOptions
  /**
   * Extra transformers to be run on top of each component code.
   *
   * `component` will be the Nuxt component options for this component and `code` the code of the component.
   */
  transformers?: ((component: any, code: string) => ({ component: any; code: string }))[]
  /**
   * Filter all components that are not global.
   */
  globalsOnly?: boolean,
  overrides: {
    [componentName: string]: {
      props?: {
        [propName: string]: {
          "name": string,
          "global"?: boolean,
          "description"?: string,
          "tags"?: Array<{ "name": string, "text": string }>,
          "required"?: boolean,
          "type": string,
          "schema"?: JsonSchema,
          "default"?: string
        }
      }
      slots?: {
        [slotName: string]: any
      }
      events?: {
        [eventName: string]: any
      }
      exposed?: {
        [exposedName: string]: any
      }
    }
  }
  /**
   * Filter meta properties to be included in the output.
   */
  metaFields: {
    type: boolean,
    props: boolean | 'no-schema',
    slots: boolean | 'no-schema',
    events: boolean | 'no-schema',
    exposed: boolean | 'no-schema'
  },
  /**
   * Allow to load external components definitions.
   *
   * It can be a path to a file exporting a default object of components definitions or an object of components definitions.
   */
  metaSources?: (string | Partial<NuxtComponentMeta>)[]
  /**
   * Register compiler macro functions that inject custom metadata into components.
   * Each entry defines a function name and an optional transform hook applied to the extracted argument.
   *
   * Calls are stripped from browser output (no runtime cost) and extracted at build time via AST parsing.
   * Macro arguments must be static object literals — variable references are not supported.
   *
   * @default [{ name: 'extendComponentMeta' }]
   *
   * @example
   * extendMetaFunctions: [
   *   { name: 'extendComponentMeta' },
   *   { name: 'extendProps', transform: (extracted) => ({ _studio: extracted }) }
   * ]
   */
  extendMetaFunctions?: ExtendMetaFunction[]
}

export interface ModuleHooks {
  'component-meta:transformers'(data: TransformersHookData): void
  'component-meta:extend'(data: ExtendHookData): void
  'component-meta:schema'(schema: NuxtComponentMeta): NuxtComponentMeta | Promise<NuxtComponentMeta>
}
