import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // GitHub Pages repository path
  base: '/Code-Stem-Education_system/',

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    assetsDir: 'assets'
  },

  server: {
    port: 3000,
    open: true,
    host: true
  },

  preview: {
    port: 4173,
    host: true
  }
})