import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const projectRoot = process.cwd();

export default defineConfig({
  root: resolve(projectRoot, 'vercel'),
  publicDir: resolve(projectRoot, 'public'),
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: {
    alias: {
      '@': projectRoot,
    },
  },
  build: {
    outDir: resolve(projectRoot, '.vercel/output/static'),
    emptyOutDir: true,
  },
});
