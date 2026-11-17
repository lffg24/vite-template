import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Un componente por trabajo, y que siga siendo uno.
 *
 * ## Por qué esta prueba y no una convención escrita
 *
 * La convención ya estaba escrita y aun así el producto acumuló **tres
 * componentes muertos duplicados** —dos `ToastCard`, dos `ConfirmDialog`, dos
 * `SuperAdminLayout`— y **dos paginaciones**. No fue descuido de nadie: copiar un
 * componente para tocarlo sin romper lo de al lado es lo razonable en el momento,
 * y nada avisa después.
 *
 * Esto avisa. No impide crear un componente nuevo: impide que aparezca un SEGUNDO
 * componente para un trabajo que ya tiene el suyo, que es distinto.
 *
 * ## Psicosocial NO se migra
 *
 * Es el monolito inicial, funciona, y tocarlo no compra nada. La dirección es la
 * contraria: del monolito se **extrae** lo que el núcleo necesita y se replica
 * aquí; cuando el núcleo haya madurado, se decidirá qué conviene traer. Estas
 * reglas gobiernan el NÚCLEO y lo que se construye sobre él.
 *
 * ## Por qué la lista de pendientes está aquí dentro
 *
 * Congelar la deuda en una lista tiene una propiedad que un comentario no tiene:
 * **no puede crecer**. Cada archivo que se migra sale de la lista; cada archivo
 * nuevo que incumpla, falla. Una lista que solo mengua es una deuda que se paga;
 * un comentario es una deuda que se olvida.
 */

const RAIZ = join(process.cwd(), "src");

function archivos(directorio: string, acumulado: string[] = []): string[] {
  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) {
      archivos(ruta, acumulado);
    } else if (/\.tsx?$/.test(entrada) && !/\.test\.tsx?$/.test(entrada)) {
      acumulado.push(ruta);
    }
  }
  return acumulado;
}

const TODOS = archivos(RAIZ);

/** Ruta relativa con barras normales: en Windows `sep` es `\` y la lista no. */
function comoRuta(absoluta: string): string {
  return relative(RAIZ, absoluta).split(sep).join("/");
}

function contenido(absoluta: string): string {
  return readFileSync(absoluta, "utf-8");
}

describe("el núcleo es uno solo", () => {
  it("ningún componente tiene un gemelo con el mismo nombre", () => {
    // Es la forma que tomó el problema las tres veces: alguien copió el archivo
    // a su módulo, el original siguió evolucionando, y quedó una copia muerta
    // que el siguiente en llegar podía importar sin enterarse.
    const porNombre = new Map<string, string[]>();
    for (const ruta of TODOS) {
      if (comoRuta(ruta).startsWith("pages/")) continue;
      const nombre = ruta.split(sep).pop()!;
      // Solo los que exportan un componente: un `constants.ts` repetido por
      // módulo es normal y deseable.
      if (!/^[A-Z]/.test(nombre)) continue;
      porNombre.set(nombre, [...(porNombre.get(nombre) ?? []), comoRuta(ruta)]);
    }

    const gemelos = [...porNombre.entries()].filter(([, rutas]) => rutas.length > 1);
    expect(gemelos, `Hay componentes duplicados: ${JSON.stringify(gemelos)}`).toEqual([]);
  });

  it("hay UNA paginación en el proyecto", () => {
    // Llegó a haber tres: `StandardPagination`, `SuperAdminPagination` y las
    // listas que no paginaban. Dos de ellas se veían distintas en pantallas
    // contiguas.
    const paginaciones = TODOS.filter((ruta) =>
      /Pagination\.tsx$/.test(ruta) && !comoRuta(ruta).startsWith("components/ui/")
    ).map(comoRuta);

    expect(paginaciones).toEqual(["components/common/StandardPagination.tsx"]);
  });

  /**
   * Pantallas que todavía arman su tabla con las piezas crudas de shadcn en vez
   * de `TablaDatos`.
   *
   * **Esta lista solo puede menguar.** No es una excepción permanente: es la
   * deuda que quedaba el día que se puso el freno, escrita para que se vea. Al
   * migrar una pantalla se borra su línea; si alguien añade una, la prueba falla
   * y la conversación ocurre antes y no seis meses después.
   */
  const TABLAS_SIN_MIGRAR = ["pages/superadmin/SuperAdminPsicologosPage.tsx"];

  it("las tablas salen de TablaDatos, y la deuda no crece", () => {
    // `TablaDatos` y `Panel` SON la tabla de la casa, no consumidores suyos:
    // desde la homologacion no duplican los estilos de `components/ui/table`
    // sino que los consumen, que es justo lo que esta prueba quiere que pase.
    // Exentos por ser la implementacion, no por deber nada.
    const IMPLEMENTACION = ["shared/ui/TablaDatos.tsx", "shared/ui/Panel.tsx"];

    const crudas = TODOS.filter(
      (ruta) =>
        contenido(ruta).includes('from "@/components/ui/table"') &&
        !comoRuta(ruta).startsWith("components/ui/") &&
        !IMPLEMENTACION.includes(comoRuta(ruta))
    ).map(comoRuta);

    const nuevas = crudas.filter((r) => !TABLAS_SIN_MIGRAR.includes(r));
    expect(
      nuevas,
      "Usa `TablaDatos` de `@/shared/ui`: trae orden, paginación y la celda " +
        "principal enlazada, y es lo que hace que todas las tablas se lean igual."
    ).toEqual([]);

    // Y al revés: cuando una de la lista se migre, hay que sacarla de aquí. Sin
    // esto la lista se queda con nombres de pantallas que ya no incumplen y deja
    // de decir la verdad.
    const yaMigradas = TABLAS_SIN_MIGRAR.filter((r) => !crudas.includes(r));
    expect(
      yaMigradas,
      "Ya no usan la tabla cruda: bórralas de TABLAS_SIN_MIGRAR."
    ).toEqual([]);
  });

  /**
   * Pantallas que arman la tabla con `<table>` a mano, sin pasar por ninguna de
   * las dos piezas del sistema.
   *
   * El guardia de arriba no las veía: mira quién IMPORTA `@/components/ui/table`,
   * y estas no importan nada — escriben el marcado. Por eso la deuda medida era
   * de una pantalla cuando en realidad eran veinticuatro, y por eso en ellas
   * llegaron a convivir DIEZ `<thead>` distintos y VEINTIUNA combinaciones de
   * relleno para `<th>`.
   *
   * **Esta lista solo puede menguar**, igual que `TABLAS_SIN_MIGRAR`.
   */
  /**
   * Psicosocial escribe sus tablas a mano y **así se queda**.
   *
   * No es deuda: es el monolito inicial, funciona, está certificado, y la
   * dirección del proyecto es no tocarlo. Está separado de la deuda de verdad
   * para que el número no engañe. De las veinticuatro pantallas que escribían
   * `<table>` a mano, CATORCE son estas: contarlas como pendientes hacía
   * parecer que faltaba el triple de lo que falta.
   */
  const PSICOSOCIAL_NO_SE_MIGRA = [
    "components/ui/reportes/TablaDominios.tsx",
    "features/psicosocial/components/SociodemographicChartCard.tsx",
    "features/psicosocial/components/resultados/IndividualRiskTable.tsx",
    "pages/ReportesPsico.tsx",
    "pages/psicosocial/AplicacionDetallePage.tsx",
    "pages/psicosocial/AplicacionResultadosPage.tsx",
    "pages/psicosocial/AplicacionesBTPage.tsx",
    "pages/psicosocial/EmpresaAplicacionesPage.tsx",
    "pages/psicosocial/EmpresaAreasCargosPage.tsx",
    "pages/psicosocial/EmpresaEmpleadosPage.tsx",
    "pages/psicosocial/EmpresaPerfilPage.tsx",
    "pages/psicosocial/EmpresasPsicoPage.tsx",
    "pages/psicosocial/PsicoEmpleadoResultadosPage.tsx",
    "pages/psicosocial/PsicologoDashboardPage.tsx",
  ];

  /**
   * Tablas que NO son listados, y por eso no pasan por `TablaDatos`.
   *
   * `TablaDatos` resuelve un listado: filas homogéneas que se ordenan, se
   * paginan y se abren. Estas dos no lo son y forzarlas sería peor que
   * dejarlas:
   *
   *   - **La matriz de capacitaciones** es una tabla cruzada —una columna por
   *     curso, primera columna fija— donde las columnas las decide el dato, no
   *     el código.
   *   - **La previsualización de importación** muestra lo que va a pasar con
   *     cada fila de un archivo antes de confirmar. No se ordena ni se pagina:
   *     el orden ES el del archivo.
   *
   * Lo que sí se les exige está comprobado abajo: usar las piezas de tabla de
   * la casa. La excepción es «no es un listado», nunca «tengo mi propia
   * tabla».
   */
  const NO_SON_LISTADOS = [
    "pages/capacitaciones/CapacitacionesMatrizPage.tsx",
    "pages/capacitaciones/CapacitacionesParticipantesPage.tsx",
  ];

  /**
   * Quién puede escribir `<table>`. Esta lista solo puede menguar.
   *
   * El 2026-11-16 salieron ocho pantallas: las cuatro de CX, las tres de
   * superadministración y la selección de asignación. Para que pudieran salir
   * hubo que ampliar `TablaDatos` con lo que les faltaba —paginación del
   * servidor, paginación por cursor, tarjetas en móvil, estado de carga y
   * estado vacío—, que es exactamente la razón por la que no se habían
   * migrado antes.
   *
   * Lo que queda no es deuda pendiente: es Psicosocial, que no se migra, y dos
   * tablas que no son listados.
   */
  const TABLAS_A_MANO = [...PSICOSOCIAL_NO_SE_MIGRA, ...NO_SON_LISTADOS];

  it("nadie escribe una tabla a mano, y esa deuda tampoco crece", () => {
    // `shared/ui/TablaDatos.tsx` es el único sitio donde `<table>` es correcto:
    // es la tabla. `components/ui/table.tsx` no aparece porque define `<table>`
    // dentro del propio componente.
    const IMPLEMENTACION = ["shared/ui/TablaDatos.tsx", "components/ui/table.tsx"];

    const aMano = TODOS.filter((ruta) => contenido(ruta).includes("<table"))
      .map(comoRuta)
      .filter((r) => !IMPLEMENTACION.includes(r));

    const nuevas = aMano.filter((r) => !TABLAS_A_MANO.includes(r));
    expect(
      nuevas,
      "No escribas `<table>`: usa `TablaDatos` de `@/shared/ui`, o las " +
        "primitivas de `@/components/ui/table` si la tabla no es un listado."
    ).toEqual([]);

    const yaMigradas = TABLAS_A_MANO.filter((r) => !aMano.includes(r));
    expect(
      yaMigradas,
      "Ya no escriben la tabla a mano: bórralas de TABLAS_A_MANO."
    ).toEqual([]);
  });

  it("lo que no es listado usa igualmente las piezas de tabla de la casa", () => {
    // Que una tabla no sea un listado la exime de `TablaDatos`, no de verse
    // como el resto del producto. Sin esto, «no es un listado» se convierte en
    // la puerta por la que vuelve a entrar un `<thead>` propio.
    const sinPiezas = NO_SON_LISTADOS.filter((ruta) => {
      const texto = contenido(join(RAIZ, ...ruta.split("/")));
      return !/TablaHead|TableHeader|@\/components\/ui\/table/.test(texto);
    });
    expect(
      sinPiezas,
      "Usa `TablaHead` / `TablaBody` de `@/shared/ui/Panel` o las primitivas " +
        "de `@/components/ui/table`: el encabezado y las filas son los mismos."
    ).toEqual([]);
  });

  /**
   * El significado no se dice con color crudo.
   *
   * `bg-red-50` es un color; `bg-danger-subtle` es un significado. La
   * diferencia no es de estilo: el token cambia en modo oscuro y el color
   * crudo no. Un aviso de error escrito con `bg-red-50 text-red-700` se queda
   * en rosa claro con texto rojo oscuro sobre una página oscura, y deja de
   * leerse justo cuando más falta hace.
   *
   * Solo entran aquí las familias SEMÁNTICAS —rojo, ámbar, verde…—, que son
   * las que dicen «esto va bien» o «esto va mal» y para las que existe un
   * token. El gris (`slate-*`) es una deuda aparte y mucho mayor, con su
   * propia lista pendiente.
   */
  const COLOR_CRUDO = /(?:bg|text|border|ring|divide)-(?:red|rose|emerald|amber|green|yellow|orange)-\d{2,3}/;

  /** Solo puede menguar. */
  const COLOR_CRUDO_PENDIENTE = [
    "components/feedback/ToastCard.tsx",
    "components/ui/cargos/ListaCargos.tsx",
    "components/ui/evaluaciones/BienvenidaUsuario.tsx",
    "components/ui/evaluaciones/EvaluacionesPendientes.tsx",
    "components/ui/evaluaciones/ListaEvaluaciones.tsx",
    "components/ui/preguntas/ListaPreguntas.tsx",
    "components/ui/preguntas/PreguntaSemaforo.tsx",
    "components/ui/reportes/TablaDominios.tsx",
    "components/ui/usuarios/FormularioUsuario.tsx",
    "components/ui/usuarios/ListaUsuarios.tsx",
    "features/psicosocial/components/SociodemographicDashboardSection.tsx",
    "features/psicosocial/components/aplicaciones/ApplicationLinkModal.tsx",
    "features/psicosocial/components/empleado/EmployeeProfileHeader.tsx",
    "features/psicosocial/components/resultados/IndividualRiskTable.tsx",
    "features/superadmin/components/SuperAdminCard.tsx",
    "pages/Login.tsx",
    "pages/ReportesOficialesPsicoPage.tsx",
    "pages/ReportesPsico.tsx",
    "pages/ResponderEvaluacion.tsx",
    "pages/RestablecerClave.tsx",
    "pages/SolicitarRecuperacionClave.tsx",
    "pages/psicosocial/AplicacionDetallePage.tsx",
    "pages/psicosocial/AplicacionResultadosPage.tsx",
    "pages/psicosocial/AplicacionesBTPage.tsx",
    "pages/psicosocial/EmpresaAplicacionesPage.tsx",
    "pages/psicosocial/EmpresaAreasCargosPage.tsx",
    "pages/psicosocial/EmpresaEmpleadosPage.tsx",
    "pages/psicosocial/EmpresaPerfilPage.tsx",
    "pages/psicosocial/EmpresasPsicoPage.tsx",
    "pages/psicosocial/PsicoEmpleadoInformesPage.tsx",
    "pages/psicosocial/PsicoEmpleadoPerfilPage.tsx",
    "pages/psicosocial/PsicoEmpleadoRespuestasPage.tsx",
    "pages/psicosocial/PsicoEmpleadoResultadosPage.tsx",
    "pages/psicosocial/PsicologoDashboardPage.tsx",
    "pages/psicosocial/PsicologoPerfilPage.tsx",
    "pages/superadmin/SuperAdminDashboardPage.tsx",
    "pages/superadmin/SuperAdminPsicologosPage.tsx",
  ];

  it("el estado no se dice con color crudo, y esa deuda tampoco crece", () => {
    const crudos = TODOS.filter((ruta) => COLOR_CRUDO.test(contenido(ruta))).map(comoRuta);

    const nuevos = crudos.filter((r) => !COLOR_CRUDO_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Usa los tokens semánticos (`success`, `warning`, `danger`, `info`) o " +
        "`Pill` / `Aviso`: el color crudo de Tailwind no tiene modo oscuro."
    ).toEqual([]);

    const yaLimpios = COLOR_CRUDO_PENDIENTE.filter((r) => !crudos.includes(r));
    expect(
      yaLimpios,
      "Ya no usan color crudo: bórralos de COLOR_CRUDO_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * El gris crudo, que es la otra mitad de la misma deuda.
   *
   * Va aparte de `COLOR_CRUDO` porque el gris no dice nada: no hay un «gris
   * semántico». Es el color del texto, del borde y de la superficie, o sea
   * justo lo que los tokens de la casa resuelven —`foreground`,
   * `foreground-soft`, `muted-foreground`, `border`, `surface-subtle`—. Una
   * pantalla que escribe `text-slate-600` a mano no es que use otro gris: es
   * que no participa del sistema.
   *
   * El prefijo `(?:^|[^a-z-])` no es cosmético: sin él, `-translate-y-1/2`
   * contiene «slate-» y cualquier medida de esta deuda sale inflada. La
   * primera cuenta de este proyecto dio 1.238 por ese motivo.
   */
  const GRIS_CRUDO =
    /(?:^|[^a-z-])(?:bg|text|border|ring|divide|from|to|via|shadow|placeholder|outline|accent|caret|fill|stroke)-slate-\d{2,3}/;

  /**
   * Solo puede menguar.
   *
   * Hoy la lista ES el perímetro de Psicosocial, y eso es deliberado: ahí no
   * se migra nada. Cualquier archivo nuevo en esta lista sería una pantalla
   * del resto del producto escribiendo su propio gris otra vez.
   */
  const GRIS_CRUDO_PENDIENTE = [
    "features/psicosocial/components/SociodemographicChartCard.tsx",
    "features/psicosocial/components/SociodemographicDashboardSection.tsx",
    "features/psicosocial/components/aplicaciones/ApplicationLinkModal.tsx",
    "features/psicosocial/components/empleado/EmployeeInfoCards.tsx",
    "features/psicosocial/components/empleado/EmployeeProfileHeader.tsx",
    "features/psicosocial/components/empleado/InfoField.tsx",
    "features/psicosocial/components/participantes/ParticipantNameLink.README.tsx",
    "features/psicosocial/components/resultados/IndividualRiskTable.tsx",
    "features/psicosocial/components/sociodemografia/SociodemografiaFields.tsx",
    "layout/PsicologoLayout.tsx",
    "pages/ReportesOficialesPsicoPage.tsx",
    "pages/ReportesPsico.tsx",
    "pages/psicosocial/AplicacionDetallePage.tsx",
    "pages/psicosocial/AplicacionResultadosPage.tsx",
    "pages/psicosocial/AplicacionesBTPage.tsx",
    "pages/psicosocial/EmpresaAplicacionesPage.tsx",
    "pages/psicosocial/EmpresaAreasCargosPage.tsx",
    "pages/psicosocial/EmpresaEmpleadosPage.tsx",
    "pages/psicosocial/EmpresaPerfilPage.tsx",
    "pages/psicosocial/EmpresasPsicoPage.tsx",
    "pages/psicosocial/PsicoEmpleadoInformesPage.tsx",
    "pages/psicosocial/PsicoEmpleadoPerfilPage.tsx",
    "pages/psicosocial/PsicoEmpleadoRespuestasPage.tsx",
    "pages/psicosocial/PsicoEmpleadoResultadosPage.tsx",
    "pages/psicosocial/PsicologoPerfilPage.tsx",
    "pages/superadmin/SuperAdminPsicologosPage.tsx",
  ];

  it("el gris sale de los tokens, y esa deuda tampoco crece", () => {
    const grises = TODOS.filter((ruta) => GRIS_CRUDO.test(contenido(ruta))).map(comoRuta);

    const nuevos = grises.filter((r) => !GRIS_CRUDO_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Usa los tokens de la casa (`foreground`, `foreground-soft`, " +
        "`muted-foreground`, `border`, `surface-subtle`). Sobre fondo oscuro, " +
        "blanco con opacidad."
    ).toEqual([]);

    const yaLimpios = GRIS_CRUDO_PENDIENTE.filter((r) => !grises.includes(r));
    expect(
      yaLimpios,
      "Ya no usan gris crudo: bórralos de GRIS_CRUDO_PENDIENTE."
    ).toEqual([]);
  });

  it("hay UNA familia de ilustración: el registro", () => {
    // Llegó a haber tres a la vez: una vectorial sobre tokens, `Escena` y el
    // registro. Ahora el registro es la única fuente de rutas y `Escena` es solo
    // su puente de compatibilidad; la vectorial se retiró.
    const vectorial = TODOS.filter((ruta) =>
      comoRuta(ruta).startsWith("shared/ui/ilustraciones/")
    );
    expect(vectorial).toEqual([]);
  });

  it("toda ilustración del registro existe como archivo, y al revés", () => {
    // El `import` ya hace fallar el build cuando falta el archivo. Lo que esto
    // añade es el otro sentido: un `.webp` que nadie registra pesa en el
    // repositorio para siempre sin que ninguna pantalla lo pinte.
    const registro = contenido(
      join(RAIZ, "shared", "ui", "illustration", "illustration.registry.ts")
    );
    const declaradas = [...registro.matchAll(/ilustraciones\/([a-z0-9-]+)\.webp/g)].map(
      (m) => m[1]
    );
    const enDisco = readdirSync(join(RAIZ, "assets", "ilustraciones"))
      .filter((f) => f.endsWith(".webp"))
      .map((f) => f.replace(/\.webp$/, ""));

    expect([...new Set(declaradas)].sort()).toEqual(enDisco.sort());
  });

  it("nadie se escribe su propio aviso emergente", () => {
    // El aviso de la casa es `ToastCard` más el `Toaster` compartido. Uno
    // propio se ve distinto, se cierra distinto y —como ya pasó— se olvida de
    // funcionar sin ratón.
    const propios = TODOS.filter((ruta) => {
      const r = comoRuta(ruta);
      if (r === "components/feedback/ToastCard.tsx") return false;
      if (r.startsWith("components/ui/")) return false;
      return /position:\s*fixed[\s\S]*toast/i.test(contenido(ruta));
    }).map(comoRuta);

    expect(propios).toEqual([]);
  });

  it("nadie usa `min-h-<número>`: en Tailwind 3.3 no genera nada", () => {
    // La escala de espaciado en `min-h` llegó en Tailwind 3.4 y el proyecto
    // usa la 3.3. `min-h-12` no falla ni avisa: simplemente no existe, y el
    // botón que debía medir 48 px para el pulgar medía 26. Se descubrió
    // midiendo, no leyendo. Lo que funciona es el valor explícito:
    // `min-h-[3rem]`.
    //
    // Psicosocial queda fuera: es el monolito inicial y no se toca. Las
    // pantallas de superadmin que son suyas (créditos, empresas, psicólogos)
    // quedan congeladas aquí: la lista solo puede menguar.
    const DEL_MONOLITO = [
      "pages/superadmin/SuperAdminCreditosPage.tsx",
      "pages/superadmin/SuperAdminEmpresasPage.tsx",
      "pages/superadmin/SuperAdminPsicologosPage.tsx",
    ];
    const usaMinHNumerico = (ruta: string) =>
      /\bmin-h-\d+\b/.test(contenido(ruta).replace(/\bmin-h-0\b/g, ""));
    const rotos = TODOS.filter((ruta) => {
      const r = comoRuta(ruta);
      if (r.includes("/psicosocial/") || DEL_MONOLITO.includes(r)) return false;
      return usaMinHNumerico(ruta);
    }).map(comoRuta);

    expect(rotos).toEqual([]);
    // Y la lista no se queda con nombres que ya cumplen.
    const siguen = TODOS.filter(
      (ruta) => DEL_MONOLITO.includes(comoRuta(ruta)) && usaMinHNumerico(ruta)
    ).map(comoRuta);
    expect(siguen.sort()).toEqual([...DEL_MONOLITO].sort());
  });
});
