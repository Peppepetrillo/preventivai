import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    restoreMocks: true,
    clearMocks: true,
    css: true,
  },

  plugins: [

    react(),

    VitePWA({

      registerType: "autoUpdate",

      // Registrazione SW manuale (salta Capacitor/native).
      injectRegister: false,

      includeAssets: [

        "favicon.svg",

        "robots.txt",

      ],

      manifest: {

        name: "PreventivAI",

        short_name:
          "PreventivAI",

        description:
          "Gestionale locale per preventivi da elettricista",

        lang: "it",

        theme_color:
          "#020617",

        background_color:
          "#020617",

        display: "standalone",

        display_override: [
          "standalone",
          "minimal-ui",
        ],

        orientation:
          "portrait",

        scope: "/",

        start_url: "/",

        icons: [

          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },

          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },

          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },

        ],

      },

    }),

  ],

});
