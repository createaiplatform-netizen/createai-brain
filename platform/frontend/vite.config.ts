import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ─── Vite config ──────────────────────────────────────────────────────────────
// Future: Add path aliases (@/ → src/).
// Future: Add environment-aware API proxy so /api/* routes hit the backend
//   in development without CORS issues.

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Proxy API calls to the backend in development.
    // Remove this in production — nginx handles routing there.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        rewrite: (path) => path.replace(/^\/api/, ""),
        changeOrigin: true,
      },
    },
  },
});
