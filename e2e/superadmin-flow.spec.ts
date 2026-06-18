import { expect, test, type Page, type Route } from "@playwright/test";

const API_ORIGIN = "http://127.0.0.1:8000";

const superAdminUser = {
  id: "superadmin-1",
  nombre: "Super Admin Abril360",
  email: "superadmin@abril360.com",
  empresa_id: "platform",
  roles: ["SUPER_ADMIN"],
  permissions: [
    "superadmin.dashboard.view",
    "superadmin.psicologos.manage",
    "superadmin.creditos.manage",
  ],
};

const empresas = {
  ok: true,
  total: 2,
  page: 1,
  page_size: 100,
  items: [
    { id: "empresa-1", nombre: "Empresa Andina SAS", nit: "900123456" },
    { id: "empresa-2", nombre: "Clinica Norte", nit: "900654321" },
  ],
};

const psicologos = {
  ok: true,
  total: 2,
  page: 1,
  page_size: 10,
  items: [
    {
      id: 41,
      nombre: "Sofia Torres",
      email: "sofia.torres@abril360.com",
      empresas_asignadas: 1,
      empresas_nombres: "Empresa Andina SAS",
      identificacion_profesional: "1020304050",
      profesion: "Psicologa",
      tarjeta_profesional: "TP-2026",
      licencia_sst: "SST-999",
      creditos_asignados: 180,
      creditos_disponibles: 74,
    },
    {
      id: 42,
      nombre: "Daniel Ruiz",
      email: "daniel.ruiz@abril360.com",
      empresas_asignadas: 0,
      empresas_nombres: "",
      profesion: "Psicologo",
      creditos_asignados: 0,
      creditos_disponibles: 0,
    },
  ],
};

const creditAccounts = {
  ok: true,
  total: 1,
  page: 1,
  page_size: 10,
  items: [
    {
      id: 9001,
      psicologo_usuario_id: 41,
      psicologo_nombre: "Sofia Torres",
      psicologo_email: "sofia.torres@abril360.com",
      empresa_id: null,
      empresa_nombre: null,
      saldo_actual: 74,
      creditos_asignados: 180,
      estado: "ACTIVA",
      actualizado_en: "2026-06-17T15:00:00Z",
    },
  ],
};

const creditMovements = {
  ok: true,
  total: 1,
  page: 1,
  page_size: 8,
  items: [
    {
      id: 7001,
      account_id: 9001,
      tipo: "ASIGNACION",
      cantidad: 25,
      saldo_anterior: 49,
      saldo_nuevo: 74,
      descripcion: "Compra de creditos",
      creado_en: "2026-06-17T15:00:00Z",
    },
  ],
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockSuperAdminSession(page: Page) {
  await page.route(`${API_ORIGIN}/auth/me`, (route) => fulfillJson(route, superAdminUser));
}

async function mockSuperAdminCatalogs(
  page: Page,
  options: {
    psicologosRequests?: URL[];
    createPayloads?: unknown[];
    assignPayloads?: unknown[];
  } = {},
) {
  await page.route(`${API_ORIGIN}/superadmin/empresas**`, (route) => fulfillJson(route, empresas));

  await page.route(`${API_ORIGIN}/superadmin/psicologos**`, async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      options.createPayloads?.push(request.postDataJSON());
      await fulfillJson(route, { ok: true, item: { ...psicologos.items[0], id: 43 } }, 201);
      return;
    }

    options.psicologosRequests?.push(new URL(request.url()));
    await fulfillJson(route, psicologos);
  });

  await page.route(`${API_ORIGIN}/superadmin/creditos/cuentas**`, (route) => fulfillJson(route, creditAccounts));
  await page.route(`${API_ORIGIN}/superadmin/creditos/movimientos**`, (route) => fulfillJson(route, creditMovements));
  await page.route(`${API_ORIGIN}/superadmin/creditos/asignar`, async (route) => {
    options.assignPayloads?.push(route.request().postDataJSON());
    await fulfillJson(route, { ok: true, saldo_nuevo: 104 });
  });
}

test.describe("Flujos SuperAdmin criticos", () => {
  test("filtra psicologos y conserva el contrato de consulta con backend", async ({ page }) => {
    await mockSuperAdminSession(page);
    const psicologosRequests: URL[] = [];
    await mockSuperAdminCatalogs(page, { psicologosRequests });

    await page.goto("/superadmin/psicologos", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Psicólogos" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Sofia Torres.*Empresa Andina SAS.*180.*74/ })).toBeVisible();

    await page.getByPlaceholder("Buscar por nombre, correo, documento...").fill("sofia");
    await page.getByRole("combobox").filter({ hasText: "Todas las empresas" }).click();
    await page.getByRole("option", { name: "Con empresas" }).click();
    await page.getByRole("combobox").filter({ hasText: "Todos los créditos" }).click();
    await page.getByRole("option", { name: "Con saldo" }).click();

    await expect
      .poll(() => {
        const last = psicologosRequests.at(-1);
        return {
          q: last?.searchParams.get("q"),
          empresa_estado: last?.searchParams.get("empresa_estado"),
          credito_estado: last?.searchParams.get("credito_estado"),
          page_size: last?.searchParams.get("page_size"),
        };
      })
      .toEqual({
        q: "sofia",
        empresa_estado: "CON_EMPRESAS",
        credito_estado: "CON_SALDO",
        page_size: "10",
      });
  });

  test("crea psicologo solo cuando la validacion local y el payload profesional son correctos", async ({ page }) => {
    await mockSuperAdminSession(page);
    const createPayloads: unknown[] = [];
    await mockSuperAdminCatalogs(page, { createPayloads });

    await page.goto("/superadmin/psicologos", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Nuevo psicólogo" }).click();

    await page.getByLabel("Nombre completo *").fill("Laura Mendoza");
    await page.getByLabel("Correo de acceso *").fill("LAURA.MENDOZA@ABRIL360.COM");
    await page.locator('input[type="password"]').nth(0).fill("ClaveSegura!2026");
    await page.locator('input[type="password"]').nth(1).fill("OtraClave!2026");
    await page.getByLabel("Número de identificación profesional").fill("123456789");
    await page.getByLabel("Postgrado").fill("Especialista SST");
    await page.getByLabel("Tarjeta profesional").fill("TP-9876");
    await page.getByLabel("Nro. licencia SST").fill("LIC-456");
    await page.getByRole("button", { name: "Empresa Andina SAS" }).click();
    await page.getByRole("button", { name: "Puede validar informes" }).click();
    await page.getByRole("button", { name: "Crear psicólogo" }).click();

    await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
    expect(createPayloads).toHaveLength(0);

    await page.locator('input[type="password"]').nth(1).fill("ClaveSegura!2026");
    await page.getByRole("button", { name: "Crear psicólogo" }).click();

    await expect(page.getByText("Psicólogo creado")).toBeVisible();
    expect(createPayloads).toHaveLength(1);
    expect(createPayloads[0]).toMatchObject({
      nombre: "Laura Mendoza",
      email: "laura.mendoza@abril360.com",
      password: "ClaveSegura!2026",
      empresa_ids: ["empresa-1"],
      identificacion_profesional: "123456789",
      profesion: "Psicóloga",
      postgrado: "Especialista SST",
      tarjeta_profesional: "TP-9876",
      licencia_sst: "LIC-456",
      puede_validar_informes: true,
      puede_ver_individuales: true,
      puede_cargar_respuestas: true,
      puede_crear_aplicaciones: true,
    });
  });

  test("asigna creditos globales desde psicologos con idempotencia y sin empresa especifica", async ({ page }) => {
    await mockSuperAdminSession(page);
    const assignPayloads: unknown[] = [];
    await mockSuperAdminCatalogs(page, { assignPayloads });

    await page.goto("/superadmin/psicologos", { waitUntil: "domcontentloaded" });
    await page.getByRole("row", { name: /Sofia Torres/ }).getByRole("button", { name: "Cargar créditos" }).click();
    await page.getByLabel("Cantidad de créditos *").fill("0");
    await page.getByRole("button", { name: "Asignar créditos" }).click();

    await expect(page.getByRole("heading", { name: "Cargar créditos" })).toBeVisible();
    expect(assignPayloads).toHaveLength(0);

    await page.getByLabel("Cantidad de créditos *").fill("30");
    await page.getByLabel("Motivo de asignación").fill("Compra empresarial junio");
    await page.getByRole("button", { name: "Asignar créditos" }).click();

    await expect(page.getByText(/Sofia Torres quedó con 104 créditos disponibles/)).toBeVisible();
    expect(assignPayloads).toHaveLength(1);
    expect(assignPayloads[0]).toMatchObject({
      psicologo_usuario_id: 41,
      empresa_id: null,
      cantidad: 30,
      descripcion: "Compra empresarial junio",
    });
    expect((assignPayloads[0] as { idempotency_key?: string }).idempotency_key).toEqual(expect.any(String));
  });

  test("asigna creditos desde el ledger solo con psicologo seleccionado y cantidad valida", async ({ page }) => {
    await mockSuperAdminSession(page);
    const assignPayloads: unknown[] = [];
    await mockSuperAdminCatalogs(page, { assignPayloads });

    await page.goto("/superadmin/creditos", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Créditos" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Sofia Torres.*Cuenta global.*180.*74.*ACTIVA/ })).toBeVisible();
    await page.getByRole("button", { name: "Asignar créditos" }).first().click();
    await page.locator("form").getByRole("button", { name: "Asignar créditos" }).click();

    await expect(page.getByText("Selecciona un psicólogo")).toBeVisible();
    expect(assignPayloads).toHaveLength(0);

    await page.locator("form").getByRole("button", { name: /Sofia Torres/ }).click();
    await page.getByLabel("Cantidad de créditos").fill("25");
    await page.getByLabel("Motivo").fill("Renovacion paquete mensual");
    await page.locator("form").getByRole("button", { name: "Asignar créditos" }).click();

    await expect(page.getByText(/Sofia Torres quedó con 104 créditos disponibles/)).toBeVisible();
    expect(assignPayloads).toHaveLength(1);
    expect(assignPayloads[0]).toMatchObject({
      psicologo_usuario_id: 41,
      empresa_id: null,
      cantidad: 25,
      descripcion: "Renovacion paquete mensual",
    });
    expect((assignPayloads[0] as { idempotency_key?: string }).idempotency_key).toEqual(expect.any(String));
  });
});
