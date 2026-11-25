// Recorrido del participante en navegador. La API simulada verifica las
// peticiones de la interfaz; PostgreSQL real se comprueba en la suite backend.
import { expect, test, type Page } from "@playwright/test";

const API = "http://127.0.0.1:8000";
const TOKEN = "qa-enlace-participante";
const NATIVA = "11111111-1111-4111-8111-111111111111";
const EVALUACION = "22222222-2222-4222-8222-222222222222";

const textos = [
  {
    clave: "autorizacion_datos_participante",
    texto_id: "33333333-3333-4333-8333-333333333333",
    version: 1,
    finalidad: "Autorizo el tratamiento de mis datos para registrar la capacitación.",
    contenido: "Texto de prueba para la autorización de datos.",
  },
  {
    clave: "declaracion_veracidad",
    texto_id: "44444444-4444-4444-8444-444444444444",
    version: 1,
    finalidad: "Declaro que mis datos y participación son veraces.",
    contenido: "Texto de prueba para la declaración de veracidad.",
  },
];

function estado(nativaCompleta: boolean, evaluacionCompleta: boolean, finalizado: boolean) {
  return {
    curso: "Inducción SST de prueba",
    numero_version: 1,
    estado: finalizado ? "COMPLETADA" : "EN_CURSO",
    lecciones: [
      {
        leccion_id: NATIVA, orden: 1, titulo: "Riesgos del puesto", tipo: "NATIVA",
        obligatoria: true, bloques_totales: 1, bloques_vistos: nativaCompleta ? 1 : 0,
        completada: nativaCompleta, desbloqueada: true,
      },
      {
        leccion_id: EVALUACION, orden: 2, titulo: "Comprueba lo aprendido",
        tipo: "EVALUACION", obligatoria: true, bloques_totales: 0, bloques_vistos: 0,
        completada: evaluacionCompleta, desbloqueada: nativaCompleta,
      },
    ],
    obligatorias_completas: Number(nativaCompleta) + Number(evaluacionCompleta),
    obligatorias_totales: 2,
    puede_finalizar: evaluacionCompleta,
  };
}

async function simularRecorrido(page: Page) {
  let inscrita = false;
  let nativaCompleta = false;
  let evaluacionCompleta = false;
  let finalizado = false;
  const peticiones: { inscripcion?: unknown; intento?: unknown; cierres: number } = { cierres: 0 };

  await page.route(`${API}/c/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: {
        "access-control-allow-origin": "http://127.0.0.1:4173",
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      } });
      return;
    }

    let body: unknown;
    if (path === `/c/${TOKEN}` && method === "GET") {
      body = { curso: "Inducción SST de prueba", empresa: "Empresa QA", numero_version: 1,
        lecciones: 2, duracion_estimada_min: 20, textos, exige_invitacion: false };
    } else if (path === `/c/${TOKEN}/inscribir` && method === "POST") {
      peticiones.inscripcion = route.request().postDataJSON();
      inscrita = true;
      body = { inscripcion_id: "55555555-5555-4555-8555-555555555555", estado: "EN_CURSO",
        nueva: true, secreto: "solo-una-vez" };
    } else if (path === "/c/sesion/estado" && method === "GET" && inscrita) {
      body = estado(nativaCompleta, evaluacionCompleta, finalizado);
    } else if (path === `/c/sesion/leccion/${NATIVA}` && method === "GET") {
      body = { leccion_id: NATIVA, orden: 1, titulo: "Riesgos del puesto", tipo: "NATIVA",
        obligatoria: true, bloques: [{ tipo: "texto", titulo: null, contenido: "Reconoce los riesgos." }],
        recurso: null, evaluacion: null, bloques_vistos: 0, completada: false };
    } else if (path === "/c/sesion/progreso" && method === "POST") {
      nativaCompleta = true;
      body = { leccion_id: NATIVA, bloques_vistos: 1, bloques_totales: 1,
        completada_en: "2026-11-24T12:00:00Z" };
    } else if (path === `/c/sesion/leccion/${EVALUACION}` && method === "GET") {
      body = { leccion_id: EVALUACION, orden: 2, titulo: "Comprueba lo aprendido",
        tipo: "EVALUACION", obligatoria: true, bloques: [], recurso: null, bloques_vistos: 0,
        completada: false, evaluacion: { nota_minima: 80, intentos_max: 1, intentos_usados: 0,
          puede_intentar: true, aprobado: false, mejor_puntaje: null,
          preguntas: [{ tipo: "OPCION_UNICA", enunciado: "¿Qué haces ante un riesgo?",
            opciones: ["Reportarlo", "Ignorarlo"], puntos: 1 }] } };
    } else if (path === `/c/sesion/leccion/${EVALUACION}/intento` && method === "POST") {
      peticiones.intento = route.request().postDataJSON();
      evaluacionCompleta = true;
      body = { numero: 1, aciertos: 1, preguntas: 1, puntaje: 100, aprobado: true,
        nota_minima: 80, intentos_max: 1, intentos_usados: 1, puede_reintentar: false,
        retroalimentacion: [{ enunciado: "¿Qué haces ante un riesgo?", acierto: true, texto: null }] };
    } else if (path === "/c/sesion/finalizar" && method === "POST") {
      peticiones.cierres += 1;
      finalizado = true;
      body = { estado: "COMPLETADA", asistencia_id: "66666666-6666-4666-8666-666666666666",
        nueva: true, constancia: { folio: 1, codigo_verificacion: "QA-CAP-001", vence_el: null } };
    } else if (path === "/c/sesion/constancia" && method === "GET") {
      body = { folio: 1, codigo_verificacion: "QA-CAP-001", estado: "EMITIDA",
        emitida_en: "2026-11-24T12:00:00Z", vence_el: null,
        snapshot: { participante: { nombres: "Ana", apellidos: "Prueba", tipo_documento: "CC",
          numero_documento: "12345678" }, empresa: { nombre: "Empresa QA" },
          curso: { titulo: "Inducción SST de prueba", version: 1 } } };
    } else {
      await route.fulfill({ status: 404, contentType: "application/json",
        body: JSON.stringify({ detail: { motivo: "sesion_invalida", mensaje: "Sin sesión" } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body),
      headers: { "access-control-allow-origin": "http://127.0.0.1:4173",
        "access-control-allow-credentials": "true" } });
  });
  return peticiones;
}

for (const width of [390, 1440]) {
  test(`el participante entra, responde y registra asistencia a ${width} px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 844 });
    const peticiones = await simularRecorrido(page);

    await page.goto(`/c/${TOKEN}`);
    await expect(page.getByRole("heading", { name: "Inducción SST de prueba" })).toBeVisible();
    await page.getByRole("button", { name: "Comenzar" }).click();
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByText("Escribe tu número de documento.")).toBeVisible();
    await page.getByLabel(/Número/).fill("12345678");
    await page.getByLabel("Nombres").fill("Ana");
    await page.getByLabel("Apellidos").fill("Prueba");
    await page.getByRole("group", { name: "Autorizaciones" }).getByRole("checkbox").first().check();
    await page.getByRole("group", { name: "Autorizaciones" }).getByRole("checkbox").last().check();
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/c\/sesion$/);
    expect((peticiones.inscripcion as { aceptaciones: unknown[] }).aceptaciones).toHaveLength(2);

    await page.getByRole("button", { name: /Continuar/ }).first().click();
    await expect(page.getByRole("heading", { name: "Riesgos del puesto" })).toBeVisible();
    await page.getByRole("button", { name: "Terminar la lección" }).click();
    await expect(page).toHaveURL(/\/c\/sesion$/);

    await page.getByRole("button", { name: /Continuar/ }).first().click();
    await expect(page.getByText("¿Qué haces ante un riesgo?")).toBeVisible();
    await expect(page.getByRole("button", { name: /Falta 1 por responder/ })).toBeDisabled();
    await page.getByRole("radio", { name: "Reportarlo" }).check();
    await page.getByRole("button", { name: "Enviar respuestas" }).click();
    await expect(page.getByText("Aprobaste esta evaluación.")).toBeVisible();
    expect((peticiones.intento as { respuestas: number[] }).respuestas).toEqual([0]);

    await page.getByRole("button", { name: "Volver al curso" }).last().click();
    await page.getByRole("button", { name: "Registrar mi asistencia" }).first().click();
    await page.getByRole("button", { name: "Registrar asistencia" }).click();
    await expect(page.getByRole("heading", { name: "Tu asistencia quedó registrada" })).toBeVisible();
    await expect(page.getByText("QA-CAP-001")).toBeVisible();
    await expect(page.getByRole("button", { name: "Descargar PDF" })).toBeVisible();
    expect(peticiones.cierres).toBe(1);
    const widths = await page.evaluate(() => ({ visible: document.documentElement.clientWidth,
      total: document.documentElement.scrollWidth }));
    expect(widths.total).toBeLessThanOrEqual(widths.visible);
  });
}
