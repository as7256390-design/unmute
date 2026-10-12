import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
// Public (publishable) backend values used as a fallback when the build environment lacks .env
const FALLBACK_SUPABASE_URL = "https://lgfewsifdmhodjdxojck.supabase.co";
const FALLBACK_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZmV3c2lmZG1ob2RqZHhvamNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjAzMjUsImV4cCI6MjA4MTMzNjMyNX0.6ggphTPpKbfAhXwonW0L10imigPLnPXjiiGJpLhuEeg";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_KEY),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(env.VITE_SUPABASE_PROJECT_ID || "lgfewsifdmhodjdxojck"),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Aprivox - Mental Wellness",
        short_name: "Aprivox",
        description: "Your safe space to be heard - Mental wellness support for students",
        theme_color: "#8b5cf6",
        background_color: "#0f0d1a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
