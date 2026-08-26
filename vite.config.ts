import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Project page on GitHub Pages: https://gkpo.github.io/coding-bootcamp/
export default defineConfig({
  base: '/coding-bootcamp/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
