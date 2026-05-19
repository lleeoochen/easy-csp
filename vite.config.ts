import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: "/easy-csp",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
      },
      manifest: {
        name: 'Easy CSP',
        short_name: 'Easy CSP',
        description: 'Conscious Spending Plan',
        theme_color: '#2b91ba',
        background_color: '#2b91ba',
        display: 'standalone',
        scope: '/easy-csp/',
        start_url: '/easy-csp/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
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
