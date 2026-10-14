import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: { sourcemap: false },
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.DEADSMILE_API_PROXY || "http://127.0.0.1:5000",
        changeOrigin: true,
        cookieDomainRewrite: "",
        ws: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    strictPort: true,
  },
});
