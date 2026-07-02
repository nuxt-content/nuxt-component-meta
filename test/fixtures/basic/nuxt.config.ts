import nuxtMetaModule from '../../../src/module'

export default defineNuxtConfig({
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
    nuxtMetaModule
  ],
  componentMeta: {
    extendMetaFunctions: [
      { name: 'extendComponentMeta' },
      { name: 'extendProps', transform: (extracted: Record<string, any>) => ({ _studio: extracted }) }
    ]
  }
})
