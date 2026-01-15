import type { ComponentMeta } from 'vue-component-meta'
import { refineMeta } from "./utils"
import { tryResolveTypesDeclaration, createMetaChecker  } from "./checker"
import { defaultTransformers, type ComponentMetaTransformer } from './transformers'
import { isAbsolute, join } from "pathe"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { withBase } from "ufo"
import { hash } from "crypto"

export interface Options {
  rootDir: string
  cache?: boolean
  cacheDir?: string
  /**
   * Extra transformers to be run on top of component code before parsing.
   */
  transformers?: ComponentMetaTransformer[]
}

export function getComponentMeta(component: string, options?: Options): ComponentMeta {
  const rootDir = options?.rootDir ?? process.cwd()
  const opts = {
    cache: false,
    rootDir,
    cacheDir: join(rootDir, ".data/nuxt-component-meta"),
    ...options,
    transformers: [
      ...defaultTransformers,
      ...(options?.transformers || [])
    ]
  }
  const fullPath = isAbsolute(component) ? component : withBase(component, opts.rootDir)
  const resolvedPath = tryResolveTypesDeclaration(fullPath)
  const initialComponent = { fullPath, filePath: resolvedPath }

  // Read & optionally transform code before parsing (also used for cache key).
  let code: string
  let transformedComponent: any = initialComponent
  try {
    code = readFileSync(resolvedPath, { encoding: 'utf8', flag: 'r' })
  } catch (error) {
    throw new Error(`Error reading file ${resolvedPath}: ${error}`)
  }

  if (opts.transformers.length) {
    for (const transform of opts.transformers) {
      const res = transform(transformedComponent, code)
      transformedComponent = res?.component || transformedComponent
      code = res?.code || code
    }
  }

  let cachePath = undefined
  if (opts.cache) {
    const cacheId = component.split('/').pop()?.replace(/\./g, '_') + '--' + hash('sha1', code).slice(0, 12)
    cachePath = join(opts.cacheDir, `${cacheId}.json`)

    if (existsSync(cachePath)) {
      return JSON.parse(readFileSync(cachePath, { encoding: 'utf8', flag: 'r' })) as ComponentMeta
    }
  }

  const componentMeta = _getComponentMeta(resolvedPath, code, opts)

  if (cachePath) {
    const cache = JSON.stringify({ cachedAt: Date.now(), ...componentMeta })
    if (!existsSync(opts.cacheDir)) {
      mkdirSync(opts.cacheDir, { recursive: true })
    }
    writeFileSync(cachePath, cache, { encoding: 'utf8', flag: 'w' })
  }

  return componentMeta
}

/**
 * Create new checker and get component meta
 *
 * @param fullPath full path of the component
 * @param opts options
 * @returns component meta
 */
function _getComponentMeta(resolvedPath: string, code: string, opts: Options) {
  const checker = createMetaChecker(
    {
      rootDir: opts.rootDir,
      include: [resolvedPath]
    }
  )
  // Ensure the checker parses the in-memory version.
  checker.updateFile(resolvedPath, code)

  return refineMeta(
    checker.getComponentMeta(resolvedPath)
  )
}