// e2e/invitacion-flow.spec.ts
//
// El recorrido por INVITACIÓN personal, en un teléfono, y la importación CSV en
// escritorio. Son los dos caminos nuevos, y los de más riesgo: uno decide quién
// queda registrado como que hizo el curso, el otro escribe una nómina entera.
//
// La API se simula con `page.route`, igual que el resto de la suite. Lo que se
// comprueba aquí es lo que solo se ve en un navegador de verdad: qué campos
// existen en la pantalla, qué se manda al confirmar, y que la vista previa del
// CSV no escriba. Que el backend cumpla su lado lo cubren
// `test_cap_identidad_local.py` y `test_cap_participantes_local.py`.

import { expect, test, type Page, type Route } from "@playwright/test";

const API = "http://127.0.0.1:8000";
const TOKEN_INV = "invitacion-de-prueba-no-real";

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function invitacion(over: Record<string, unknown> = {}) {
  return {
    curso: "Trabajo seguro en alturas",
    empresa: "Constructora del Norte",
    numero_version: 3,
    lecciones: 2,
    duracion_estimada_min: 40,
    // Enmascarada YA desde el servidor. La pantalla no recorta nada.
    identidad: { nombre: "Maria F. O***", documento: "CC ***907" },
    expira_en: "2026-10-08T12:00:00Z",
    textos: [
      {
        clave: "autorizacion_datos_participante",
        texto_id: "11111111-1111-4111-8111-111111111111",
        version: 1,
        finalidad: "Autorizo el tratamiento de mis datos personales.",
        contenido: "Texto completo de la autorización de datos.",
      },
      {
        clave: "declaracion_veracidad",
        texto_id: "22222222-2222-4222-8222-222222222222",
        version: 1,
        finalidad: "Declaro que los datos son veraces.",
        contenido: "Texto completo de la declaración de veracidad.",
      },
    ],
    ...over,
  };
}

test.describe("Participante · invitación personal", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no pide identidad, y no la manda al confirmar", async ({ page }) => {
    // Vite compila en frío en la primera navegación de la suite.
    test.slow();

    await page.route(`${API}/c/i/${TOKEN_INV}`, (r) => json(r, invitacion()));

    let enviado: unknown = null;
    await page.route(`${API}/c/i/${TOKEN_INV}/aceptar`, async (route) => {
      enviado = JSON.parse(route.request().postData() ?? "{}");
      return json(
        route,
        {
          inscripcion_id: "33333333-3333-4333-8333-333333333333",
          participante_id: "44444444-4444-4444-8444-444444444444",
          estado: "EN_CURSO",
          secreto: "secreto-de-reanudacion",
          nueva: true,
        },
        201
      );
    });

    await page.goto(`/c/i/${TOKEN_INV}`);
    await expect(page.getByRole("heading", { name: /trabajo seguro en alturas/i })).toBeVisible();

    // Lo que NO hay. Es el arreglo: no es que el documento se valide mejor, es
    // que no existe dónde escribirlo.
    await expect(page.getByRole("textbox")).toHaveCount(0);
    await expect(page.getByLabel(/documento/i)).toHaveCount(0);

    // Lo que SÍ hay: quién eres, enmascarado, para que confirmes que es tuya.
    await expect(page.getByText("Maria F. O***")).toBeVisible();
    await expect(page.getByText("CC ***907")).toBeVisible();
    await expect(page.getByText(/si no eres tú, no continúes/i)).toBeVisible();

    const confirmar = page.getByRole("button", { name: /confirmar y empezar/i });
    await expect(confirmar).toBeDisabled();

    for (const casilla of await page.getByRole("checkbox").all()) {
      await casilla.check();
    }
    await expect(confirmar).toBeEnabled();
    await confirmar.click();

    // El cuerpo lleva SOLO las aceptaciones, con la versión exacta presentada.
    await expect.poll(() => enviado).not.toBeNull();
    expect(enviado).toEqual({
      aceptaciones: [
        {
          clave: "autorizacion_datos_participante",
          texto_id_presentado: "11111111-1111-4111-8111-111111111111",
        },
        {
          clave: "declaracion_veracidad",
          texto_id_presentado: "22222222-2222-4222-8222-222222222222",
        },
      ],
    });

    // Y sale con su secreto de reanudación, una sola vez. Va en un campo y no
    // en texto suelto porque hay que poder seleccionarlo para copiarlo cuando el
    // portapapeles no está disponible — fuera de HTTPS, por ejemplo.
    await expect(page.locator('input[value="secreto-de-reanudacion"]')).toBeVisible();
  });

  test("una invitación que ya no sirve no dice por qué", async ({ page }) => {
    // «Ya se usó» confirmaría que se acertó un código; «caducó», que existió.
    await page.route(`${API}/c/i/${TOKEN_INV}`, (r) =>
      json(
        r,
        {
          detail: {
            motivo: "invitacion_no_disponible",
            mensaje: "Esta invitación no está disponible.",
          },
        },
        404
      )
    );

    await page.goto(`/c/i/${TOKEN_INV}`);
    await expect(
      page.getByRole("heading", { name: /esta invitación no está disponible/i })
    ).toBeVisible();
    const texto = (await page.locator("body").innerText()).toLowerCase();
    expect(texto).not.toContain("revocada");
    expect(texto).not.toContain("consumida");
  });

  test("el enlace de grupo explica que hace falta la invitación", async ({ page }) => {
    // Y NO dice si esa persona está en la lista de la empresa: eso revelaría
    // quién trabaja allí.
    await page.route(`${API}/c/token-de-grupo`, (r) =>
      json(
        r,
        {
          detail: {
            motivo: "requiere_invitacion",
            mensaje:
              "Esta capacitación se hace con una invitación personal. Pídesela a quien la organiza en tu empresa.",
          },
        },
        403
      )
    );

    await page.goto("/c/token-de-grupo");
    await expect(
      page.getByRole("heading", { name: /necesitas tu invitación personal/i })
    ).toBeVisible();
    const texto = (await page.locator("body").innerText()).toLowerCase();
    expect(texto).not.toContain("no estás en la lista");
    expect(texto).not.toContain("no figuras");
  });
});

test.describe("Administración · importar participantes", () => {
  const usuario = {
    id: "u-1",
    nombre: "Coordinadora HSEQ",
    email: "hseq.demo@abril360.com",
    empresa_id: "empresa-1",
    roles: ["ADMIN_EMPRESA"],
    permissions: [
      "hseq.capacitacion.asignar",
      "hseq.capacitacion.participantes.gestionar",
    ],
  };

  async function autenticar(page: Page) {
    await page.route(`${API}/auth/me`, (r) => json(r, usuario));
    await page.route(`${API}/capacitaciones/contexto`, (r) =>
      json(r, {
        empresa_id: "empresa-1",
        roles_plataforma: [],
        puede_editar_catalogo: false,
        puede_publicar: false,
        puede_asignar: true,
        puede_gestionar_participantes: true,
        tiene_acceso: true,
        permisos_plataforma: [],
        permisos_empresa: [
          "hseq.capacitacion.asignar",
          "hseq.capacitacion.participantes.gestionar",
        ],
        contratado: true,
        vigencia_hasta: "2027-12-31",
        bandera_catalogo: true,
        bandera_catalogo_empresa: true,
        bandera_asignacion: true,
      })
    );
    await page.addInitScript(() => {
      window.localStorage.setItem("token", "token-de-prueba");
    });
  }

  test("la vista previa dice qué pasará y no escribe hasta confirmar", async ({ page }) => {
    test.slow();
    await autenticar(page);
    await page.route(`${API}/capacitaciones/participantes`, (r) => json(r, []));

    let analizado = false;
    let confirmado = false;

    await page.route(
      `${API}/capacitaciones/participantes/importar/analizar`,
      (route) => {
        analizado = true;
        return json(route, {
          resumen: { crea: 1, actualiza: 1, rechazadas: 1, duplicadas: 1, total: 4 },
          filas: [
            {
              fila: 2,
              resultado: "CREA",
              errores: [],
              datos: {
                tipo_documento: "CC",
                numero_documento: "111",
                nombres: "Ana",
                apellidos: "Gomez",
              },
              cambios: [],
            },
            {
              fila: 3,
              resultado: "ACTUALIZA",
              errores: [],
              datos: {
                tipo_documento: "CC",
                numero_documento: "222",
                nombres: "Luis Carlos",
                apellidos: "Perez",
              },
              cambios: ["nombres"],
            },
            {
              fila: 4,
              resultado: "DUPLICADA",
              errores: ["Documento repetido en la fila 3 de este archivo."],
              datos: {
                tipo_documento: "CC",
                numero_documento: "222",
                nombres: "Luis",
                apellidos: "Perez",
              },
              cambios: [],
            },
            {
              fila: 5,
              resultado: "RECHAZADA",
              errores: ["Tipo de documento «XX» no válido."],
              datos: {
                tipo_documento: "XX",
                numero_documento: "333",
                nombres: "Malo",
                apellidos: "Tipo",
              },
              cambios: [],
            },
          ],
          archivo_hash: "abc123",
          columnas_opcionales: ["cargo", "correo", "telefono"],
        });
      }
    );
    await page.route(`${API}/capacitaciones/participantes/importar`, (route) => {
      confirmado = true;
      return json(route, {
        creados: 1,
        actualizados: 1,
        rechazados: 1,
        duplicados: 1,
        total: 4,
      });
    });

    await page.goto("/capacitaciones/participantes");
    await page.getByRole("button", { name: /importar csv/i }).click();

    await page.getByLabel(/archivo csv/i).setInputFiles({
      name: "nomina.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "tipo_documento,numero_documento,nombres,apellidos\nCC,111,Ana,Gomez\n"
      ),
    });

    await expect.poll(() => analizado).toBe(true);
    // Analizar NO escribe: la confirmación es un endpoint aparte, y ese es el
    // punto de tener dos.
    expect(confirmado).toBe(false);

    // La vista previa dice QUÉ cambia, no solo cuántas filas.
    await expect(page.getByText(/se actualizará/i).first()).toBeVisible();
    await expect(page.getByText(/cambia: nombres/i)).toBeVisible();
    // Y explica la repetida, que es el caso que nadie adivina.
    await expect(page.getByText(/documentos repetidos/i)).toBeVisible();
    await expect(page.getByText(/fila 3 de este archivo/i)).toBeVisible();

    // Solo se ofrecen las aplicables: 1 crea + 1 actualiza.
    const confirmar = page.getByRole("button", { name: /importar 2 filas/i });
    await expect(confirmar).toBeEnabled();
    await confirmar.click();

    await expect.poll(() => confirmado).toBe(true);
  });

  test("sin la capacidad, participantes no aparece en el menú", async ({ page }) => {
    // Ocultar el menú no sustituye la autorización del backend, y por eso el
    // backend también lo rechaza — pero ofrecer una sección que responderá 403
    // convierte un límite de permisos en algo que parece una avería.
    await page.route(`${API}/auth/me`, (r) => json(r, usuario));
    await page.route(`${API}/capacitaciones/contexto`, (r) =>
      json(r, {
        empresa_id: "empresa-1",
        roles_plataforma: [],
        puede_editar_catalogo: false,
        puede_publicar: false,
        puede_asignar: true,
        puede_gestionar_participantes: false,
        tiene_acceso: true,
        permisos_plataforma: [],
        permisos_empresa: ["hseq.capacitacion.asignar"],
        contratado: true,
        vigencia_hasta: "2027-12-31",
        bandera_catalogo: true,
        bandera_catalogo_empresa: true,
        bandera_asignacion: true,
      })
    );
    await page.addInitScript(() => {
      window.localStorage.setItem("token", "token-de-prueba");
    });
    await page.route(`${API}/capacitaciones/asignaciones`, (r) => json(r, []));

    await page.goto("/capacitaciones/asignaciones");
    // `button` y no `link`: las entradas de `RoleSidebar` son botones. La
    // afirmación no cambia — sin la capacidad, Participantes no está en el menú.
    await expect(
      page.getByRole("button", { name: /asignaciones/i }).first()
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /participantes/i })).toHaveCount(0);
  });
});
