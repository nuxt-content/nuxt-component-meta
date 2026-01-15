import { beforeAll, describe, expect, test } from "vitest";
import { getComponentMeta } from "../src/parser";
import { join } from "path";
import { rmSync } from "fs";

describe("get-component-meta", () => {
  const rootDir = join(__dirname, "./fixtures/basic")
  beforeAll(() => {
    try {
      rmSync(join(rootDir, '.data/nuxt-component-meta'), { recursive: true })
    } catch {
      // Ignore
    }
  })

  test("parse NormalScript fresh parse", { timeout: 10000 }, () => {
    const meta = getComponentMeta("app/components/NormalScript.vue", {
      rootDir,
    })
    expect(meta.props.length).toEqual(4);
    expect((meta as unknown as Record<string, unknown>).cachedAt).toBeUndefined();
  });

  test("parse NormalScript fresh parse (cache enabled)", { timeout: 10000 }, () => {
    const meta = getComponentMeta("app/components/NormalScript.vue", {
      rootDir,
      cache: true
    })
    expect(meta.props.length).toEqual(4);
    expect((meta as unknown as Record<string, unknown>).cachedAt).toBeUndefined();
  });

  test("parse NormalScript cached", { timeout: 10000 }, () => {
    const meta = getComponentMeta("app/components/NormalScript.vue", {
      rootDir,
      cache: true
    })
    expect(meta.props.length).toEqual(4);
    expect((meta as unknown as Record<string, unknown>).cachedAt).toBeDefined();
  });

  test("parse NormalScript with transformers (and cache)", { timeout: 10000 }, () => {
    const meta = getComponentMeta("app/components/NormalScript.vue", {
      rootDir,
      cache: true,
      transformers: [
        (component, code) => {
          // Rename a prop in the options API to ensure transformed code is used.
          return { component, code: code.replace('alt:', 'title:') }
        }
      ]
    })

    const propNames = meta.props.map(p => p.name)
    expect(propNames).toContain('title')
    expect(propNames).not.toContain('alt')

    // Second call should hit cache with the same transformer-generated hash
    const metaCached = getComponentMeta("app/components/NormalScript.vue", {
      rootDir,
      cache: true,
      transformers: [
        (component, code) => ({ component, code: code.replace('alt:', 'title:') })
      ]
    })
    expect((metaCached as unknown as Record<string, unknown>).cachedAt).toBeDefined();
  });
});
