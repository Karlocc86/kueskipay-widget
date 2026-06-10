import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Solo en Vitest: esbuild transforma los tests y necesita el runtime
  // automático de JSX para no requerir `import React`. En build manda oxc.
  esbuild: process.env.VITEST ? { jsx: 'automatic' } : undefined,
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
