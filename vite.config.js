import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt", // shows update banner rather than silently updating
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "Accommodation.jpg", "CowMoo.mp3"],
      manifest: {
        name: "Switzerland Family Holiday 2026",
        short_name: "Switzerland 🇨🇭",
        description: "Family trip planner for Switzerland, August 2026",
        theme_color: "#c0152a",
        background_color: "#c0152a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Cache everything the app needs
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,mp3,woff2}"],
        // Cache external resources (Wikipedia images, tile maps)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/upload\.wikimedia\.org\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "wikipedia-images", expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "map-tiles", expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 } },
          },
        ],
      },
    }),
  ],
});
