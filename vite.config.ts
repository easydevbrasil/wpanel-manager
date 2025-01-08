import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  clearScreen: false,
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:8000",
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: false,
    ws: false,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    },
    cors: true,
    // disableHostCheck: true, // Property doesn't exist in Vite 5
  },
});
