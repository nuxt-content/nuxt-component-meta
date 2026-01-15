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
});
