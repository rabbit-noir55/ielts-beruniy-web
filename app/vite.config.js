import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Ilova alohida build: saytga umuman ta'sir qilmaydi.
// Natija to'g'ridan-to'g'ri Android assets papkasiga tushadi.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../android/app/src/main/assets/scanner", import.meta.url)),
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
  },
});
