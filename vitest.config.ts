import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/core/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      exclude: ['src/core/__tests__/**'],
    },
  },
});
