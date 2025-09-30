import { createCheckerByJson } from "vue-component-meta"
import type { ComponentMeta } from 'vue-component-meta'
import { refineMeta } from "./utils"
import { isAbsolute, join } from "pathe"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { withBase } from "ufo"
import { hash } from "crypto"

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
  
  const checker = createCheckerByJson(
    opts.rootDir,
    {
      extends: `${opts.rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: [resolvedPath],
      exclude: []
    }
  );
  return refineMeta(
    checker.getComponentMeta(resolvedPath)
  )
}