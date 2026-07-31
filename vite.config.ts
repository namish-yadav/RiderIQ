import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js + postprocessing → vendor-three (used only by HyperSpeed)
          if (id.includes('node_modules/three') || id.includes('node_modules/postprocessing')) {
            return 'vendor-three';
          }
          // GSAP animation library
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          // OGL WebGL library (used by SpecularButton)
          if (id.includes('node_modules/ogl')) {
            return 'vendor-ogl';
          }
        },
      },
    },
  },
})
