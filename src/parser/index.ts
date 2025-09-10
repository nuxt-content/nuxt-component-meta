import { createCheckerByJson } from "vue-component-meta"
import type { ComponentMeta } from 'vue-component-meta'
import { refineMeta } from "./utils"
import { isAbsolute, join } from "pathe"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { withBase } from "ufo"
import { hash } from "crypto"
import { defu } from 'defu'

export interface Options {
  rootDir: string
  cache?: boolean
  cacheDir?: string
}

export function getComponentMeta(component: string, options?: Options): ComponentMeta {
  const rootDir = options?.rootDir ?? process.cwd()
  const opts = {
    cache: false,
    rootDir,
    cacheDir: join(rootDir, ".data/nuxt-component-meta"),
    ...options
  }
  const fullPath = isAbsolute(component) ? component : withBase(component, opts.rootDir)
  let cachePath = undefined
  if (opts.cache) {
    try {
      const content = readFileSync(fullPath, { encoding: 'utf8', flag: 'r' })
      const cacheId = component.split('/').pop()?.replace(/\./g, '_') + '--' + hash('sha1', content).slice(0, 12)
      cachePath = join(opts.cacheDir, `${cacheId}.json`)
    } catch (error) {
      throw new Error(`Error reading file ${fullPath}: ${error}`)
    }

    if (existsSync(cachePath)) {
      return JSON.parse(readFileSync(cachePath, { encoding: 'utf8', flag: 'r' })) as ComponentMeta
    }
  }

  const componentMeta = _getComponentMeta(fullPath, opts)

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
function _getComponentMeta(fullPath: string, opts: Options) {
  const checker = createCheckerByJson(
    opts.rootDir,
    {
      extends: `${opts.rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: [fullPath],
      exclude: []
    },
  )

  const baseMeta = refineMeta(
    checker.getComponentMeta(fullPath)
  )

  // Apply extendComponentMeta(...) overrides from the component source
  try {
    const code = readFileSync(fullPath, 'utf-8')
    const extendComponentMetaMatch = code.match(/extendComponentMeta\((\{[\s\S]*?\})\)/)
    const extendedComponentMeta = extendComponentMetaMatch?.length ? eval(`(${extendComponentMetaMatch[1]})`) : null
    return defu(baseMeta, extendedComponentMeta) as ComponentMeta
  } catch {
    return baseMeta
  }
}
