/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Fail the BUILD, not the browser, when a stale Supabase key is configured.
 *
 * Legacy JWT-based API keys were disabled on this project on 8 Aug 2026 following a
 * service_role key leak. A legacy key still builds and deploys cleanly, then fails at the
 * first request with "Legacy API keys are disabled" — a message that means nothing to a
 * student looking at the sign-in screen. That has already caused two production incidents,
 * both because the Vercel environment variable was stale while the local .env was correct.
 *
 * `src/lib/env.ts` also guards this, but only at runtime in the browser. This catches it
 * in CI and in the Vercel build, so a broken bundle is never published.
 */
function assertModernSupabaseKey(mode: string): Plugin {
  return {
    name: 'assert-modern-supabase-key',
    apply: 'build',
    configResolved(config) {
      const env = loadEnv(mode, config.root, 'VITE_');
      const key = env.VITE_SUPABASE_ANON_KEY;

      if (!key) {
        throw new Error(
          '\n\n  BUILD ABORTED: VITE_SUPABASE_ANON_KEY is not set.\n' +
            '  Set it to the publishable key (sb_publishable_...) from\n' +
            '  Supabase -> Settings -> API Keys.\n'
        );
      }

      if (key.startsWith('eyJ')) {
        throw new Error(
          '\n\n  BUILD ABORTED: VITE_SUPABASE_ANON_KEY holds a legacy JWT key.\n' +
            '  Legacy JWT API keys are DISABLED on this Supabase project, so this build\n' +
            '  would deploy and then fail at sign-in with "Legacy API keys are disabled".\n\n' +
            '  Fix: copy the publishable key (sb_publishable_...) from\n' +
            '       Supabase -> Settings -> API Keys -> "Publishable and secret API keys".\n\n' +
            '  If this fired during a Vercel build, the environment variable there is stale.\n' +
            '  Update it for Production, Preview AND Development, then redeploy with\n' +
            '  "Use existing Build Cache" UNCHECKED — Vite inlines env vars at build time,\n' +
            '  so a cached build silently reuses the old value.\n'
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    assertModernSupabaseKey(mode),
    react(),
    VitePWA({
      registerType: 'prompt', // Prompt user to reload on new service worker update
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'og-image.png',
      ],
      manifest: {
        name: 'KGP Bazaar',
        short_name: 'KGP Bazaar',
        description: 'Campus buy, sell and wanted board for IIT Kharagpur students',
        id: '/',
        start_url: '/',
        scope: '/',
        theme_color: '#FAF4E8',
        background_color: '#FAF4E8',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['shopping', 'social'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly', // NEVER cache Supabase API calls in Service Worker
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor';
          }
          if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/lucide-react/') || id.includes('node_modules/react-hook-form/') || id.includes('node_modules/@hookform/resolvers/') || id.includes('node_modules/zod/')) {
            return 'ui-vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/rls/**/*.{test,spec}.{ts,tsx}'],
    // The RLS suites all run against ONE shared live Supabase project and create, mutate
    // and tear down real rows. Running files in parallel lets one suite's teardown delete
    // another's fixtures mid-assertion, which surfaces as phantom failures that move
    // between runs. Correctness over speed: these must run one file at a time.
    fileParallelism: false,
  },
}));
