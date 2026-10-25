/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/three/") || id.includes("@react-three") || id.includes("react-reconciler") || id.includes("/scheduler/") && id.includes("three")) return "three";
          if (id.includes("genlayer-js") || id.includes("/viem/") || id.includes("/abitype/") || id.includes("@noble") || id.includes("@scure") || id.includes("/ox/")) return "genlayer";
          if (id.includes("react-router") || id.includes("@remix-run")) return "router";
          if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("/scheduler/")) return "react";
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
