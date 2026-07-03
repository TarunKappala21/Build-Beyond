// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = process.env.VITE_BACKEND_TARGET || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.js",
    globals: true,
    include: ["src/**/*.test.{js,jsx}"],
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api, /login, /signup, /session, etc. to backend
      "/login": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/signup": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/session": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/logout": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      // Or better: proxy ALL /api and auth routes
      "^/(api|login|signup|session|logout)/.*": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});