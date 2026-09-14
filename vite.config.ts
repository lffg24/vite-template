import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: { outDir: "dist" },
  server: {
    host: "0.0.0.0",
    fs: { strict: false },
    // El puerto de la suite E2E llega por ENTORNO, no por la línea de comandos.
    //
    // En Windows npm ejecuta los scripts a través de un shim de `cmd.exe`, y el
    // paso de flags con `npm run dev -- --port N` se pierde: llegan a npm y no a
    // vite, así que el servidor arranca en el puerto por defecto y Playwright
    // espera en otro hasta agotar el tiempo. Una variable de entorno sí llega.
    port: process.env.E2E_PORT ? Number(process.env.E2E_PORT) : undefined,
  },
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
    setupFiles: "./src/test/setup.ts",
    globals: true,
    // Los 5 s por defecto no dan con la suite entera en marcha. Es arranque, no
    // espera: los mismos archivos pasan en 1-2 s por separado y se caen en
    // 5 000 ms exactos cuando compiten por la maquina —ya le paso a tres
    // distintos, ninguno relacionado con el otro—. Un rojo asi no dice nada del
    // codigo y ensena a volver a lanzar la suite hasta que pase, que es la peor
    // costumbre que puede coger un equipo.
    testTimeout: 20_000,
  },
});
