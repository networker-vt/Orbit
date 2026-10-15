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
      // Do not auto-precache every manifest icon (icon-1024 alone is ~145 KiB).
      includeManifestIcons: false,
      includeAssets: [
        'favicon.svg',
        'icons/icon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        name: 'Allda',
        short_name: 'Allda',
        description: 'Alles für deinen Alltag',
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
            label: 'Allda Marketplace',
          },
          {
            src: 'screenshots/narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Allda mobil',
          },
        ],
      },
      workbox: {
        navigateFallback: `${BASE}index.html`,
        // Home + core shell only — heavy tools (e-invoice, PDF, large icons) are runtime-cached.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        globIgnores: [
          // Heavy tool chunks stay runtime-cached (not in the 1.5 MB precache).
          '**/e-invoice-eu*.js',
          '**/einvoice-*.js',
          '**/pdf-lib*.js',
          // @cantoo/pdf-lib natural chunk name from Rolldown
          '**/es-*.js',
          '**/jszip*.js',
          '**/jszip.min*.js',
          '**/vendor-supabase-*.js',
          '**/lookup-*.js',
          '**/MatchPage-*.js',
          // AngebotPage + store + otplib are part of the offline shell (precache).
          '**/screenshots/**',
          '**/icons/splash-*.png',
          '**/icons/icon-1024.png',
          '**/icons/loadin-*.png',
          '**/icons/orbit-wordmark.png',
          '**/icons/orbit-logo.png',
          '**/WalletPage-*.js',
          '**/ParkmerkePage-*.js',
          '**/EinstellungPage-*.js',
          '**/CreateListingPage-*.js',
          '**/SocialPage-*.js',
          '**/TravelPage-*.js',
          '**/JobsPage-*.js',
          '**/BookingPage-*.js',
          '**/FirmaPage-*.js',
          '**/InterviewPage-*.js',
          '**/IntegrationenPage-*.js',
          '**/LookPage-*.js',
          '**/ProfilePage-*.js',
          '**/MeinPage-*.js',
          '**/KalenderPage-*.js',
          '**/EinkaufszettelPage-*.js',
          '**/TankenPage-*.js',
          '**/OutfitPage-*.js',
          '**/EmpfehlenPage-*.js',
          '**/IdeenPage-*.js',
          '**/PhotoJobsPage-*.js',
          '**/CompareOffersPage-*.js',
          '**/DashboardPage-*.js',
          '**/CampusPage-*.js',
          '**/KidsPage-*.js',
          '**/EntdeckerPage-*.js',
          '**/QuellenPage-*.js',
          '**/ErfahrungenPage-*.js',
          '**/ChannelsPage-*.js',
          '**/MarketplacePage-*.js',
          '**/ProjectPage-*.js',
          '**/TicketPage-*.js',
          '**/TravelCheckoutPage-*.js',
          '**/ListingCard-*.js',
          '**/ListingDetailPage-*.js',
          '**/ChannelLinks-*.js',
          '**/VerifyPanel-*.js',
          '**/occupations.catalog-*.js',
          '**/HonestRoutes-*.js',
          '**/Kids*Page-*.js',
          '**/MitentwickelnPage-*.js',
          '**/MessagesPage-*.js',
          '**/AuthPage-*.js',
          '**/PrefsPage-*.js',
          '**/EssenPage-*.js',
          '**/DatenschutzPage-*.js',
          '**/ImpressumPage-*.js',
          '**/AgbPage-*.js',
          '**/SupportPage-*.js',
          '**/RankingPage-*.js',
        ],
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
  build: {
    // Keep only heavy tool chunks off the entry modulepreload list (home first paint).
    // store / otplib / AngebotPage may preload; e-invoice + pdf-lib stay deferred.
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter(
          (dep) => !/einvoice|e-invoice|pdf-lib|jszip|\/es-/i.test(dep),
        )
      },
    },
    rollupOptions: {
      output: {
        /** One chunk per src/modules/<name> for the 50 KB gzip CI budget. */
        manualChunks(id) {
          const norm = id.replace(/\\/g, '/')
          const m = norm.match(/\/src\/modules\/([^/]+)\//)
          if (m) return `module-${m[1]}`
          // Keep seed phones out of the index chunk (exact +49 allowlist targets store-*.js).
          if (norm.includes('/src/data/seed') || norm.includes('/src/lib/store.ts')) return 'store'
          if (norm.includes('/node_modules/react-dom/') || norm.includes('/node_modules/react-router')) {
            return 'vendor-react'
          }
          if (norm.includes('/node_modules/react/') || norm.includes('/node_modules/scheduler/')) {
            return 'vendor-react'
          }
          if (norm.includes('/node_modules/@supabase/')) return 'vendor-supabase'
          if (norm.includes('/node_modules/otplib') || norm.includes('/node_modules/@otplib')) {
            return 'vendor-otplib'
          }
          // Do NOT force-name @e-invoice-eu / pdf-lib / jszip — manualChunks linkage
          // can statically pull them into store/index and break first paint.
        },
      },
    },
  },
})
