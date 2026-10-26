import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'screenshot-mobile.png',
          'screenshot-desktop.png',
        ],
        manifest: {
          id: '/',
          name: 'L7a4eg AI | لحاذگ',
          short_name: 'L7a4eg AI',
          description: 'مساعد ذكاء اصطناعي موريتاني شامل - محادثة ذكية، حسانية أصيلة، ترجمة فرنسية وعربية، قاموس مجتمعي، وصناعة محتوى محلي',
          theme_color: '#0284c7',
          background_color: '#FAF6EF',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          dir: 'rtl',
          lang: 'ar',
          categories: ['productivity', 'utilities', 'education', 'lifestyle'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          screenshots: [
            {
              src: '/screenshot-mobile.png',
              sizes: '750x1334',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'واجهة الهاتف الذكي - محادثة حسانية وترجمة ثلاثية فورية',
            },
            {
              src: '/screenshot-desktop.png',
              sizes: '1280x800',
              type: 'image/png',
              form_factor: 'wide',
              label: 'واجهة الحاسوب - سجل المحادثات والقاموس المجتمعي',
            },
          ],
          shortcuts: [
            {
              name: 'محادثة لحاذگ',
              short_name: 'محادثة',
              description: 'بدء محادثة ذكية فورية مع لحاذگ',
              url: '/?tab=chat',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'المستشار الحساني',
              short_name: 'حساني',
              description: 'شرح لسان البيظان والأمثال والتراث الموريتاني',
              url: '/?tab=hassani',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'ترجمة ثلاثية',
              short_name: 'ترجمة',
              description: 'ترجمة بين الحسانية والفصحى والفرنسية',
              url: '/?tab=translate',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'قاموس موريتانيا',
              short_name: 'القاموس',
              description: 'تصفح القاموس الشعبي والمصطلحات المحلية',
              url: '/?tab=dictionary',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/dictionary.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-dictionary-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
