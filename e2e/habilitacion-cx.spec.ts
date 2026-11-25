import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const empresa = "11111111-1111-4111-8111-111111111111";

async function preparar(page: Page) {
  await page.route("http://127.0.0.1:8000/**", async (route) => {
    const url = new URL(route.request().url());
    const modulo = url.searchParams.get("modulo") ?? "CAPACITACIONES";
    let body: unknown = {};
    let status = 200;

    if (url.pathname === "/auth/me") {
      body = { id: 1, nombre: "Administración REL", empresa_id: empresa, roles: ["SUPER_ADMIN"], permissions: [] };
    } else if (url.pathname === "/acceso/navegacion") {
      body = { destinos: ["/superadmin/habilitacion"] };
    } else if (url.pathname === "/superadmin/empresas") {
      body = { ok: true, items: [{ id: empresa, nombre: "Empresa de demostración", nit: "900123456" }], total: 1, page: 1, page_size: 10 };
    } else if (url.pathname === "/habilitacion/plataforma") {
      body = { modulo, banderas: modulo === "CX" ? [] : [{ clave: "capacitaciones.catalogo", nombre: "Catálogo", para_que: "Publicar cursos.", habilitado_global: false }] };
    } else if (url.pathname === `/habilitacion/empresas/${empresa}`) {
      body = {
        modulo, contratado: false, contratos: [],
        banderas: modulo === "CX"
          ? [{ clave: "cx.calificaciones.publico", nombre: "Calificación pública", para_que: "Permitir calificaciones desde el QR.", efectiva: false }]
          : [{ clave: "capacitaciones.participacion", nombre: "Acceso público", para_que: "Permitir participación.", efectiva: false }],
      };
    } else if (url.pathname === "/cx/admin/proteccion-publica") {
      body = { configurada: false };
    } else {
      status = 404;
      body = { detail: url.pathname };
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("habilitación CX conserva contexto y cabe en móvil y escritorio", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "La comprobación visual se ejecuta una vez en Chromium.");
  await preparar(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/superadmin/habilitacion");
  await expect(page.getByRole("heading", { name: "Habilitar módulos" })).toBeVisible();
  await page.getByRole("button", { name: /satisfacción del cliente/i }).click();
  await page.getByRole("button", { name: /empresa de demostración/i }).click();
  await expect(page.getByText("Protección pública configurada")).toBeVisible();
  await expect(page.getByText(/Los enlaces permanecen cerrados/)).toBeVisible();
  await mkdir("../outputs/playwright", { recursive: true });
  await page.screenshot({ path: "../outputs/playwright/habilitacion-cx-escritorio.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Habilitar módulos" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "../outputs/playwright/habilitacion-cx-movil.png", fullPage: true });
});
