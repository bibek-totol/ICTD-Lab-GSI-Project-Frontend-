import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      "@react-pdf-viewer/core",
      "@react-pdf-viewer/default-layout",
      "pdfjs-dist",
    ],
    exclude: ["pdfjs-dist/build/pdf.worker.min.js"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
