import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Keep browser projects isolated; the suite shares one mocked API server.
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // El servidor de la suite.
  //
  // Los flags viven DENTRO del script `dev:e2e`, no se pasan aquí con `--`. En
  // Windows npm ejecuta el script a través de un shim de `cmd.exe` y ese paso de
  // argumentos es justo lo que se rompía: llegaban a npm y no a vite, así que el
  // servidor arrancaba en el puerto por defecto y Playwright esperaba en el 4173
  // hasta agotar el tiempo.
  //
  // `--strictPort`, dentro del script, cierra el otro modo de fallo: sin él vite
  // ve el 4173 ocupado —un proceso anterior que no se cerró del todo, cosa
  // frecuente en Windows— y salta al 4174 **en silencio**. La suite se quedaba
  // esperando en una dirección donde no había nadie, y el síntoma era un
  // «timeout» que no decía nada de la causa. Con `--strictPort` falla en el
  // acto y dice que el puerto está ocupado.
  webServer: {
    command: "npm run dev:e2e",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Para que un arranque fallido cuente lo que pasó en vez de morir mudo.
    stdout: "pipe",
    stderr: "pipe",
    env: {
      VITE_API_URL: "http://127.0.0.1:8000",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
