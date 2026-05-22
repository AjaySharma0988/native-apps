import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "./renderer",
  base: "./",
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "renderer/index.html"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared-core/src"),
      "@": path.resolve(__dirname, "renderer/src"),
    },
  },
  define: {
    // Expose environment flag so renderer knows it's in Electron
    "import.meta.env.IS_ELECTRON": JSON.stringify(true),
  },
});
