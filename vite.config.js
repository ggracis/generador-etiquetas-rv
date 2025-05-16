import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "url";

// https://vite.dev/config/
export default defineConfig({
  base: "/etiquetas/", // <-- NUEVO: base para producción
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
