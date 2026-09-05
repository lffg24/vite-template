// e2e/capacitaciones-flow.spec.ts
//
// El recorrido administrativo completo de Capacitaciones, por el navegador:
// catálogo -> curso -> lecciones -> publicar -> asignar -> enlace.
//
// La API se simula con `page.route`, igual que en `psicosocial-flow.spec.ts`.
// Es lo correcto aquí y no una carencia: esta suite comprueba que la INTERFAZ
// hace las llamadas correctas y reacciona a cada respuesta —incluidos el 403,
// el 422 y el 409— y esos estados son costosos de provocar de verdad. Que el
// backend cumpla su lado ya lo cubre
// `backend/tests/integration/test_cap_api_recorrido_local.py`.

import { expect, test, type Page, type Route } from "@playwright/test";

const API_ORIGIN = "http://127.0.0.1:8000";
const CAP = `${API_ORIGIN}/capacitaciones`;

const usuario = {
  id: "u-1",
  nombre: "Coordinadora HSEQ",
  email: "hseq.demo@abril360.com",
  empresa_id: "empresa-1",
  roles: ["ADMIN_EMPRESA"],
  permissions: [
    "hseq.capacitacion.catalogo.editar",
    "hseq.capacitacion.catalogo.publicar",
    "hseq.capacitacion.asignar",
  ],
};

const estadoOperable = {
  contratado: true,
  vigencia_hasta: "2027-12-31",
  bandera_catalogo: true,
  bandera_asignacion: true,
  operable: true,
};

const CURSO_ID = "11111111-1111-4111-8111-111111111111";
const VERSION_ID = "22222222-2222-4222-8222-222222222222";
const ASIGNACION_ID = "33333333-3333-4333-8333-333333333333";
const ENLACE_ID = "44444444-4444-4444-8444-444444444444";

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function sesion(page: Page, permisos: string[] = usuario.permissions) {
  await page.route(`${API_ORIGIN}/auth/me`, (r) => json(r, { ...usuario, permissions: permisos }));
  await page.route(`${CAP}/modulo/estado`, (r) => json(r, estadoOperable));
}

function cursoBorrador(over: Record<string, unknown> = {}) {
  return {
    id: CURSO_ID,
    titulo: "Inducción en Seguridad y Salud en el Trabajo",
    categoria: "SST",
    categoria_restringida: false,
    estado: "BORRADOR",
    version_actual: 0,
    descripcion: null,
    objetivos: null,
    temario: null,
    intensidad_horaria_min: null,
    responsable_contenido: null,
    vigencia_meses: null,
    ...over,
  };
}

test.describe("Capacitaciones · recorrido administrativo", () => {
  test("del catálogo vacío al enlace generado", async ({ page }) => {
    // `test.slow()` porque es la PRIMERA navegación de la suite y paga la
    // compilación en frío de Vite del módulo entero. No es lentitud del
    // producto: las pruebas siguientes, con el servidor ya caliente, tardan
    // segundos. Subir el tiempo global escondería una lentitud real.
    test.slow();
    await sesion(page);

    // El servidor va cambiando de estado a medida que la interfaz opera, para
    // que la prueba recorra el flujo y no una sucesión de pantallas fijas.
    let publicado = false;
    let leccionesCreadas = 0;
    let asignado = false;

    await page.route(`${CAP}/cursos`, async (route) => {
      if (route.request().method() === "POST") {
        return json(route, { curso_id: CURSO_ID }, 201);
      }
      return json(route, [
        {
          id: CURSO_ID,
          titulo: cursoBorrador().titulo,
          categoria: "SST",
          categoria_restringida: false,
          estado: publicado ? "PUBLICADO" : "BORRADOR",
          version_actual: publicado ? 1 : 0,
          intensidad_horaria_min: 90,
          vigencia_meses: 12,
          lecciones: leccionesCreadas,
        },
      ]);
    });

    await page.route(`${CAP}/cursos/${CURSO_ID}`, async (route) => {
      if (route.request().method() === "PATCH") return route.fulfill({ status: 204, body: "" });
      const faltantes = leccionesCreadas === 0 ? ["al menos una lección"] : [];
      return json(route, {
        curso: cursoBorrador({
          estado: publicado ? "PUBLICADO" : "BORRADOR",
          version_actual: publicado ? 1 : 0,
          temario: "Riesgos del puesto",
          intensidad_horaria_min: 90,
          responsable_contenido: "REL Consilium",
          vigencia_meses: 12,
        }),
        lecciones: Array.from({ length: leccionesCreadas }, (_, i) => ({
          id: `l-${i + 1}`,
          orden: i + 1,
          tipo: "NATIVA",
          titulo: `Lección ${i + 1}`,
          bloques: [{ tipo: "texto", contenido: "Contenido" }],
          duracion_estimada_min: 20,
          obligatoria: true,
        })),
        faltantes,
      });
    });

    await page.route(`${CAP}/cursos/${CURSO_ID}/lecciones`, async (route) => {
      leccionesCreadas += 1;
      return json(route, { leccion_id: `l-${leccionesCreadas}`, orden: leccionesCreadas }, 201);
    });

    await page.route(`${CAP}/cursos/${CURSO_ID}/publicar`, async (route) => {
      publicado = true;
      return json(route, { version_id: VERSION_ID, numero: 1 }, 201);
    });

    await page.route(`${CAP}/versiones-asignables`, (route) =>
      json(route, [
        {
          curso_version_id: VERSION_ID,
          numero_version: 1,
          publicado_en: "2026-09-05T12:00:00Z",
          curso_id: CURSO_ID,
          curso_titulo: cursoBorrador().titulo,
          categoria: "SST",
          categoria_restringida: false,
          intensidad_horaria_min: 90,
          vigencia_meses: 12,
          ya_asignada: asignado,
        },
      ])
    );

    await page.route(`${CAP}/asignaciones`, async (route) => {
      if (route.request().method() === "POST") {
        asignado = true;
        return json(
          route,
          {
            asignacion_id: ASIGNACION_ID,
            curso_id: CURSO_ID,
            curso_version_id: VERSION_ID,
            numero_version: 1,
            vigencia_meses: 12,
          },
          201
        );
      }
      return json(
        route,
        asignado
          ? [
              {
                id: ASIGNACION_ID,
                curso_id: CURSO_ID,
                curso_titulo: cursoBorrador().titulo,
                curso_version_id: VERSION_ID,
                numero_version: 1,
                fecha_objetivo: null,
                vigencia_meses: 12,
                estado: "ACTIVA",
                enlaces_activos: 0,
                creado_en: "2026-09-05T12:00:00Z",
              },
            ]
          : []
      );
    });

    await page.route(`${CAP}/asignaciones/${ASIGNACION_ID}/enlaces`, async (route) => {
      if (route.request().method() === "POST") {
        return json(
          route,
          {
            enlace_id: ENLACE_ID,
            token: "token-de-prueba-no-real",
            expira_en: "2026-10-05T12:00:00Z",
            cupo_max: 25,
            curso: cursoBorrador().titulo,
          },
          201
        );
      }
      return json(route, []);
    });

    // --- 1 · catálogo: el borrador está y lleva a «Continuar» -----------------
    await page.goto("/capacitaciones/cursos");
    await expect(page.getByRole("heading", { name: "Catálogo de cursos" })).toBeVisible();
    await page.getByRole("button", { name: /continuar/i }).first().click();

    // --- 2 · A-05 sabe qué falta sin haber intentado publicar -----------------
    await expect(page.getByText("al menos una lección")).toBeVisible();
    await expect(page.getByRole("button", { name: /publicar versión 1/i })).toBeDisabled();

    // --- 3 · A-04 · agregar una lección ---------------------------------------
    await page.getByRole("button", { name: /agregar la primera/i }).click();
    // Las consultas van dentro del panel: «Título» existe tambien en el
    // formulario del curso que queda debajo, y una consulta global las mezcla.
    const panelLeccion = page.getByRole("dialog");
    await panelLeccion.getByLabel(/^título/i).fill("Riesgos del puesto");
    await panelLeccion.getByLabel(/^contenido$/i).fill("Los riesgos mecánicos son…");
    await panelLeccion.getByRole("button", { name: /^agregar lección$/i }).click();

    // --- 4 · A-05 · el checklist se vacía y el botón se habilita --------------
    await expect(page.getByText(/cumple todo lo que exige el validador/i)).toBeVisible();
    const publicar = page.getByRole("button", { name: /publicar versión 1/i });
    await expect(publicar).toBeEnabled();
    await publicar.click();

    // La confirmación dice qué se está congelando ANTES de congelarlo.
    await expect(page.getByText(/queda congelada e inmutable/i)).toBeVisible();
    await page.getByRole("button", { name: /^publicar$/i }).click();

    // --- 5 · A-11 · asignar la versión recién publicada ------------------------
    await page.goto("/capacitaciones/asignaciones");
    await expect(page.getByText(/todavía no se ha asignado/i)).toBeVisible();
    await page.getByRole("button", { name: /asignar el primero/i }).click();
    const panelAsignar = page.getByRole("dialog");
    await panelAsignar.getByLabel(/curso y versión/i).click();
    await page.getByRole("option", { name: /v1/ }).click();
    await panelAsignar.getByRole("button", { name: /^asignar curso$/i }).click();

    // --- 6 · A-12 · generar el enlace ------------------------------------------
    await expect(page.getByText(/sin acceso/i).first()).toBeVisible();
    await page.getByRole("button", { name: /enlaces/i }).first().click();
    await expect(page.getByText(/nadie puede entrar todavía/i)).toBeVisible();
    await page.getByRole("button", { name: /generar el primero/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^generar enlace$/i }).click();

    // El token aparece UNA vez, con el aviso de que no se recupera.
    await expect(page.getByRole("alert").first()).toContainText(/no se puede volver a ver/i);
    await expect(page.getByRole("alert").nth(1)).toContainText(/todavía no lo repartas/i);
    await expect(page.getByLabel(/enlace para compartir/i)).toHaveValue(
      /token-de-prueba-no-real/
    );
    await page.getByRole("button", { name: /ya lo copié/i }).click();
    await expect(page.getByLabel(/enlace para compartir/i)).toHaveCount(0);
  });

  test("un 403 lleva al estado del módulo, que separa las tres condiciones", async ({ page }) => {
    // El 403 cubre contrato, bandera y permiso. La pantalla que los distingue
    // es A-08: repetir «sin permiso» dejaría el diagnóstico por eliminación.
    await sesion(page);
    await page.route(`${CAP}/cursos`, (route) =>
      json(route, { detail: "La funcionalidad está deshabilitada." }, 403)
    );
    await page.route(`${CAP}/modulo/estado`, (route) =>
      json(route, {
        contratado: true,
        vigencia_hasta: "2027-12-31",
        bandera_catalogo: false,
        bandera_asignacion: null,
        operable: false,
      })
    );

    await page.goto("/capacitaciones/cursos");
    await page.getByRole("link", { name: /ver estado del módulo/i }).click();

    await expect(page.getByText("El módulo no está operativo")).toBeVisible();
    await expect(page.getByText("1 · Contrato del módulo").locator("..")).toContainText(
      "Cumple"
    );
    await expect(page.getByText("2 · Habilitación del catálogo").locator("..")).toContainText(
      "No cumple"
    );
    // «Sin declarar» y «apagada» bloquean igual pero se arreglan distinto: una
    // es configuración que falta, la otra una decisión que alguien tomó.
    await expect(
      page.getByText("3 · Habilitación de asignaciones").locator("..")
    ).toContainText("Sin declarar");
  });

  test("sin permiso de publicar, el módulo se abre pero A-05 lo explica", async ({ page }) => {
    await sesion(page, ["hseq.capacitacion.catalogo.editar"]);
    await page.route(`${CAP}/cursos/${CURSO_ID}`, (route) =>
      json(route, {
        curso: cursoBorrador({
          temario: "t",
          intensidad_horaria_min: 90,
          responsable_contenido: "REL",
        }),
        lecciones: [
          {
            id: "l-1",
            orden: 1,
            tipo: "NATIVA",
            titulo: "Lección 1",
            bloques: [{ tipo: "texto", contenido: "c" }],
            duracion_estimada_min: 20,
            obligatoria: true,
          },
        ],
        faltantes: [],
      })
    );

    await page.goto(`/capacitaciones/cursos/${CURSO_ID}`);

    // El curso está completo y aun así no se puede publicar: son dos bloqueos
    // distintos y la pantalla dice cuál es.
    await expect(page.getByText(/cumple todo lo que exige el validador/i)).toBeVisible();
    await expect(page.getByText(/permite redactar, pero no publicar/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /publicar versión 1/i })).toBeDisabled();
  });

  test("es operable con el teclado y el foco se ve", async ({ page }) => {
    await sesion(page);
    await page.route(`${CAP}/cursos`, (route) => json(route, []));

    await page.goto("/capacitaciones/cursos");
    await expect(page.getByText(/todavía no hay cursos/i)).toBeVisible();

    // El primer tabulador cae en el salto al contenido, no en un enlace de
    // navegación: es lo que evita tabular la cabecera en cada pantalla.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /saltar al contenido/i })).toBeFocused();
  });
});
