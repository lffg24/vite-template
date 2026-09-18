import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const permiso = "hseq.capacitacion.asignar";
const capacidades = [
  { clave: "hseq.capacitacion.catalogo.editar", nombre: "Editar catálogo", descripcion: "Crear cursos y preparar sus lecciones.", modulo: "CAPACITACIONES", superficie: "PLATAFORMA", configurable: false },
  { clave: "hseq.capacitacion.catalogo.publicar", nombre: "Publicar cursos", descripcion: "Congelar una versión del catálogo compartido.", modulo: "CAPACITACIONES", superficie: "PLATAFORMA", configurable: false },
  { clave: permiso, nombre: "Gestionar asignaciones", descripcion: "Asignar cursos y administrar enlaces de una empresa.", modulo: "CAPACITACIONES", superficie: "EMPRESA", configurable: true },
];
async function preparar(page: Page, conflicto = false) {
  const roles = [
    { id: 1, codigo: "SUPER_ADMIN", nombre: "Administrador de plataforma", version: null, permisos: capacidades.map(c => c.clave) },
    { id: 2, codigo: "IAM_FORMACION", nombre: "Coordinador de formación", version: 1, permisos: [permiso] },
    { id: 3, codigo: "ADMIN_EMPRESA", nombre: "Administrador de empresa", version: null, permisos: [] },
  ];
  let guardados = 0;
  await page.route("http://127.0.0.1:8000/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    let status = 200;
    if (path === "/auth/me") body = { id: 1, nombre: "Administración REL", empresa_id: "empresa-a", roles: ["SUPER_ADMIN"], permissions: [] };
    else if (path === "/acceso/navegacion") body = { destinos: ["/superadmin/roles-permisos"] };
    else if (path === "/acceso/catalogo") body = { version: 1, capacidades };
    else if (path === "/acceso/roles") body = { items: roles, hay_mas: false };
    else if (path === "/acceso/roles/vista-previa") {
      const datos = route.request().postDataJSON();
      body = { huella: "vista-validada", antes: null, despues: { ...datos, version: 1 }, afectados: [], agregados: datos.permisos, retirados: [] };
    } else if (path === "/acceso/roles/guardar") {
      guardados++;
      expect(route.request().postDataJSON().huella).toBe("vista-validada");
      if (conflicto) { status = 409; body = { detail: "El impacto cambió. Revisa una nueva vista previa antes de guardar." }; }
      else body = { id: 4, version: 1 };
    } else if (path === "/acceso/usuarios") body = { items: [{ id: 2, nombre: "Laura Martínez", email: "laura@ejemplo.test" }], hay_mas: false };
    else if (path === "/acceso/usuarios/2/empresas") body = { items: [{ id: "11111111-1111-4111-8111-111111111111", nombre: "Empresa de demostración" }] };
    else if (path === "/acceso/explicacion") body = { decisiones: capacidades.map(c => ({ ...c, permitido: c.configurable, motivo: c.configurable ? "AUTORIZADO" : "SIN_PERMISO_EN_ALCANCE" })), asignaciones: [], roles_globales: [], evaluado_en: "2026-09-07T15:00:00Z" };
    else if (path === "/acceso/historial") body = { items: [], hay_mas: false };
    else { status = 404; body = { detail: path }; }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return () => guardados;
}

test("rol protegido, preview y guardado explícito", async ({ page }) => {
  const guardados = await preparar(page);
  await page.goto("/superadmin/roles-permisos");
  await expect(page.getByRole("heading", { name: "Roles y permisos", exact: true })).toBeVisible();
  await page.getByText(/Roles protegidos del sistema/).click();
  await page.getByRole("button", { name: /Administrador de plataforma/ }).click();
  await expect(page.getByRole("button", { name: "Editar", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Crear rol", exact: true }).click();
  await page.getByLabel("Nombre del rol").fill("Responsable de formación");
  await page.getByRole("checkbox").check();
  expect(guardados()).toBe(0);
  await page.getByRole("button", { name: "Vista previa", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Revisa el impacto" })).toBeVisible();
  expect(guardados()).toBe(0);
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await expect(page.getByText("Rol creado", { exact: true })).toBeVisible();
  expect(guardados()).toBe(1);
});

test("conflicto conserva borrador y obliga a recalcular", async ({ page }) => {
  await preparar(page, true);
  await page.goto("/superadmin/roles-permisos");
  await page.getByRole("button", { name: "Crear rol", exact: true }).click();
  await page.getByLabel("Nombre del rol").fill("Formación regional");
  await page.getByRole("button", { name: "Vista previa", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar y guardar" }).click();
  await expect(page.getByRole("alert")).toContainText("El impacto cambió");
  await page.getByRole("button", { name: "Volver a editar" }).click();
  await expect(page.getByLabel("Nombre del rol")).toHaveValue("Formación regional");
});

test("diagnóstico, escritorio y móvil sin desbordamiento", async ({ page }, testInfo) => {
  await preparar(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/superadmin/roles-permisos");
  await expect(page.getByRole("region", { name: "Matriz de capacidades" })).toBeVisible();
  if (testInfo.project.name === "chromium") {
    await mkdir("../outputs/playwright", { recursive: true });
    await page.screenshot({ path: "../outputs/playwright/iam-escritorio.png", fullPage: true });
  }
  await page.getByRole("button", { name: "Personas y acceso" }).click();
  await page.getByRole("combobox", { name: "Persona", exact: true }).click();
  await page.getByRole("option", { name: /Laura Martínez/ }).click();
  await expect(page.getByRole("heading", { name: "Qué puede hacer esta persona", exact: true })).toBeVisible();
  await expect(page.getByText("Las condiciones de acceso se cumplen.")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Qué puede hacer esta persona", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLElement>("body *")]
    .filter(elemento => elemento.getBoundingClientRect().right > window.innerWidth + 1)
    .slice(0, 8)
    .map(elemento => ({ etiqueta: elemento.tagName, clase: elemento.className, texto: elemento.innerText?.slice(0, 60), derecha: elemento.getBoundingClientRect().right })))).toEqual([]);
  if (testInfo.project.name === "chromium") await page.screenshot({ path: "../outputs/playwright/iam-movil.png", fullPage: true });
});
