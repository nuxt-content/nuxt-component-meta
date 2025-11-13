import type { MetaCheckerOptions } from 'vue-component-meta'
import type { ComponentsDir, ComponentsOptions } from '@nuxt/schema'
import type { TransformersHookData, ExtendHookData, NuxtComponentMeta } from '.'

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
}

export interface ModuleHooks {
  'component-meta:transformers'(data: TransformersHookData): void
  'component-meta:extend'(data: ExtendHookData): void
  'component-meta:schema'(schema: NuxtComponentMeta): NuxtComponentMeta | Promise<NuxtComponentMeta>
}
