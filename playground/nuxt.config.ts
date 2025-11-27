import nuxtMetaModule from '../src/module'

export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  components: {
    dirs: [
      {
        path: '~/components/global',
        prefix: '',
        global: true
      },
      '~/components'
    ]
  },

  modules: [
    '@nuxt/content',
    '@nuxt/ui-pro',
    nuxtMetaModule as any
  ],

  componentMeta: {
    debug: 2,
    exclude: [/node_modules/i],
    overrides: {
      TestComponent: {
        props: {
          name: {
            name: 'name',
            type: 'number'
          }
        }
      }
    },
    metaSources: [
      {
        TestExternalMeta: {
          pascalName: 'TestExternalMeta',
          kebabName: 'test-external-meta',
          chunkName: 'components/test-external-meta',
          export: 'default',
          priority: 1,
          prefetch: false,
          preload: false,
          meta: {
            type: 0,
            props: [],
            slots: [],
            events: [],
            exposed: []
          }
        }
      }
    ]
  },

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  typescript: {
    includeWorkspace: true
  },

  compatibilityDate: '2025-04-23'
})