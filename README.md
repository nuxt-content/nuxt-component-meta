# Nuxt Component Meta

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Gather components metadata on build time and make them available on production. This module is developed to give a visual Markdown Editor with Vue Components in it for [Nuxt Studio](https://nuxt.studio).

## Quick Setup

1. Add `nuxt-component-meta` dependency to your project:

```bash
# Using PNPM
pnpm add nuxt-component-meta

# Using NPM
npm install nuxt-component-meta
```

2. Add `nuxt-component-meta` to the `modules` section of your `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['nuxt-component-meta']
})
```

## Usage

### In Nuxt Applications

```html
<template>
  <div>
    <h2>`MyComponent` metadata</h2>
    <pre>
      {{ meta }}
    </pre>
  </div>
</template>

<script script>
const { data: meta } = await useAsyncData('my-component', () => $fetch('/api/component-meta/my-component'))
</script>
```

### Standalone Usage with `getComponentMeta`

You can also use the `getComponentMeta` utility directly to extract component metadata programmatically:

```ts
import { getComponentMeta } from 'nuxt-component-meta/parser'

// Basic usage
const meta = getComponentMeta('components/MyComponent.vue')

// With options
const meta = getComponentMeta('components/MyComponent.vue', {
  rootDir: '/path/to/project',
  cache: true,
  cacheDir: '.component-meta-cache'
})

// Access component metadata
console.log(meta.props)    // Component props
console.log(meta.slots)    // Component slots  
console.log(meta.events)   // Component events
console.log(meta.exposed)  // Exposed properties
```

#### Options

- `rootDir` - Project root directory (defaults to `process.cwd()`)
- `cache` - Enable caching to improve performance (defaults to `false`)
- `cacheDir` - Directory for cache files (defaults to `.data/nuxt-component-meta`)

### Schema Generation with `propsToJsonSchema`

The `propsToJsonSchema` utility converts Vue component props metadata into JSON Schema format, enabling validation and type checking:

```ts
import { getComponentMeta } from 'nuxt-component-meta/parser'
import { propsToJsonSchema } from 'nuxt-component-meta/utils'

// Get component metadata
const meta = getComponentMeta('components/MyComponent.vue')

// Convert props to JSON Schema
const jsonSchema = propsToJsonSchema(meta.props)

console.log(jsonSchema)
// Output:
// {
//   "type": "object",
//   "properties": {
//     "title": { "type": "string", "description": "Component title" },
//     "count": { "type": "number", "default": 0 },
//     "enabled": { "type": "boolean", "default": true }
//   },
//   "required": ["title"]
// }
```

#### Integration with Validation Libraries

The generated JSON Schema can be used with popular validation libraries:

```ts
import { jsonSchemaToZod } from 'json-schema-to-zod'
import Ajv from 'ajv'

// With Zod
const zodString = jsonSchemaToZod(jsonSchema)
const zodSchema = eval(zodString)
const result = zodSchema.safeParse(componentProps)

// With AJV
const ajv = new Ajv()
const validate = ajv.compile(jsonSchema)
const isValid = validate(componentProps)
```

## Nightly Builds

This module uses [pkg.pr.new](https://pkg.pr.new) for continuous releases. Each commit to the main branch automatically publishes a new version with its own unique URL, allowing you to test the latest changes before they're officially released.

You can install a specific commit using its unique URL:

```bash
npm i https://pkg.pr.new/nuxt-content/nuxt-component-meta@<commit-hash>
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-component-meta/latest.svg?style=flat&colorA=002438&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-component-meta

[npm-downloads-src]: https://img.shields.io/npm/dt/nuxt-component-meta.svg?style=flat&colorA=002438&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-component-meta

## Development

1. Clone this repository
2. Install dependencies using `pnpm install`
3. Start dev server using `pnpm dev`

## License

[MIT License](https://github.com/nuxt-content/nuxt-component-meta/blob/main/LICENSE)

Copyright (c) NuxtLabs
