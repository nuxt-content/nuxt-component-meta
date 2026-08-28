import { describe, test, expect } from 'vitest'
import { join } from 'pathe'
import { useComponentMetaParser } from '../src/parser/meta-parser'

const outputDir = join(import.meta.dirname, '.tmp/meta-parser-init')

describe('meta parser init', () => {
  test('should resolve extension-less component paths', async () => {
    const parser = useComponentMetaParser({
      outputDir,
      components: [
        {
          pascalName: 'BasicComponent',
          filePath: join(import.meta.dirname, 'fixtures/basic/app/components/BasicComponent'),
        },
      ],
    } as any)

    await parser.init()

    expect(parser.components.BasicComponent?.fullPath).toMatch(/BasicComponent\.vue$/)
  })

  test('should skip components whose path cannot be resolved', async () => {
    const parser = useComponentMetaParser({
      outputDir,
      components: [
        {
          pascalName: 'NuxtWelcome',
          filePath: join(import.meta.dirname, 'fixtures/does-not-exist/welcome'),
        },
      ],
    } as any)

    await expect(parser.init()).resolves.not.toThrow()
    expect(parser.components.NuxtWelcome).toBeUndefined()
  })

  test('should exclude components by name', async () => {
    const parser = useComponentMetaParser({
      outputDir,
      exclude: ['NuxtWelcome'],
      components: [
        {
          pascalName: 'NuxtWelcome',
          filePath: '/somewhere/else/welcome.vue',
        },
      ],
    } as any)

    await parser.init()

    expect(parser.components.NuxtWelcome).toBeUndefined()
  })
})
