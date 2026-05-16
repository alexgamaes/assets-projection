// Source: tailwind-css.colrlab.com/install-tailwind-css (v4 Vite plugin pattern)
// Source: vitejs.dev + @vitejs/plugin-react README
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Vitest config inline — replaces vitest.config.ts
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    environment: 'node', // model tests are framework-free (no DOM needed)
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/state/**'],
      exclude: ['src/**/__tests__/**'],
    },
  },
});
