import { readFileSync } from 'fs'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  tryResolveModule,
  addImportsDir,
  addTemplate
} from '@nuxt/kit'
import { join } from 'pathe'
import type { ComponentsDir, Component } from '@nuxt/schema'
import { metaPlugin } from './utils/unplugin'
import { useComponentMetaParser } from './parser/meta-parser'
import type { ComponentMetaParser } from './parser/meta-parser';
import { loadExternalSources } from './utils/loader'
import type { NuxtComponentMeta, ComponentMetaParserOptions, ModuleOptions } from './types/index'

export * from './types/module'
export type * from './types/index'

const slotReplacer = (_: unknown, _before: string, slotName: string, _rest: unknown) => `<slot ${_before || ''}${slotName === 'default' ? '' : `name="${slotName}"`}`

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-component-meta',
    configKey: 'componentMeta'
  },
  defaults: nuxt => ({
    outputDir: nuxt.options.buildDir,
    rootDir: nuxt.options.rootDir,
    componentDirs: [],
    components: [],
    metaSources: [],
    silent: true,
    exclude: [
      'nuxt/dist/app/components/welcome',
      'nuxt/dist/app/components/client-only',
      'nuxt/dist/app/components/dev-only',
      '@nuxtjs/mdc/dist/runtime/components/MDC',
      'nuxt/dist/app/components/nuxt-layout',
      'nuxt/dist/app/components/nuxt-error-boundary',
      'nuxt/dist/app/components/server-placeholder',
      'nuxt/dist/app/components/nuxt-loading-indicator',
      'nuxt/dist/app/components/nuxt-route-announcer',
      'nuxt/dist/app/components/nuxt-stubs',
      (component) => component.filePath.endsWith('.svg')
        // exclude d.vue.ts files, main vue files are already included and we don't need to include the d.vue.ts files
        || component.filePath.endsWith('.d.vue.ts')
    ],
    include: [],
    metaFields: {
      type: true,
      props: true,
      slots: true,
      events: true,
      exposed: true
    },
    transformers: [
      // @nuxt/content support
      (component, code) => {
        // MDCSlot
        if (code.includes('MDCSlot')) {
          code = code.replace(/<MDCSlot\s*([^>]*)?:use="\$slots\.([a-zA-Z0-9_]+)"/gm, slotReplacer)
          code = code.replace(/<MDCSlot\s*([^>]*)?name="([a-zA-Z0-9_]+)"/gm, slotReplacer)
          code = code.replace(/<\/MDCSlot>/gm, '</slot>')
        }
        // ContentSlot
        if (code.includes('ContentSlot')) {
          code = code.replace(/<ContentSlot\s*([^>]*)?:use="\$slots\.([a-zA-Z0-9_]+)"/gm, slotReplacer)
          code = code.replace(/<ContentSlot\s*([^>]*)?name="([a-zA-Z0-9_]+)"/gm, slotReplacer)
          code = code.replace(/<\/ContentSlot>/gm, '</slot>')
        }

        // Handle `(const|let|var) slots = useSlots()`
        const name = code.match(/(const|let|var) ([a-zA-Z][a-zA-Z-_0-9]*) = useSlots\(\)/)?.[2] || '$slots'
        const _slots = code.match(new RegExp(`${name}\\.[a-zA-Z]+`, 'gm'))
        if (_slots) {
          const slots = _slots
            .map(s => s.replace(name + '.', ''))
            .map(s => `<slot name="${s}" />`)
          code = code.replace(/<template>/, `<template>\n${slots.join('\n')}\n`)
        }

        // Handle `(const|let|var) { title, default: defaultSlot } = useSlots()`
        const slotNames = code.match(/(const|let|var) {([^}]+)}\s*=\s*useSlots\(\)/)?.[2]
        // \s*(([a-zA-Z][a-zA-Z-_0-9]*(\s*:\s*[a-zA-Z][a-zA-Z-_0-9]*)?\s*,?\s*)+)\s*
        if (slotNames) {
          const slots = slotNames
            .trim()
            .split(',')
            .map(s => s.trim().split(':')[0]?.trim())
            .map(s => `<slot name="${s}" />`)
          code = code.replace(/<template>/, `<template>\n${slots.join('\n')}\n`)
        }

        return { component, code }
      }
    ],
    checkerOptions: {
      forceUseTs: true,
      schema: {
        ignore: [
          'NuxtComponentMetaNames', // avoid loop
          'RouteLocationRaw', // vue router
          'RouteLocationPathRaw', // vue router
          'RouteLocationNamedRaw' // vue router
        ]
      }
    },
    globalsOnly: false
  }),
  async setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const isComponentIncluded = (component: any) => {
      if (!options?.globalsOnly) { return true }
      if (component.global) { return true }

      return (options.include || []).find((excludeRule) => {
        switch (typeof excludeRule) {
          case 'string':
            return component.pascalName === excludeRule || component.filePath.includes(excludeRule)
          case 'object':
            return excludeRule instanceof RegExp ? excludeRule.test(component.filePath) : false
          case 'function':
            return excludeRule(component)
          default:
            return false
        }
      })
    }

    // Retrieve transformers
    let transformers = options?.transformers || []
    transformers = await nuxt.callHook('component-meta:transformers' as any, transformers) || transformers

    let parser: ComponentMetaParser
    const parserOptions: ComponentMetaParserOptions = {
      ...options,
      components: [],
      metaSources: {},
      transformers,
      overrides: options.overrides || {},
      beforeWrite: async (schema: NuxtComponentMeta) => {
        return await nuxt.callHook('component-meta:schema' as any, schema) || schema
      }
    }

    // Resolve loaded components
    let componentDirs: (string | ComponentsDir)[] = [...(options?.componentDirs || [])]
    let components: Component[] = []
    let metaSources: NuxtComponentMeta = {}

    const uiTemplatesPath = await tryResolveModule('@nuxt/ui-templates', import.meta.url)
    nuxt.hook('components:dirs', (dirs) => {
      componentDirs = [
        ...componentDirs,
        ...dirs,
        { path: nuxt.options.appDir }
      ]
      if (uiTemplatesPath) {
        componentDirs.push({ path: uiTemplatesPath.replace('/index.mjs', '/templates') })
      }
      parserOptions.componentDirs = componentDirs
    })

    // Add global components path to handle components added with `addComponent` utility
    nuxt.hook('components:extend', (_components) => {
      _components.forEach((c) => {
        if (c.global) {
          parserOptions.componentDirs.push(c.filePath)
        }
      })
    })

    nuxt.hook('components:extend', async (_components) => {
      components = _components.filter(isComponentIncluded)

      // Load external components definitions
      metaSources = await loadExternalSources(options.metaSources)

      // Allow to extend parser options
      parserOptions.components = components
      parserOptions.metaSources = metaSources
      await nuxt.callHook('component-meta:extend' as any, parserOptions)

      // Create parser once all necessary contexts has been resolved
      parser = useComponentMetaParser(parserOptions)

      // Stub output in case it does not exist yet
      await Promise.all([
        parser.init(),
        parser.stubOutput(),
      ])
    })

    // Add useComponentMeta
    addImportsDir(resolver.resolve('./runtime/composables'))

    // addTemplate({
    //   filename: 'component-meta.mjs',
    //   getContents: () => 'export default {}',
    //   write: true
    // })

    addTemplate({
      filename: 'component-meta.d.ts',
      getContents: () => [
        "import type { ComponentData } from 'nuxt-component-meta'",
        `export type NuxtComponentMetaNames = ${
          [...components, ...Object.values(metaSources)].map(c => `'${c.pascalName}'`).join(' | ')
        }`,
        'export type NuxtComponentMeta = Record<NuxtComponentMetaNames, ComponentData>',
        'declare const components: NuxtComponentMeta',
        'export { components as default, components }'
      ].join('\n'),
      write: true
    })

    // Vite plugin
    nuxt.hook('vite:extend', (vite: any) => {
      vite.config.plugins = vite.config.plugins || []
      vite.config.plugins.push(metaPlugin.vite({ parser, parserOptions }))
    })

    // Inject output alias
    nuxt.options.alias = nuxt.options.alias || {}
    nuxt.options.alias['#nuxt-component-meta'] = join(nuxt.options.buildDir, 'component-meta.mjs')
    nuxt.options.alias['#nuxt-component-meta/types'] = join(nuxt.options.buildDir, 'component-meta.d.ts')

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({
        path: join(nuxt.options.buildDir, 'component-meta.d.ts')
      })
    })

    // Nitro setup
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}
      nitroConfig.virtual['#nuxt-component-meta/nitro'] = () => readFileSync(join(nuxt.options.buildDir, '/component-meta.mjs'), 'utf-8')
    })
    addServerHandler({
      method: 'get',
      route: '/api/component-meta',
      handler: resolver.resolve('./runtime/server/api/component-meta.get')
    })
    addServerHandler({
      method: 'get',
      route: '/api/component-meta.json',
      handler: resolver.resolve('./runtime/server/api/component-meta.json.get')
    })
    addServerHandler({
      method: 'get',
      route: '/api/component-meta/:component?',
      handler: resolver.resolve('./runtime/server/api/component-meta-component.get')
    })
  }
})
