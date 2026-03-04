import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'inertia'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/inertia/**/*.spec.{ts,tsx}'],
    setupFiles: ['tests/inertia/setup.ts'],
  },
} as any)
