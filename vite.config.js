import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
  server: {
    port: 9000,
    headers: {
      // Remove COOP header to allow OAuth popup communication
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});
