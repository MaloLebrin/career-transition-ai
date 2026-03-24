import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^#shared\/(.+)$/,
        replacement: path.resolve(__dirname, 'shared/$1'),
      },
      {
        find: /^~\/(.*)$/,
        replacement: path.resolve(__dirname, 'inertia/$1'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/inertia/**/*.spec.{ts,tsx}'],
    setupFiles: ['tests/inertia/setup.ts'],
  },
} as any)
