import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to create 404.html for GitHub Pages
    {
      name: 'copy-index-to-404',
      closeBundle() {
        const indexHtmlPath = path.resolve(__dirname, 'dist', 'index.html');
        const fourOhFourPath = path.resolve(__dirname, 'dist', '404.html');
        if (fs.existsSync(indexHtmlPath)) {
          fs.copyFileSync(indexHtmlPath, fourOhFourPath);
          console.log('✅ Created 404.html from index.html for GitHub Pages');
        }
      },
    },
  ],
  
  // ✅ FIXED: Base path for GitHub Pages
  base: process.env.NODE_ENV === 'production' 
    ? '/Code-Stem-Education_system/' 
    : '/',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  },
  
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  preview: {
    port: 3000,
    open: true
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils',
      '@styles': '/src/styles',
      '@assets': '/src/assets'
    }
  }
});
