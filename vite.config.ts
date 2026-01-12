import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".onrender.com", ".builderio.xyz"],
    headers: {
      "Content-Type": "text/css;charset=utf-8"  // 🔥 CSS MIME FIX
    },
    hmr: process.env.VITE_HMR_HOST
      ? {
          host: process.env.VITE_HMR_HOST,
          protocol: process.env.VITE_HMR_PROTOCOL || "wss",
          port: process.env.VITE_HMR_PORT ? parseInt(process.env.VITE_HMR_PORT) : 443,
        }
      : undefined,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    target: "esnext",
    assetsInlineLimit: 0,           // 🔥 Force CSS files
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",  // 🔥 Proper asset naming
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js"
      }
    }
  },
  plugins: [react(), mode === "production" ? null : componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  base: "/",
  preview: {                        // 🔥 Render preview fix
    port: 8080,
    host: "::"
  }
}));
