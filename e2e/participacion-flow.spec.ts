// e2e/participacion-flow.spec.ts
//
// El recorrido del participante, en un teléfono. Todo el archivo corre con el
// viewport móvil porque es el único que importa aquí: quien abre esto llegó por
// WhatsApp con un teléfono en la mano, y probarlo en 1280 px sería probar una
// pantalla que nadie usa.
//
// La API se simula con `page.route`, igual que las otras suites. Lo que se
// comprueba es que la interfaz llame lo correcto y reaccione a cada respuesta —
// incluidos el enlace muerto, la sesión ausente y el texto que cambió. Que el
// backend cumpla su lado ya lo cubre
// `backend/tests/integration/test_cap_participacion_local.py`.

import { expect, test, type Page, type Route } from "@playwright/test";

const API = "http://127.0.0.1:8000";
const TOKEN = "token-de-prueba-no-real";
const LECCION = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";

test.use({ viewport: { width: 390, height: 844 } });

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function aterrizaje() {
  return {
    curso: "Inducción en Seguridad y Salud en el Trabajo",
    empresa: "Transportes del Norte S.A.S.",
    numero_version: 1,
    lecciones: 1,
    duracion_estimada_min: 20,
    textos: [
      {
        clave: "autorizacion_datos_participante",
        texto_id: "11111111-1111-4111-8111-111111111111",
        version: 1,
        finalidad: "Autorizo el tratamiento de mis datos personales.",
        contenido: "Contenido completo de la autorización de datos.",
      },
      {
        clave: "declaracion_veracidad",
        texto_id: "22222222-2222-4222-8222-222222222222",
        version: 1,
        finalidad: "Declaro que soy quien dice el documento.",
        contenido: "Contenido completo de la declaración de veracidad.",
      },
    ],
  };
}

function curso(over: Record<string, unknown> = {}) {
  return {
    curso: "Inducción en Seguridad y Salud en el Trabajo",
    numero_version: 1,
    estado: "EN_CURSO",
    lecciones: [
      {
        leccion_id: LECCION,
        orden: 1,
        titulo: "Riesgos del puesto",
        tipo: "NATIVA",
        obligatoria: true,
        bloques_totales: 2,
        bloques_vistos: 0,
        completada: false,
        desbloqueada: true,
      },
    ],
    obligatorias_completas: 0,
    obligatorias_totales: 1,
    puede_finalizar: false,
    ...over,
  };
}

async function simular(page: Page) {
  await page.route(`${API}/c/${TOKEN}`, (r) => json(r, aterrizaje()));
}

test.describe("Participante · recorrido en el teléfono", () => {
  test("del enlace a la asistencia registrada", async ({ page }) => {
    // Vite compila en frío en la primera navegación de la suite.
    test.slow();
    await simular(page);

    let inscrito = false;
    let vistos = 0;

    await page.route(`${API}/c/${TOKEN}/inscribir`, async (route) => {
      inscrito = true;
      return json(
        route,
        {
          inscripcion_id: "33333333-3333-4333-8333-333333333333",
          estado: "EN_CURSO",
          nueva: true,
          secreto: "mi-codigo-de-continuacion",
        },
        201
      );
    });

    await page.route(`${API}/c/sesion/estado`, (route) => {
      if (!inscrito) return json(route, { detail: { motivo: "sesion_invalida", mensaje: "x" } }, 401);
      return json(
        route,
        curso({
          lecciones: [
            {
              ...curso().lecciones[0],
              bloques_vistos: vistos,
              completada: vistos >= 2,
            },
          ],
          obligatorias_completas: vistos >= 2 ? 1 : 0,
          puede_finalizar: vistos >= 2,
        })
      );
    });

    // El contenido de la leccion viene de su propio endpoint: el indice no
    // descarga el curso entero.
    await page.route(`${API}/c/sesion/leccion/${LECCION}`, (route) =>
      json(route, {
        leccion_id: LECCION,
        orden: 1,
        titulo: "Riesgos del puesto",
        tipo: "NATIVA",
        obligatoria: true,
        bloques: [
          { tipo: "texto", titulo: null, contenido: "Los riesgos mecánicos son…" },
          { tipo: "texto", titulo: null, contenido: "El reporte de incidentes…" },
        ],
        bloques_vistos: vistos,
        completada: vistos >= 2,
      })
    );

    await page.route(`${API}/c/sesion/progreso`, async (route) => {
      const cuerpo = route.request().postDataJSON() as { bloques_vistos: number };
      vistos = Math.max(vistos, cuerpo.bloques_vistos);
      return json(route, {
        leccion_id: LECCION,
        bloques_vistos: vistos,
        bloques_totales: 2,
        completada_en: vistos >= 2 ? "2026-09-06T12:00:00Z" : null,
      });
    });

    await page.route(`${API}/c/sesion/finalizar`, (route) =>
      json(route, {
        estado: "COMPLETADA",
        asistencia_id: "44444444-4444-4444-8444-444444444444",
        nueva: true,
      })
    );

    // --- D-01 · aterrizaje ---
    await page.goto(`/c/${TOKEN}`);
    // El nombre de SU empresa: es lo que hace creíble un enlace de WhatsApp.
    await expect(page.getByText("Transportes del Norte S.A.S.")).toBeVisible();
    // La duración, ANTES de empezar.
    await expect(page.getByText(/20 minutos aprox/i)).toBeVisible();
    await page.getByRole("button", { name: "Comenzar" }).click();

    // --- D-02 · identificación ---
    await page.getByLabel("Número *").fill("1018442907");
    await page.getByLabel("Nombres *").fill("María Fernanda");
    await page.getByLabel("Apellidos *").fill("Ospina Ruiz");

    // Sin marcar las dos autorizaciones no se pasa.
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByText(/marca las dos autorizaciones/i)).toBeVisible();

    await page.getByRole("checkbox").first().check();
    await page.getByRole("checkbox").nth(1).check();
    await page.getByRole("button", { name: "Ingresar" }).click();

    // --- el secreto, una sola vez ---
    await expect(page.getByText("Ya estás dentro")).toBeVisible();
    await expect(page.getByLabel(/código de continuación/i)).toHaveValue(
      "mi-codigo-de-continuacion"
    );
    await page.getByRole("button", { name: /empezar el curso/i }).click();

    // --- D-03 · el curso ---
    await expect(page.getByRole("heading", { name: /Inducción en Seguridad/ })).toBeVisible();
    await page.getByRole("link", { name: /Riesgos del puesto/ }).click();

    // --- D-06 · la lección, bloque a bloque ---
    await expect(page.getByText("Parte 1 de 2")).toBeVisible();
    // El texto real del bloque, no un marcador.
    await expect(page.getByText(/los riesgos mecánicos son/i)).toBeVisible();
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.getByText("Parte 2 de 2")).toBeVisible();
    await expect(page.getByText(/el reporte de incidentes/i)).toBeVisible();
    await page.getByRole("button", { name: /terminar la lección/i }).click();

    // --- D-08 · asistencia ---
    await page.getByRole("button", { name: /registrar mi asistencia/i }).click();
    await expect(page.getByText(/este registro queda como evidencia/i)).toBeVisible();
    await page.getByRole("button", { name: /^registrar asistencia$/i }).click();
    await expect(page.getByText(/tu asistencia quedó registrada/i)).toBeVisible();
  });

  test("D-99 · un enlace muerto no dice por qué, y no ofrece reintentar", async ({
    page,
  }) => {
    // Reintentar no arregla ninguno de los cuatro casos. Un botón que no puede
    // funcionar es una promesa falsa.
    await page.route(`${API}/c/${TOKEN}`, (route) =>
      json(route, { detail: { motivo: "enlace_no_disponible", mensaje: "no disponible" } }, 404)
    );

    await page.goto(`/c/${TOKEN}`);
    await expect(page.getByText(/este enlace no está disponible/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /reintentar/i })).toHaveCount(0);
    // Y no filtra la causa.
    await expect(page.getByText(/expir|cupo|revoc/i)).toHaveCount(0);
  });

  test("un fallo de red SÍ ofrece reintentar", async ({ page }) => {
    // La contraprueba de la anterior: el túnel del metro y un enlace revocado
    // son cosas distintas para quien está delante.
    // Falla mientras `caido` sea cierto, y no «solo el primer intento»: React en
    // desarrollo monta los efectos dos veces, asi que la segunda llamada
    // tendria exito y el fallo nunca llegaria a verse. La prueba comprobaria
    // entonces algo que no ocurrio.
    let caido = true;
    await page.route(`${API}/c/${TOKEN}`, async (route) => {
      if (caido) return route.abort("failed");
      return json(route, aterrizaje());
    });

    await page.goto(`/c/${TOKEN}`);
    await expect(page.getByText(/no pudimos conectarnos/i)).toBeVisible();

    caido = false;
    await page.getByRole("button", { name: /reintentar/i }).click();
    await expect(page.getByText("Transportes del Norte S.A.S.")).toBeVisible();
  });

  test("D-02b · sin sesión pide el código, nunca el documento", async ({ page }) => {
    await page.route(`${API}/c/sesion/estado`, (route) =>
      json(route, { detail: { motivo: "sesion_invalida", mensaje: "sin sesión" } }, 401)
    );

    await page.goto("/c/sesion");
    await expect(page.getByText(/¿estás en otro teléfono\?/i)).toBeVisible();
    await expect(page.getByLabel(/código de continuación/i)).toBeVisible();
    await expect(page.getByText(/el número de documento no basta/i)).toBeVisible();
    // No hay ningún campo de documento en esta pantalla.
    await expect(page.getByLabel(/documento/i)).toHaveCount(0);
  });

  test("una lección bloqueada no es enlace ni recibe foco", async ({ page }) => {
    // Un botón deshabilitado seguiría tabulándose y prometería algo que no
    // cumple.
    await page.route(`${API}/c/sesion/estado`, (route) =>
      json(
        route,
        curso({
          lecciones: [
            { ...curso().lecciones[0], completada: false },
            {
              leccion_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
              orden: 2,
              titulo: "Reporte de incidentes",
              tipo: "NATIVA",
              obligatoria: true,
              bloques_totales: 2,
              bloques_vistos: 0,
              completada: false,
              desbloqueada: false,
            },
          ],
          obligatorias_totales: 2,
        })
      )
    );

    await page.goto("/c/sesion");
    await expect(page.getByRole("link", { name: /Riesgos del puesto/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Reporte de incidentes/ })).toHaveCount(0);
    await expect(page.getByText(/termina la lección anterior/i)).toBeVisible();
  });

  test("el texto legal que cambió devuelve a la portada a releerlo", async ({ page }) => {
    // No se registra ninguna de las dos versiones: registrar la nueva fabricaría
    // un consentimiento sobre algo que nadie leyó.
    await simular(page);
    await page.route(`${API}/c/${TOKEN}/inscribir`, (route) =>
      json(
        route,
        {
          detail: {
            motivo: "texto_cambio",
            mensaje: "cambió",
            texto_vigente: { id: "nuevo", version: 2 },
          },
        },
        409
      )
    );

    await page.goto(`/c/${TOKEN}`);
    await page.getByRole("button", { name: "Comenzar" }).click();
    await page.getByLabel("Número *").fill("1");
    await page.getByLabel("Nombres *").fill("A");
    await page.getByLabel("Apellidos *").fill("B");
    await page.getByRole("checkbox").first().check();
    await page.getByRole("checkbox").nth(1).check();
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page.getByText(/se actualizó mientras lo leías/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Comenzar" })).toBeVisible();
  });
});
