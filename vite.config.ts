/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Local proxy avoids CORS friction while the API is on a bare IP.
      // cookieDomainRewrite makes Set-Cookie from the API usable on localhost
      // so refresh can work via httpOnly cookie when the body has no refreshToken.
      '/api': {
        target: process.env.VITE_API_BASE_URL ?? 'http://13.159.7.199:5001',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
