import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

// Use || not ?? — guards against BASE_PATH="" (empty string) which breaks Vite base config
const basePath = process.env.BASE_PATH || "/";

// Replit's port probe sends HTTP GET / and expects 200 (does NOT follow redirects).
// Registering middleware WITHOUT a return-wrapper runs BEFORE Vite's own middleware,
// intercepting "/" before Vite's base-path redirect (302) fires.
const healthPlugin = {
  name: "health-endpoint",
  configureServer(server: {
    middlewares: {
      use: (fn: (req: { url?: string }, res: { writeHead(code: number, h: Record<string, string>): void; end(s: string): void }, next: () => void) => void) => void;
    };
  }) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? "/";
      if (url === "/" || url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-cache" });
        res.end("OK");
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    healthPlugin,
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-popover",
            "@radix-ui/react-avatar",
            "@radix-ui/react-label",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-progress",
          ],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "class-variance-authority", "lucide-react"],
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: { clientPort: 443 },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/local": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local/, ""),
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
