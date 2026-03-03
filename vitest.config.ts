import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/inertia/**/*.spec.{ts,tsx}'],
    setupFiles: ['tests/inertia/setup.ts'],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, 'inertia'),
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'inertia'),
    },
  },
})
