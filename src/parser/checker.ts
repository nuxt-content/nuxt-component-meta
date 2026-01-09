import { createCheckerByJson } from "vue-component-meta"
import type { MetaCheckerOptions } from 'vue-component-meta'
import { existsSync } from "fs"

export interface Options {
  rootDir: string
  cache?: boolean
  cacheDir?: string
  checkerOptions?: MetaCheckerOptions
  include?: string[]
}

export function createMetaChecker(opts: Options) {
  return createCheckerByJson(
    opts.rootDir,
    {
      extends: `${opts.rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: opts.include?.map((path) => {
        const ext = path.split('.').pop()!
        return ['vue', 'ts', 'tsx', 'js', 'jsx'].includes(ext)
          ? tryResolveTypesDeclaration(path)
          : `${path}/**/*`
      }),
      exclude: []
    },
    opts.checkerOptions || {
      forceUseTs: true,
      schema: true  // Enable schema expansion by default
    }
  )
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