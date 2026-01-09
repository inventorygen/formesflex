import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/NOM_REPO/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Point Journaliere",
        short_name: "PJ",
        start_url: "/NOM_REPO/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0b63f6",
      },
    }),
  ],
});
