import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.test.ts'],
    pool: 'threads',
    reporters: ['tree', ...[process.env.GITHUB_ACTIONS ? 'github-actions' : ''].filter(Boolean)],
  },
})
