import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },

    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging (optional - disable for smaller builds)
    sourcemap: false,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },

  // Server configuration
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },

  // Preview server configuration
  preview: {
    port: 4173,
  },
})
