import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),
    VitePWA({
      registerType:"autoUpdate",
      includeAssets:["favicon.io","public/icons/*.png"],
      manifest:{
        name:"TrainTrackr",
        description:"Manage your training sessions,schedule and clients",
        theme_color: "#111827",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the app shell — JS, CSS, HTML, fonts
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        runtimeCaching: [
          // Network-first for API calls — try live, fall back to cache offline
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/api/bookings") ||
              url.pathname.startsWith("/api/clients") ||
              url.pathname.startsWith("/api/trainers") ||
              url.pathname.startsWith("/api/head"),
            handler: "NetworkFirst",
            options: {
              cacheName: "traintrackr-api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache-first for uploaded workout plan PDFs / images
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/uploads"),
            handler: "CacheFirst",
            options: {
              cacheName: "traintrackr-uploads-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // allows testing the service worker in dev mode
      },
    }),
  ],
});
