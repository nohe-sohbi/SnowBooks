import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Vitest configuration kept separate from vite.config.ts so the app build
// stays free of test-only types and settings.
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
})
