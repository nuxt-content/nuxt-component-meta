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
    const meta = getComponentMeta("components/NormalScript.vue", {
      rootDir,
    })
    expect(meta.props.length).toEqual(4);
    expect((meta as unknown as Record<string, unknown>).cachedAt).toBeUndefined();
  });

  test("parse NormalScript fresh parse (cache enabled)", { timeout: 10000 }, () => {
    const meta = getComponentMeta("components/NormalScript.vue", {
      rootDir,
      cache: true
    })
    expect(meta.props.length).toEqual(4);
    expect((meta as unknown as Record<string, unknown>).cachedAt).toBeUndefined();
  });

  test("parse NormalScript cached", { timeout: 10000 }, () => {
    const meta = getComponentMeta("components/NormalScript.vue", {
      rootDir,
      cache: true
    })
    expect(meta.props.length).toEqual(4);
    expect((meta as unknown as Record<string, unknown>).cachedAt).toBeDefined();
  });

  test("parse ExtendMetaComponent with extendComponentMeta", { timeout: 10000 }, () => {
    const meta = getComponentMeta("components/ExtendMetaComponent.vue", {
      rootDir,
    })

    // Check basic component metadata from defineProps/defineEmits
    expect(meta.props.length).toEqual(2); // title, enabled
    expect(meta.props.find(p => p.name === 'title')).toBeDefined();
    expect(meta.props.find(p => p.name === 'enabled')).toBeDefined();
    expect(meta.events.length).toEqual(1);
    expect(meta.events[0].name).toEqual('updated');

    // Check that extendComponentMeta adds custom metadata fields
    const extendedMeta = meta as unknown as Record<string, unknown>;
    expect(extendedMeta.description).toEqual('A component that demonstrates extendComponentMeta functionality');
    expect(extendedMeta.version).toEqual('1.0.0');
    expect(extendedMeta.tags).toEqual(['test', 'meta']);
    expect(extendedMeta.customData).toEqual({
      for: 'Test Suite',
      category: 'utility'
    });
  });

  test("parse ExtendMetaComponent with extendComponentMeta (cached)", { timeout: 10000 }, () => {
    const meta = getComponentMeta("components/ExtendMetaComponent.vue", {
      rootDir,
      cache: true
    })

    // Check that extendComponentMeta custom fields persist through caching
    const extendedMeta = meta as unknown as Record<string, unknown>;
    expect(extendedMeta.description).toEqual('A component that demonstrates extendComponentMeta functionality');
    expect(extendedMeta.version).toEqual('1.0.0');
    expect(extendedMeta.tags).toEqual(['test', 'meta']);
    expect(extendedMeta.customData).toEqual({
      for: 'Test Suite',
      category: 'utility'
    });
    expect(extendedMeta.cachedAt).toBeUndefined();
  });

  test("parse ExtendMetaComponent cached retrieval", { timeout: 10000 }, () => {
    const meta = getComponentMeta("components/ExtendMetaComponent.vue", {
      rootDir,
      cache: true
    })

    // Check that extendComponentMeta custom fields are preserved in cached version
    const extendedMeta = meta as unknown as Record<string, unknown>;
    expect(extendedMeta.description).toEqual('A component that demonstrates extendComponentMeta functionality');
    expect(extendedMeta.cachedAt).toBeDefined();
  });
});
