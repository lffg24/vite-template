import { expect, test, type Page, type Route } from "@playwright/test";

const API_ORIGIN = "http://127.0.0.1:8000";

const psicoUser = {
  id: "psico-1",
  nombre: "Psicologa Demo",
  email: "psicologa.demo@abril360.com",
  empresa_id: "tenant-root",
  roles: ["PSICOLOGO_EVALUADOR"],
  permissions: ["psico.dashboard.view", "psico.aplicaciones.view", "psico.resultados.global.view"],
};

const assignedCompanies = {
  ok: true,
  total: 1,
  onboarding_required: false,
  empresas: [
    {
      empresa_id: "empresa-1",
      id: "empresa-1",
      nombre: "Empresa Andina SAS",
      nit: "900123456",
      estado: "Activa",
      rol_en_empresa: "PSICOLOGO_EVALUADOR",
      puede_ver_individuales: true,
      puede_cargar_respuestas: true,
      puede_crear_aplicaciones: true,
    },
  ],
};

const dashboardCompanies = {
  ok: true,
  items: [
    {
      id: "empresa-1",
      nombre: "Empresa Andina SAS",
      nit: "900123456",
      empleados: 42,
      aplicaciones: 3,
      evaluaciones_calculadas: 5,
    },
  ],
};

const applicationDetail = {
  ok: true,
  empresa: {
    id: "empresa-1",
    nombre: "Empresa Andina SAS",
    nit: "900123456",
  },
  aplicacion: {
    id: 77,
    nombre: "Bateria Planta Norte",
    estado: "EN_CAPTURA",
    fecha_aplicacion: "2026-06-10",
    participantes: 12,
  },
  instrumentos: [
    { evaluacion_id: 1001, instrument_code: "PSICO_INTRA_A", nombre: "Forma A", total_preguntas: 123 },
    { evaluacion_id: 1002, instrument_code: "PSICO_EXTRA", nombre: "Extralaboral", total_preguntas: 31 },
  ],
  resumen: {
    empleados_total: 42,
    participantes_registrados: 12,
    participantes_completos: 8,
    pendientes: 30,
    instrumentos_total: 2,
    creditos_consumidos: 7,
    creditos_estimados: 9,
    ficha_sociodemografica_requerida: true,
  },
  empleados: [
    {
      id: 501,
      cedula: "10101010",
      nombre: "Laura Gomez",
      cargo: "Analista SST",
      area: "Operaciones",
      email: "laura@example.com",
      registrado: true,
      completo: true,
      instrumentos_registrados: ["PSICO_INTRA_A", "PSICO_EXTRA"],
      instrumentos_pendientes: [],
      total_instrumentos: 2,
      completados: 2,
      avance_porcentaje: 100,
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

async function mockPsicologoSession(page: Page, options: { initiallyAuthenticated?: boolean } = {}) {
  let loginCompleted = Boolean(options.initiallyAuthenticated);

  await page.route(`${API_ORIGIN}/auth/me`, (route) =>
    loginCompleted ? fulfillJson(route, psicoUser) : fulfillJson(route, { detail: "No autenticado" }, 401),
  );
  await page.route(`${API_ORIGIN}/auth/login`, async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postData() || "").toContain("username=psicologa.demo%40abril360.com");
    loginCompleted = true;
    await fulfillJson(route, psicoUser);
  });
  await page.route(`${API_ORIGIN}/psicosocial/access/empresas`, (route) =>
    fulfillJson(route, assignedCompanies),
  );
}

test.describe("Flujos psicosociales críticos", () => {
  test("psicologa inicia sesion y ve el dashboard con datos del backend", async ({ page }) => {
    await mockPsicologoSession(page);
    await page.route(`${API_ORIGIN}/psicosocial/admin/empresas?todas=true`, (route) =>
      fulfillJson(route, dashboardCompanies),
    );

    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("psicologa.demo@abril360.com");
    await page.getByPlaceholder("Ingresa tu contraseña").fill("Correcta-123");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/\/psicosocial\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Dashboard psicosocial" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Empresa Andina SAS.*42.*3.*5/ })).toBeVisible();
  });

  test("detalle de aplicacion respeta empresa activa, participantes y creditos del contrato", async ({ page }) => {
    await mockPsicologoSession(page, { initiallyAuthenticated: true });

    let tenantHeader: string | undefined;
    await page.route(`${API_ORIGIN}/psicosocial/admin/empresas/empresa-1/aplicaciones/77`, (route) => {
      tenantHeader = route.request().headers()["x-empresa-id"];
      return fulfillJson(route, applicationDetail);
    });

    await page.goto("/psicosocial/empresas/empresa-1/aplicaciones/77");

    await expect(page.getByRole("heading", { name: "Bateria Planta Norte" })).toBeVisible();
    await expect(page.getByText("Empresa Andina SAS · Estado En captura")).toBeVisible();
    await expect(page.getByText("Laura Gomez")).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Créditos consumidos" }).getByText("7")).toBeVisible();
    await expect(page.getByText("Estimados: 9")).toBeVisible();
    expect(tenantHeader).toBe("empresa-1");
  });

  test("sesion vencida en una ruta protegida redirige al login con next seguro", async ({ page }) => {
    await mockPsicologoSession(page, { initiallyAuthenticated: true });
    await page.route(`${API_ORIGIN}/psicosocial/admin/empresas/empresa-1/aplicaciones/77`, (route) =>
      fulfillJson(route, { detail: "Sesion expirada" }, 401),
    );

    await page.goto("/psicosocial/empresas/empresa-1/aplicaciones/77");

    await expect(page).toHaveURL(/\/login\?next=%2Fpsicosocial%2Fempresas%2Fempresa-1%2Faplicaciones%2F77/, {
      timeout: 4_000,
    });
  });
});
