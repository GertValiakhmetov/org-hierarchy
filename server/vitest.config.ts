import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The server imports TypeScript with explicit .ts extensions because Node
    // strips types at runtime; Vite has to resolve those the same way.
    include: ['src/**/*.test.ts'],
  },
  resolve: { extensions: ['.ts', '.js'] },
});
