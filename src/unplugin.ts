import { createUnplugin } from 'unplugin'
import {  useComponentMetaParser  } from './parser'
import type {ComponentMetaParser, ComponentMetaParserOptions} from './parser';

type ComponentMetaUnpluginOptions = { parser?: ComponentMetaParser, parserOptions: ComponentMetaParserOptions }

// @ts-ignore -- arguments types are not correct
export const metaPlugin = createUnplugin<ComponentMetaUnpluginOptions>(({ parser, parserOptions }) => {
    let instance = parser || useComponentMetaParser(parserOptions)
    let _configResolved: any

    return {
      name: 'vite-plugin-nuxt-component-meta',
      enforce: 'post',
      buildStart () {
        // avoid parsing meta twice in SSR
        if (_configResolved?.build.ssr) {
          return
        }

        instance?.fetchComponents()
        instance?.updateOutput()
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
        handleHotUpdate ({ file }) {
          if (instance && Object.entries(instance.components).some(([, comp]: any) => comp.fullPath === file)) {
            instance.fetchComponent(file)
            instance.updateOutput()
          }
        }
      }
    }
  })
