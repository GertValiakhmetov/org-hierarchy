import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const SERVER_URL = process.env.VITE_API_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: [['babel-plugin-styled-components', { displayName: true, fileName: false }]] },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // ws: the live channel shares the /api prefix and needs upgrade forwarding.
    proxy: { '/api': { target: SERVER_URL, changeOrigin: true, ws: true } },
    fs: { allow: ['..'] },
  },
});
