import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/formesflex/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "GesFlex Forms - Point Journaliere",
        short_name: "GesFlex",
        start_url: "/formesflex/",
        scope: "/formesflex/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0b63f6",
      },
    }),
  ],
});
