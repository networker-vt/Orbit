import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/** GitHub Pages path. Do not change the default — `deploy:pages` depends on it. */
const PAGES_BASE = '/orbit/'

/**
 * Shell env only (not `.env`).
 * `CAPACITOR=1` or `VITE_BASE=/` → native shell.
 * Unset → Pages base.
 */
function resolveBase(): string {
  const fromEnv = process.env.VITE_BASE?.trim()
  if (fromEnv) {
    if (fromEnv === '/') return '/'
    const withLead = fromEnv.startsWith('/') ? fromEnv : `/${fromEnv}`
    return withLead.endsWith('/') ? withLead : `${withLead}/`
  }
  if (process.env.CAPACITOR === '1') return '/'
  return PAGES_BASE
}

const BASE = resolveBase()

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons/icon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-1024.png',
        'icons/apple-touch-icon.png',
        'icons/orbit-logo.png',
        'icons/orbit-wordmark.png',
        'icons/loadin-logo.png',
        'icons/loadin-wordmark.png',
        'icons/splash-750x1334.png',
        'icons/splash-1290x2796.png',
      ],
      manifest: {
        name: 'Allda',
        short_name: 'Allda',
        description: 'Allda — Marktplatz für alles.',
        start_url: BASE,
        scope: BASE,
        id: BASE,
        display: 'standalone',
        background_color: '#F7F6F3',
        theme_color: '#F7F6F3',
        lang: 'de',
        orientation: 'portrait-primary',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Orbit Marketplace',
          },
          {
            src: 'screenshots/narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Orbit mobil',
          },
        ],
      },
      workbox: {
        navigateFallback: `${BASE}index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'el-pages',
              networkTimeoutSeconds: 4,
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'el-assets' },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'el-images',
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
