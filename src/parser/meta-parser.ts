import { performance } from 'perf_hooks'
import fs, { existsSync } from 'fs'
import { dirname, join, relative } from 'pathe'
import { logger } from '@nuxt/kit'
import { createCheckerByJson } from 'vue-component-meta'
import { resolvePathSync } from 'mlly'
import { hash } from 'ohash'
import type { ComponentMetaParserOptions, NuxtComponentMeta } from '../types/parser'
import { defu } from 'defu'
import { refineMeta } from './utils'

export function useComponentMetaParser (
  {
    outputDir = join(process.cwd(), '.component-meta/'),
    rootDir = process.cwd(),
    components: _components = [],
    componentDirs = [],
    checkerOptions,
    exclude = [],
    overrides = {},
    transformers = [],
    debug = false,
    metaFields,
    metaSources = {},
    beforeWrite
  }: ComponentMetaParserOptions
) {
  /**
   * Initialize component data object from components
   */
  let components: NuxtComponentMeta = { ...metaSources }
  const outputPath = join(outputDir, 'component-meta')

  const isExcluded = (component: any) => {
    return exclude.find((excludeRule) => {
      switch (typeof excludeRule) {
        case 'string':
          return component.filePath.includes(excludeRule)
        case 'object':
          return excludeRule instanceof RegExp ? excludeRule.test(component.filePath) : false
        case 'function':
          return excludeRule(component)
        default:
          return false
      }
    })
  }

  const getStringifiedComponents = () => {
    const _components = Object.keys(components).map((key) => ([
      key,
      {
        ...components[key],
        fullPath: undefined,
        shortPath: undefined,
        export: undefined
      }
    ]))
    return JSON.stringify(Object.fromEntries(_components), null, 2)
  }

  const getVirtualModuleContent = () => `export default ${getStringifiedComponents()}`

  let checker: ReturnType<typeof createCheckerByJson>
  const refreshChecker = () => {
    checker = createCheckerByJson(
      rootDir,
      {
        extends: `${rootDir}/tsconfig.json`,
        skipLibCheck: true,
        include: componentDirs.map((dir) => {
          const path = typeof dir === 'string' ? dir : (dir?.path || '')
          const ext = path.split('.').pop()!
          return ['vue', 'ts', 'tsx', 'js', 'jsx'].includes(ext) ? path : `${path}/**/*`
        }),
        exclude: []
      },
      checkerOptions
    )
  }

  const init = async () => {
    const meta = await import(outputPath + '.mjs').then((m) => m.default || m).catch(() => null)

    for (const component of _components || []) {
      // Locally support exclude as it seem broken from createCheckerByJson
      if (isExcluded(component)) { continue }
      if (!component.filePath || !component.pascalName) { continue }

      const filePath = resolvePathSync(component.filePath)

      components[component.pascalName] = {
        ...component,
        fullPath: filePath,
        filePath: relative(rootDir, filePath),
        meta: {
          type: 0,
          props: [],
          slots: [],
          events: [],
          exposed: []
        }
      }
    }

    if (meta) {
      Object.keys(meta).forEach((key) => {
        if (components[key]) {
          components[key].meta = meta[key].meta
        } else {
          components[key] = meta[key]
        }
      })
    }
  }

  /**
   * Write the output file.
   */
  const updateOutput = async (content?: string) => {
    const path = outputPath + '.mjs'

    // Call beforeWrite hook if provided
    if (beforeWrite && !content) {
      components = await beforeWrite(components)
    }

    if (!existsSync(dirname(path))) { fs.mkdirSync(dirname(path), { recursive: true }) }
    if (existsSync(path)) { fs.unlinkSync(path) }
    fs.writeFileSync(
      path,
      content || getVirtualModuleContent(),
      'utf-8'
    )
  }

  /**
   * Stub output file
   */
  const stubOutput = () => {
    if (existsSync(outputPath + '.mjs')) { return }
    updateOutput('export default {}')
  }

  /**
   * Fetch a component metas by its file name.
   */
  const fetchComponent = (component: string | any) => {
    const startTime = performance.now()
    try {
      if (typeof component === 'string') {
        if (components[component]) {
          component = components[component]
        } else {
          component = Object.entries(components).find(([, comp]: any) => (comp.fullPath === component))

          // No component found via string
          if (!component) { return }

          component = component[1]
        }
      }

      // Component is missing required values
      if (!component?.fullPath || !component?.pascalName) { return }

      if (component.meta.hash && component.fullPath.includes('/node_modules/')) {
        // We assume that components from node_modules don't change
        return
      }

      // Read component code
      let code = fs.readFileSync(component.fullPath, 'utf-8')
      const codeHash = hash(code)
      if (codeHash === component.meta.hash) {
        return
      }

      // Create the checker at the very last moment and silently fail if unavailable.
      if (!checker) {
        try {
          refreshChecker()
        } catch {
          return
        }
      }

      // Support transformers
      if (transformers && transformers.length > 0) {
        for (const transform of transformers) {
          const transformResult = transform(component, code)
          component = transformResult?.component || component
          code = transformResult?.code || code
        }


        // Ensure file is updated
        checker.updateFile(component.fullPath, code)
      }

      const meta = checker.getComponentMeta(component.fullPath)

      Object.assign(
        component.meta,
        refineMeta(meta, metaFields, overrides[component.pascalName] || {}),
        {
          hash: codeHash
        }
      )

      const extendComponentMetaMatch = code.match(/extendComponentMeta\((\{[\s\S]*?\})\)/);
      const extendedComponentMeta =  extendComponentMetaMatch?.length ? eval(`(${extendComponentMetaMatch[1]})`) : null
      component.meta = defu(component.meta, extendedComponentMeta)

      components[component.pascalName] = component
    } catch {
      if (debug) {
        logger.info(`Could not parse ${component?.pascalName || component?.filePath || 'a component'}!`)
      }
    }
    const endTime = performance.now()
    if (debug === 2) { logger.success(`${component?.pascalName || component?.filePath || 'a component'} metas parsed in ${(endTime - startTime).toFixed(2)}ms`) }

    return components[component.pascalName]
  }

  /**
   * Fetch all components metas
   */
  const fetchComponents = () => {
    const startTime = performance.now()
    for (const component of Object.values(components)) {
      fetchComponent(component)
    }
    const endTime = performance.now()
    if (!debug || debug === 2) { logger.success(`Components metas parsed in ${(endTime - startTime).toFixed(2)}ms`) }
  }

  return {
    get checker () { return checker },
    get components () { return components },
    dispose() {
      if (checker) {
        checker.clearCache()
      }
      // @ts-expect-error - Remove checker
      checker = null
      // Clear components cache
      components = {}
    },
    init,
    refreshChecker,
    stubOutput,
    outputPath,
    updateOutput,
    fetchComponent,
    fetchComponents,
    getStringifiedComponents,
    getVirtualModuleContent
  }
}

export type ComponentMetaParser = ReturnType<typeof useComponentMetaParser>
