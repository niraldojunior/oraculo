import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const API_ROUTE_PREFIXES = [
  '/health',
  '/auth',
  '/teams',
  '/inventory-context',
  '/absences',
  '/allocations',
  '/azure',
  '/companies',
  '/contracts',
  '/departments',
  '/holidays',
  '/initiatives',
  '/skills',
  '/systems',
  '/vendors',
  '/vendors-context',
  '/collaborators',
  '/tasks'
]

// https://vite.dev/config/
export default defineConfig({
  root: 'web',
  plugins: [
    react(),
    VitePWA({
      // Atualização silenciosa: o worker novo fica em waiting (clientsClaim/
      // skipWaiting desligados) e só assume no próximo carregamento natural
      // da página, quando nenhuma aba do build antigo estiver mais ativa.
      // Isso evita que uma aba aberta durante o deploy peça chunks com hash
      // antigo depois que o precache já foi limpo. O registro é manual
      // (main.tsx) para podermos suprimir o reload automático que o plugin
      // faz por padrão — daí injectRegister continuar null.
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.png', 'pwa-icons/apple-touch-icon.png'],
      manifest: {
        name: 'Oráculo',
        short_name: 'Oráculo',
        description: 'Oráculo - Gestão de iniciativas, organização e capacidade',
        theme_color: '#0F1117',
        background_color: '#0F1117',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        clientsClaim: false,
        skipWaiting: false,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          ...API_ROUTE_PREFIXES.map(prefix => new RegExp(`^${prefix}(/|$)`))
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./web/src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
