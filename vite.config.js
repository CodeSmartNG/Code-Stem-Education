import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Base path for GitHub Pages
  base: process.env.NODE_ENV === 'production' 
    ? '/Code-Stem-Education/' 
    : '/',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['framer-motion', 'react-hot-toast', 'react-hook-form'],
          charts: ['recharts']
        }
      }
    },
    // Generate chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  
  server: {
    port: 3000,
    open: true,
    host: true,
    strictPort: false,
    // CORS for local development
    cors: true
  },
  
  preview: {
    port: 3000,
    open: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  },
  
  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  
  // CSS options
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      css: {
        // Additional CSS options
      }
    }
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils',
      '@styles': '/src/styles',
      '@assets': '/src/assets',
      '@firebase': '/src/firebase'
    }
  }
});
