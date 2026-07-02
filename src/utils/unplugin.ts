import { createUnplugin } from 'unplugin'
import { useComponentMetaParser } from '../parser/meta-parser'
import type { ComponentMetaParser } from '../parser/meta-parser'
import type { ComponentMetaParserOptions } from '../types/parser'
import { stripMacroCalls } from '../parser/macro-extractor'

type ComponentMetaUnpluginOptions = { parser?: ComponentMetaParser, parserOptions: ComponentMetaParserOptions }

// @ts-ignore -- arguments types are not correct
export const metaPlugin = createUnplugin<ComponentMetaUnpluginOptions>(({ parser, parserOptions }) => {
    let instance = parser || useComponentMetaParser(parserOptions)
    let _configResolved: any

    const macroNames = (parserOptions.extendMetaFunctions || [{ name: 'extendComponentMeta' }]).map(f => f.name)

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      transformInclude (id: string) {
        return /\.(vue|ts|js|tsx|jsx)(\?|$)/.test(id)
      },
      transform (code: string, id: string) {
        if (!macroNames.some(name => code.includes(name))) return
        const filename = id.split('?')[0]!
        return stripMacroCalls(code, macroNames, filename)
      },
      async buildStart () {
        // avoid parsing meta twice in SSR
        if (_configResolved?.build.ssr) {
          return
        }

        instance?.fetchComponents()
        await instance?.updateOutput()
      },
      buildEnd () {
        if (!_configResolved?.env.DEV && _configResolved?.env.PROD) {
          instance?.dispose()
          // @ts-expect-error -- Remove instance from memory
          instance = null
        }
      },
      vite: {
        configResolved (config) {
          _configResolved = config
        },
        async handleHotUpdate ({ file }) {
          if (instance && Object.entries(instance.components).some(([, comp]: any) => comp.fullPath === file)) {
            instance.fetchComponent(file)
            await instance.updateOutput()
          }
        }
      }
    }
  })
