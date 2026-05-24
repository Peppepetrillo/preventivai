import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({

  plugins: [

    react(),

    VitePWA({

      registerType: "autoUpdate",

      includeAssets: [

        "favicon.svg",

        "robots.txt",

      ],

      manifest: {

        name: "PreventivAI",

        short_name:
          "PreventivAI",

        description:
          "Gestionale smart per elettricisti",

        theme_color:
          "#020617",

        background_color:
          "#020617",

        display: "standalone",

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

        ],

      },

    }),

  ],

});