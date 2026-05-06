import { fileURLToPath } from 'url'
import { test, describe, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('fixtures:basic', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    server: true
  })

  test('List components', async () => {
    const components = await $fetch('/api/component-meta')

    expect(Object.keys(components).length).greaterThan(0)

    Object.keys(components).forEach((name) => {
      expect(components[name]).ownProperty('pascalName')
      expect(components[name]).ownProperty('meta')
      expect(components[name].meta).ownProperty('props')
      expect(Array.isArray(components[name].meta.props)).toBeTruthy()
      expect(components[name].meta).ownProperty('slots')
      expect(Array.isArray(components[name].meta.slots)).toBeTruthy()
    })

    const testComponent = components.TestGlobalComponent

    expect(testComponent.meta.props).toMatchObject([{
      name: 'hello'
    }])
  })

  test('Single components', async () => {
    const component = await $fetch('/api/component-meta/test-global-component')

    expect(component).ownProperty('pascalName')
    expect(component).ownProperty('meta')
    expect(component.meta).ownProperty('props')
    expect(Array.isArray(component.meta.props)).toBeTruthy()
    expect(component.meta).ownProperty('slots')
    expect(Array.isArray(component.meta.slots)).toBeTruthy()

    expect(component.meta.props).toMatchObject([{
      name: 'hello'
    }])
  })

  test('Global component', async () => {
    const component = await $fetch('/api/component-meta/TestGlobalComponent')

    expect(component).ownProperty('pascalName')
    expect(component).ownProperty('meta')
    expect(component.meta).ownProperty('props')
    expect(Array.isArray(component.meta.props)).toBeTruthy()
    expect(component.meta).ownProperty('slots')
    expect(Array.isArray(component.meta.slots)).toBeTruthy()

    expect(component).toMatchObject({
      global: true
    })
  })

  test('Test component', async () => {
    const component = await $fetch('/api/component-meta/TestContent')

    expect(component).ownProperty('pascalName')
    expect(component).ownProperty('meta')
    expect(component.meta).ownProperty('props')
    expect(Array.isArray(component.meta.props)).toBeTruthy()
    expect(component.meta).ownProperty('slots')
    expect(Array.isArray(component.meta.slots)).toBeTruthy()
    expect(component).toMatchObject({
      global: true,
      pascalName: 'TestContent'
    })
    expect(component.meta.slots.length).toBe(2)
    expect(component.meta.slots[0].name).toBe('title')
    expect(component.meta.slots[1].name).toBe('default')
  })

  test('Test extendComponentMeta', async () => {
    const component = await $fetch('/api/component-meta/TestComponent')
    expect(component.meta).toMatchObject({ hello: 'world', foo: 'bar' })
  })

  test('Test extendProps with transform', async () => {
    const component = await $fetch('/api/component-meta/TestExtendProps')
    expect(component.meta._studio).toMatchObject({ filePath: 'file-picker' })
  })
})
