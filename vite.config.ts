import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: "/easy-csp",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    watch: {
      usePolling: true,
    },
    forwardConsole: {
      logLevels: ['log', 'error', 'warn', 'info'] // Ensure 'log' is included
    }
  },
  optimizeDeps: {
    include: ['@easy-csp/shared-types']
  }
})
