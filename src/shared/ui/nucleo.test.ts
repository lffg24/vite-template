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
   * Pantallas que arman su tabla con las piezas crudas de shadcn en vez de
   * `TablaDatos`.
   *
   * **La lista está vacía, y eso es el final de esta deuda.** Empezó con
   * veinticuatro pantallas; la última —Psicólogos— salió el 2026-11-17. Se deja
   * aquí, vacía, porque la lista vacía es lo que convierte el guardia en una
   * regla: cualquier nombre que vuelva a aparecer aquí es una pantalla nueva
   * incumpliendo, no deuda heredada.
   */
  const TABLAS_SIN_MIGRAR: string[] = [];

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
    "pages/ReportesOficialesPsicoPage.tsx",
    "pages/ReportesPsico.tsx",
    "pages/ResponderEvaluacion.tsx",
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
   * Desde el 2026-11-17 la lista ES exactamente el perímetro de Psicosocial,
   * sin una sola excepción fuera: la última que quedaba —Psicólogos— salió con
   * la homologación de esa pantalla. Ahí no se migra nada, así que cualquier
   * archivo NUEVO en esta lista es una pantalla del resto del producto
   * escribiendo su propio gris otra vez.
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

  /**
   * Etiqueta, campo y error: UNA pieza.
   *
   * Había OCHO componentes locales llamados `Field` o `Campo`, uno por
   * pantalla. No se parecían: uno envolvía al hijo en el `<label>` —lo que
   * convierte una lista de opciones entera en el área de clic de la etiqueta—,
   * otros usaban `htmlFor`, unos marcaban lo obligatorio y otros no, y **casi
   * todos pintaban el error como un párrafo rojo suelto**, sin relación con el
   * campo: quien usa lector de pantalla no recibía el motivo del rechazo.
   *
   * Es el mismo patrón que trajo los dos `ToastCard` y los dos
   * `ConfirmDialog`, con una diferencia: un campo de formulario se escribe
   * decenas de veces por pantalla, así que la divergencia se multiplica más
   * rápido que en cualquier otra pieza.
   *
   * Los cuatro que quedan son de Psicosocial y **ahí se quedan**, por lo mismo
   * que todo lo demás de Psicosocial. Solo puede menguar.
   */
  const CAMPO_LOCAL_PENDIENTE = [
    "pages/psicosocial/AplicacionDetallePage.tsx",
    "pages/psicosocial/EmpresaAreasCargosPage.tsx",
    "pages/psicosocial/EmpresaEmpleadosPage.tsx",
    "pages/psicosocial/EmpresaPerfilPage.tsx",
  ];

  it("el campo de formulario tiene UNA definición, y esa deuda tampoco crece", () => {
    const IMPLEMENTACION = ["shared/ui/Campo.tsx"];

    const locales = TODOS.filter((ruta) => /\bfunction (Field|Campo)\s*\(/.test(contenido(ruta)))
      .map(comoRuta)
      .filter((r) => !IMPLEMENTACION.includes(r));

    const nuevos = locales.filter((r) => !CAMPO_LOCAL_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Usa `Campo` de `@/shared/ui/Campo`: enlaza la etiqueta con `htmlFor` y " +
        "—esto es lo que no se puede dejar a cada pantalla— asocia el error al " +
        "campo con `aria-invalid` y `aria-describedby`."
    ).toEqual([]);

    const yaMigrados = CAMPO_LOCAL_PENDIENTE.filter((r) => !locales.includes(r));
    expect(
      yaMigrados,
      "Ya no definen su propio campo: bórralos de CAMPO_LOCAL_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * El campo de contraseña tiene su propio interruptor, y también es uno.
   *
   * Estaba escrito a mano en cuatro pantallas y ninguna declaraba
   * `aria-pressed`, así que el ojo de mostrar/ocultar no era un interruptor
   * para un lector de pantalla: era un botón que cambiaba de nombre. Tres de
   * las cuatro ya usan `EntradaClave`; la que falta es de Psicosocial.
   */
  const CLAVE_LOCAL_PENDIENTE = ["pages/psicosocial/PsicologoPerfilPage.tsx"];

  it("el campo de contraseña tiene UNA definición", () => {
    const IMPLEMENTACION = ["shared/ui/EntradaClave.tsx"];

    const locales = TODOS.filter((ruta) => contenido(ruta).includes("EyeOff"))
      .map(comoRuta)
      .filter((r) => !IMPLEMENTACION.includes(r));

    const nuevos = locales.filter((r) => !CLAVE_LOCAL_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Usa `EntradaClave` de `@/shared/ui/EntradaClave`: el interruptor se " +
        "anuncia con `aria-pressed` y el icono y el relleno van juntos."
    ).toEqual([]);

    const yaMigrados = CLAVE_LOCAL_PENDIENTE.filter((r) => !locales.includes(r));
    expect(
      yaMigrados,
      "Ya no dibujan su propio ojo: bórralos de CLAVE_LOCAL_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * Las esquinas tienen SIETE radios, y no un octavo.
   *
   * Esta es la medida que mejor explica la queja de fondo —«muchos
   * comportamientos distintos, tablas distintas, secciones, listas»—: el
   * producto usaba **veinticuatro** radios de esquina diferentes. No
   * veinticuatro estilos: veinticuatro numeros, varios de ellos a 2 px uno de
   * otro. `rounded-2xl` (20 px) y `rounded-3xl` (24 px) convivian 370 y 104
   * veces, y entre medias habia `[22px]`, `[24px]`, `[26px]`, `[28px]`,
   * `[30px]` y `[2rem]`.
   *
   * Dos esquinas a 2 px una de otra no se distinguen de una en una. Lado a
   * lado si, y es exactamente lo que se percibe como «esto no esta terminado»
   * sin poder senalar por que.
   *
   * La escala, por papel y de mayor a menor:
   *
   *   - **2xl** (20 px) la caja de contenido: tarjeta, panel, dialogo.
   *   - **xl** (16 px) una caja dentro de otra caja.
   *   - **lg** (14 px) el control: campo, boton, azulejo. Es `--radius`.
   *   - **md** (12 px) y **sm** (10 px) lo pequeno: etiqueta, chip.
   *   - **xs** (5 px) la casilla de verificacion. Se creo el 2026-11-17 por el
   *     unico radio a mano que quedaba en una pieza base: con `sm`, una caja
   *     de 16 px se ve casi redonda.
   *   - **full** pildora y avatar.
   *
   * `rel-control`, `rel-card` y `rel-panel` son los mismos tres valores con
   * nombre por papel; `[var(--...)]` es un token y tambien vale. Lo que no
   * vale es un numero.
   *
   * El 2026-11-17 se plegaron 31 esquinas en 10 archivos. Lo que queda en la
   * lista es Psicosocial, que no se migra.
   */
  const RADIO_FUERA_DE_ESCALA_PENDIENTE = [
    "features/psicosocial/components/WebDirectBulkUploadModal.tsx",
    "features/psicosocial/components/WebDirectSetupCard.tsx",
    "features/psicosocial/components/aplicaciones/ApplicationLinkModal.tsx",
    "features/psicosocial/components/empleado/EmployeeInfoCards.tsx",
    "features/psicosocial/components/empleado/EmployeeProfileHeader.tsx",
    "features/psicosocial/components/resultados/IndividualRiskTable.tsx",
    "features/psicosocial/web-direct/WebDirectConditionalQuestionScreen.tsx",
    "features/psicosocial/web-direct/WebDirectContentFrame.tsx",
    "features/psicosocial/web-direct/WebDirectIdentificationScreen.tsx",
    "features/psicosocial/web-direct/WebDirectQuestionScreen.tsx",
    "features/psicosocial/web-direct/WebDirectWelcomeScreen.tsx",
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
    "pages/psicosocial/PsicoEmpleadoPerfilPage.tsx",
    "pages/psicosocial/PsicoEmpleadoRespuestasPage.tsx",
    "pages/psicosocial/PsicoEmpleadoResultadosPage.tsx",
    "pages/psicosocial/PsicologoDashboardPage.tsx",
    "pages/psicosocial/WebDirectPublicPage.tsx",
  ];

  it("las esquinas salen de la escala, y no aparece un radio nuevo", () => {
    const ESCALA = new Set([
      "none", "xs", "sm", "md", "lg", "xl", "2xl", "full",
      "rel-control", "rel-card", "rel-panel",
    ]);
    // `rounded-r-`, `rounded-tl-` y demas llevan lado: son la misma escala
    // aplicada a una esquina, y el valor va detras del lado.
    const RADIO = /\brounded-(?!r-|l-|t-|b-|tl-|tr-|bl-|br-)([a-z0-9[\].rem%px()-]+)/g;
    const culpables: string[] = [];

    for (const ruta of TODOS) {
      const malos = [...contenido(ruta).matchAll(RADIO)]
        .map((m) => m[1])
        // Un token con nombre es una decision del sistema, no un numero.
        .filter((v) => !ESCALA.has(v) && !v.startsWith("[var("));
      if (malos.length) culpables.push(comoRuta(ruta));
    }

    const nuevos = culpables.filter((r) => !RADIO_FUERA_DE_ESCALA_PENDIENTE.includes(r));
    expect(
      nuevos,
      "La escala es 2xl · xl · lg · md · sm · xs · full. Un radio nuevo no se " +
        "distingue del de al lado de uno en uno, pero lado a lado es justo lo " +
        "que se ve como «sin terminar»."
    ).toEqual([]);

    const yaEnEscala = RADIO_FUERA_DE_ESCALA_PENDIENTE.filter((r) => !culpables.includes(r));
    expect(
      yaEnEscala,
      "Ya estan en la escala: borralos de RADIO_FUERA_DE_ESCALA_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * Un control nunca lleva la esquina de una caja de contenido.
   *
   * La escala cerrada no basta por si sola: dos pantallas pueden estar las dos
   * dentro de la escala y aun asi dibujar el MISMO campo distinto. Es lo que
   * pasaba en las tres pantallas de acceso —entrar, pedir clave nueva,
   * cambiarla—: el campo y el boton iban a 20 px, el radio de una tarjeta,
   * mientras los mismos componentes en el resto del producto van a 14 px. El
   * alto (`h-14`) si es una decision de enfasis legitima en una pantalla de
   * entrada, y se queda; la esquina no, porque no enfatiza nada: solo hace que
   * el campo no se reconozca como el mismo campo.
   *
   * `2xl`, `xl` y `rel-panel`/`rel-card` son radios de CAJA. Un control usa
   * `lg` —es `--radius`, el token que lleva ese nombre justamente por esto—,
   * o `md`/`sm`/`xs` si es mas pequeno, o `full` si es una pildora.
   */
  const CONTROL_CON_RADIO_DE_CAJA_PENDIENTE = [
    "features/psicosocial/components/WebDirectSetupCard.tsx",
    "pages/ReportesOficialesPsicoPage.tsx",
    "pages/psicosocial/AplicacionDetallePage.tsx",
    "pages/psicosocial/EmpresaEmpleadosPage.tsx",
    "pages/psicosocial/EmpresasPsicoPage.tsx",
    "pages/psicosocial/PsicoEmpleadoInformesPage.tsx",
  ];

  it("ningun control lleva el radio de una caja de contenido", () => {
    // Solo las piezas de la casa —`Input`, `Button`, `Textarea`,
    // `SelectTrigger`—, y no un `<button>` a mano. La diferencia no es de
    // forma, es de que cosa es: un `<button>` escrito a mano suele ser una
    // TARJETA entera que se puede pulsar —una opcion de una lista de roles,
    // por ejemplo—, y una tarjeta pulsable sigue siendo una tarjeta, con su
    // esquina de tarjeta. Los `<button>` a mano ya los cuenta y los tapa
    // `TOPE_BOTONES_A_MANO`.
    //
    // `[^<]` y no `[^<>]`: un `onClick={() => ...}` antes de `className`
    // lleva un `>` dentro, y con `[^<>]` la prueba se saltaba en silencio
    // todo control que tuviera uno. `[^<]` no puede cruzar a otra etiqueta,
    // porque toda etiqueta empieza por `<`.
    //
    // Sin bandera `g`, y a proposito: un `RegExp` global guarda `lastIndex`
    // entre llamadas a `test`, asi que reutilizado en un filtro se salta
    // archivos alternos. Esta prueba nacio con ese fallo y daba once culpables
    // donde hay trece.
    const CONTROL =
      /<(?:Input|Button|Textarea|SelectTrigger)\b[^<]{0,600}?\brounded-(?:2xl|3xl|rel-panel|rel-card)\b/;
    const culpables = TODOS.filter((ruta) => CONTROL.test(contenido(ruta))).map(comoRuta);

    const nuevos = culpables.filter((r) => !CONTROL_CON_RADIO_DE_CAJA_PENDIENTE.includes(r));
    expect(
      nuevos,
      "El campo y el boton usan `rounded-lg`. Si hace falta mas presencia, " +
        "sube el alto, no la esquina: la esquina es lo que hace que se " +
        "reconozca como el mismo control que en el resto del producto."
    ).toEqual([]);

    const yaLimpios = CONTROL_CON_RADIO_DE_CAJA_PENDIENTE.filter(
      (r) => !culpables.includes(r)
    );
    expect(
      yaLimpios,
      "Ya usan radio de control: borralos de CONTROL_CON_RADIO_DE_CAJA_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * La casilla tiene UNA definicion.
   *
   * Nueve pantallas la dibujaban a mano, y entre las nueve habia cinco formas
   * distintas de la MISMA casilla: `h-4` o `h-5`; `accent-rel-primary`,
   * `accent-[hsl(var(--rel-primary))]` o **ningun acento** —dos pantallas de
   * CX sacaban la casilla azul por defecto del navegador en medio de un
   * producto turquesa—; con anillo de foco o sin el; con alto minimo para el
   * pulgar o sin el.
   *
   * El tamano se cerro en 16 px de caja y 44 px de fila. Dos de las nueve
   * habian subido la caja a 20 px, y la razon que escribieron era buena: 13 px
   * no se da con el pulgar. Pero el blanco tactil no es la caja, es la FILA,
   * porque la etiqueta esta unida al control. Agrandar la caja arregla el
   * sintoma en un sitio; garantizar los 44 px lo arregla en todos, y deja la
   * caja del tamano que el recorrido del participante ya usaba.
   *
   * `OpcionesMultiples` ya no tiene casilla propia: la consume. Era la ultima
   * segunda definicion que quedaba del mismo control.
   */
  const CASILLA_LOCAL_PENDIENTE = ["pages/psicosocial/EmpresaAplicacionesPage.tsx"];

  it("la casilla tiene UNA definicion, y esa deuda tampoco crece", () => {
    const IMPLEMENTACION = ["shared/ui/Casilla.tsx"];

    const locales = TODOS.filter((ruta) => contenido(ruta).includes('type="checkbox"'))
      .map(comoRuta)
      .filter((r) => !IMPLEMENTACION.includes(r));

    const nuevos = locales.filter((r) => !CASILLA_LOCAL_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Usa `Casilla` de `@/shared/ui/Casilla`: trae el acento, el anillo de " +
        "foco, los 44 px de fila y la descripcion atada con `aria-describedby`."
    ).toEqual([]);

    const yaMigrados = CASILLA_LOCAL_PENDIENTE.filter((r) => !locales.includes(r));
    expect(
      yaMigrados,
      "Ya usan la pieza: borralos de CASILLA_LOCAL_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * El bloque de autorizaciones existe UNA vez.
   *
   * Estaba escrito dos veces, casi identico, en la identificacion y en la
   * invitacion. Casi: una le daba 44 px de alto al boton que despliega el
   * texto legal y la otra no, asi que la misma pantalla de consentimiento se
   * podia pulsar bien en un sitio y mal en el otro. Asi se degrada una copia:
   * nadie la rompe, se arregla una sola.
   *
   * Y no era adorno: es la pantalla donde alguien consiente el tratamiento de
   * sus datos, y de ella depende que la aceptacion quede registrada con su
   * version.
   */
  it("el bloque de autorizaciones existe UNA vez", () => {
    const IMPLEMENTACION = "shared/ui/Autorizaciones.tsx";
    const copias = TODOS.filter((ruta) =>
      contenido(ruta).includes("Leer el texto completo")
    )
      .map(comoRuta)
      .filter((r) => r !== IMPLEMENTACION);
    expect(
      copias,
      "Usa `Autorizaciones` de `@/shared/ui/Autorizaciones`. Una copia de la " +
        "pantalla de consentimiento es una copia que alguien arreglara a medias."
    ).toEqual([]);
  });

  /**
   * Elegir UNA opcion tiene pieza desde hace tiempo. Faltaba la guardia.
   *
   * Aqui hay que corregir una cifra que se dio mal: se dijo que «radio» era,
   * como las pestanas, una pieza que no existia y habia que crear. No es
   * cierto. `OpcionesExcluyentes` ya existia y ya la usaban dos pantallas; lo
   * que pasaba es que otras dos dibujaban la suya a mano con el mismo marcado
   * casi calcado. Lo que faltaba no era la pieza: era esta prueba.
   *
   * Para absorberlas la pieza gano dos cosas, las dos con criterio y no por
   * complacer a quien llamaba: `leyendaOculta`, porque a veces el `<fieldset>`
   * de fuera ya nombra al grupo y verlo dos veces estorba —pero sin leyenda el
   * lector se queda con unos radios sin nombre, asi que seguir declarandola es
   * obligatorio—; y `disposicion`, porque apilar o repartir en columnas
   * depende del largo de la descripcion, no del gusto.
   *
   * ## La excepcion, que no es deuda
   *
   * `CalificacionPublicaPage` dibuja una ESCALA: los numeros del 0 al 10 de un
   * NPS. Eso no es «elegir una de varias opciones que hay que leer», es marcar
   * un punto en una recta, y forzarlo dentro de esta pieza daria once tarjetas
   * con descripcion donde debe haber once casillas en fila. La otra escala del
   * producto esta en Psicosocial y no se migra, asi que una pieza para esto
   * tendria exactamente un usuario, y eso no es una pieza.
   */
  const RADIO_A_MANO_PENDIENTE = [
    "features/psicosocial/web-direct/WebDirectConditionalQuestionScreen.tsx",
    "features/psicosocial/web-direct/WebDirectQuestionScreen.tsx",
  ];

  it("elegir una opcion sale de OpcionesExcluyentes, y esa deuda tampoco crece", () => {
    const IMPLEMENTACION = ["shared/ui/OpcionesExcluyentes.tsx"];
    const ESCALA = ["pages/cx/CalificacionPublicaPage.tsx"];

    const locales = TODOS.filter((ruta) => contenido(ruta).includes('type="radio"'))
      .map(comoRuta)
      .filter((r) => !IMPLEMENTACION.includes(r) && !ESCALA.includes(r));

    const nuevos = locales.filter((r) => !RADIO_A_MANO_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Usa `OpcionesExcluyentes` de `@/shared/ui/OpcionesExcluyentes`: trae el " +
        "`<fieldset>` con nombre, el estado elegido y el foco visible. Si lo " +
        "que dibujas es una ESCALA y no una lista de opciones, dilo en ESCALA."
    ).toEqual([]);

    const yaMigrados = RADIO_A_MANO_PENDIENTE.filter((r) => !locales.includes(r));
    expect(
      yaMigrados,
      "Ya usan la pieza: borralos de RADIO_A_MANO_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * Una pestaña a mano siempre sale a medias.
   *
   * Las tres que había —todas en `SuperAdminRolesPermisosPage`— fallaban en lo
   * mismo: dos declaraban `role="tab"` sin que existiera un solo
   * `role="tabpanel"` en la pantalla, y la tercera se hacía pasar por
   * navegación con `aria-current="page"` sobre algo que no es una página. Las
   * tres se movían solo con el ratón.
   *
   * No es descuido de quien las escribió: `role="tab"` parece una etiqueta y
   * en realidad es un contrato de cuatro cláusulas —panel que existe, foco
   * itinerante, flechas y `aria-controls`—. La única forma de que se cumplan
   * las cuatro es que las escriba una pieza, una vez.
   */
  const PESTANAS_A_MANO_PENDIENTE = ["pages/psicosocial/EmpresaAreasCargosPage.tsx"];

  it("nadie dibuja sus propias pestañas", () => {
    const IMPLEMENTACION = ["shared/ui/Pestanas.tsx"];

    const locales = TODOS.filter((ruta) => /role="tab(?:list)?"/.test(contenido(ruta)))
      .map(comoRuta)
      .filter((r) => !IMPLEMENTACION.includes(r));

    const nuevos = locales.filter((r) => !PESTANAS_A_MANO_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Usa `Pestanas` de `@/shared/ui/Pestanas`. `role=\"tab\"` promete un " +
        "panel, flechas y foco itinerante; escrito a mano nunca llegan los tres."
    ).toEqual([]);

    const yaMigrados = PESTANAS_A_MANO_PENDIENTE.filter((r) => !locales.includes(r));
    expect(
      yaMigrados,
      "Ya usan la pieza: bórralos de PESTANAS_A_MANO_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * Cuántos botones quedan escritos a mano, con el perímetro escrito.
   *
   * Esta prueba existe porque la CIFRA se dio mal dos veces seguidas, y las dos
   * por el mismo motivo: no por contar mal, sino por mover sin querer lo que
   * entraba en la cuenta. Una medida dijo 1.273 grises donde había 97 porque
   * `-translate-y-1/2` contiene «slate-»; otra dijo 34 botones donde había 52
   * porque esa vez el perímetro dejó fuera pantallas que sí contaban.
   *
   * Un número que depende de quién lo mide no sirve para decidir nada. Así que
   * el perímetro deja de ser un criterio y pasa a ser código:
   *
   *   - **Las piezas base no cuentan.** `shared/ui`, `components/ui` y
   *     `components/common` SON el botón, el cajón, la tabla: dibujar un
   *     `<button>` es su trabajo.
   *   - **Psicosocial no cuenta.** No se migra.
   *   - **Todo lo demás cuenta**, incluidas las pantallas de superadmin que
   *     gestionan psicólogos: administran la plataforma, no son el instrumento.
   *
   * El tope solo puede bajar. No obliga a migrar nada; obliga a que la cuenta
   * sea la misma cada vez que se mire.
   */
  const TOPE_BOTONES_A_MANO = 33;

  it("los botones a mano no aumentan, y la cuenta no depende de quién mire", () => {
    const esPiezaBase = (r: string) =>
      r.startsWith("shared/ui/") || r.startsWith("components/ui/") || r.startsWith("components/common/");
    const esPsicosocial = (r: string) =>
      r.includes("/psicosocial/") ||
      r.startsWith("features/psicosocial/") ||
      [
        "pages/ReportesPsico.tsx",
        "pages/ReportesOficialesPsicoPage.tsx",
        "pages/ResponderEvaluacion.tsx",
        "layout/PsicologoLayout.tsx",
      ].includes(r);

    const cuenta = TODOS.filter((ruta) => {
      const r = comoRuta(ruta);
      return r.endsWith(".tsx") && !esPiezaBase(r) && !esPsicosocial(r);
    }).reduce((suma, ruta) => suma + (contenido(ruta).match(/<button/g) ?? []).length, 0);

    expect(
      cuenta,
      `Hay ${cuenta} botones escritos a mano y el tope es ${TOPE_BOTONES_A_MANO}. ` +
        "Usa `Button` de `@/components/ui/button`: trae el anillo de foco, la " +
        "curva de movimiento, el estado presionado y el desactivado, una vez."
    ).toBeLessThanOrEqual(TOPE_BOTONES_A_MANO);
  });

  /**
   * Nada escribe en blanco sobre el turquesa de la marca.
   *
   * No es una preferencia: el turquesa de ABRIL es un color CLARO. Blanco
   * encima da 2,5:1 cuando el mínimo para texto es 4,5:1 — no es «se lee
   * peor», es que no se lee. El azul de marca encima da 6,6:1.
   *
   * Hacía falta un guardia y no un comentario porque el error es invisible al
   * escribirlo: `bg-rel-accent text-white` compila, se ve bonito en la pantalla
   * del que lo escribe y solo falla para quien tiene poca visión o está al sol.
   * Antes del 2026-11-17 el relleno era un turquesa oscuro donde el blanco sí
   * valía, así que el patrón quedó escrito en cinco sitios; al unificar la
   * marca en el turquesa de la casa, esos cinco habrían pasado a 2,5:1 de
   * golpe y sin aviso.
   */
  /**
   * Las cuatro que ya lo hacían, y dónde están.
   *
   * **Las cuatro son de Psicosocial**, y no es casualidad: usan
   * `bg-primary text-white`, que es el boton primario de la casa tal como
   * esta declarado hoy —`--primary-foreground` vale blanco en tema claro—.
   * O sea que el defecto no es de estas cuatro pantallas: es del token, y
   * estas son donde se ve.
   *
   * **Resuelto el 2026-11-17**, a peticion expresa del dueño del producto:
   * `--primary-foreground` pasa a ser el azul de marca, las cuatro pantallas
   * dejan de escribir `text-white` a mano, y la lista queda vacia. Vacia es
   * como tiene que quedarse: cualquier nombre que vuelva a aparecer aqui es
   * una pantalla nueva incumpliendo, no deuda heredada.
   */
  const BLANCO_SOBRE_MARCA_PENDIENTE: string[] = [];

  it("nadie escribe en blanco sobre el turquesa de marca", () => {
    const enBlancoSobreMarca =
      /(?:bg-rel-accent|bg-primary)(?:\/\d+)?\b[^"'`]*\btext-white\b|\btext-white\b[^"'`]*\b(?:bg-rel-accent|bg-primary)(?:\/\d+)?\b/;

    const culpables = TODOS.filter((ruta) => enBlancoSobreMarca.test(contenido(ruta))).map(comoRuta);

    const nuevos = culpables.filter((r) => !BLANCO_SOBRE_MARCA_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Sobre el turquesa de marca el texto va oscuro (`text-rel-dark`). " +
        "Blanco encima da 2,5:1 y el mínimo es 4,5:1. Para TEXTO turquesa " +
        "sobre superficie clara existe `text-rel-accent-ink`."
    ).toEqual([]);

    const yaArregladas = BLANCO_SOBRE_MARCA_PENDIENTE.filter((r) => !culpables.includes(r));
    expect(
      yaArregladas,
      "Ya no escriben en blanco sobre la marca: bórralas de " +
        "BLANCO_SOBRE_MARCA_PENDIENTE."
    ).toEqual([]);
  });

  /**
   * Los iconos dicen si pintan o si hablan.
   *
   * Hay UNA librería de iconos —Lucide, 638 iconos en 144 archivos— y eso ya
   * estaba bien. Lo que no estaba era el papel de cada uno: **313 de 581 no
   * declaraban nada**, y un icono que no declara nada es un icono que el
   * lector de pantalla puede leer en voz alta. En un botón que ya dice
   * «Guardar», el icono de disquete al lado se anuncia otra vez, y la persona
   * oye el control duplicado.
   *
   * La regla es binaria y por eso se puede comprobar: o el icono es decorativo
   * y lleva `aria-hidden`, o ES el contenido del control y lleva `aria-label`.
   * No hay tercer caso.
   *
   * `@radix-ui/react-icons` estaba instalado y no se importaba en ningún
   * archivo: se retiró el 2026-11-17. Que no se note en pantalla no quiere
   * decir que no cueste — una segunda librería de iconos en el `package.json`
   * es una invitación permanente a que alguien la use.
   */
  it("todo icono declara si es decorativo o si es el control", () => {
    const ICONO = /<([A-Z][A-Za-z0-9]*)\b([^<>]*?)\/>/g;
    const culpables: string[] = [];

    for (const ruta of TODOS) {
      const texto = contenido(ruta);
      const imports = texto.match(/import\s*\{([^}]*)\}\s*from\s*"lucide-react"/);
      if (!imports) continue;
      const nombres = new Set(
        imports[1].split(",").map((n) => n.trim().split(" as ").pop()!.trim()).filter(Boolean)
      );
      for (const [, tag, props] of texto.matchAll(ICONO)) {
        if (!nombres.has(tag)) continue;
        if (/aria-hidden|aria-label|role=/.test(props)) continue;
        culpables.push(`${comoRuta(ruta)} → <${tag}>`);
        break;
      }
    }

    expect(
      culpables,
      "Un icono decorativo lleva `aria-hidden=\"true\"`; uno que ES el control " +
        "lleva `aria-label`. Sin ninguno de los dos, el lector de pantalla " +
        "repite lo que el botón ya dice."
    ).toEqual([]);
  });

  /**
   * La carga es un sistema, no un giro por defecto.
   *
   * La peticion fue «esqueletos en todas las pantallas». La biblioteca de
   * patrones de la que sale esa idea dice, en el patron de al lado, que el
   * esqueleto puesto en todo es la señal de una interfaz perezosa. Las dos
   * cosas son ciertas y lo que decide es QUE SE SABE de la espera: si se sabe
   * la forma, esqueleto; si no se sabe y es corta, giro; si se sabe el
   * porcentaje, barra; por debajo de 300 ms, nada.
   *
   * Lo que esta prueba impide es el unico caso sin matices: **un giro tapando
   * la pantalla entera**. Un giro no dice ni que se carga ni cuanto falta, asi
   * que a pantalla completa se lee como una aplicacion congelada. Para eso
   * estan las formas de `@/shared/ui/Esqueleto`.
   *
   * El 2026-11-17 se retiro `components/loading/AppLoadingOverlay.tsx`, que
   * era exactamente eso y ademas no lo importaba ningun archivo: una cuarta
   * implementacion de carga, muerta, esperando a que alguien la encontrara.
   */
  /** Psicosocial, que no se migra. Solo puede menguar. */
  const GIRO_PANTALLA_PENDIENTE = ["pages/psicosocial/AplicacionDetallePage.tsx"];

  it("ningun giro tapa la pantalla entera", () => {
    const culpables = TODOS.filter((ruta) => {
      const texto = contenido(ruta);
      if (!texto.includes("animate-spin")) return false;
      // Mismo elemento o muy cerca: una capa a pantalla completa con un giro.
      return /fixed inset-0[^"'`]*"[\s\S]{0,400}?animate-spin/.test(texto);
    }).map(comoRuta);

    const nuevos = culpables.filter((r) => !GIRO_PANTALLA_PENDIENTE.includes(r));
    expect(
      nuevos,
      "Un giro a pantalla completa se lee como una aplicacion congelada. " +
        "Usa `ZonaCargando` con la forma de lo que viene, de " +
        "`@/shared/ui/Esqueleto`."
    ).toEqual([]);

    const yaLimpios = GIRO_PANTALLA_PENDIENTE.filter((r) => !culpables.includes(r));
    expect(yaLimpios, "Ya no tapan la pantalla: borralos de GIRO_PANTALLA_PENDIENTE.").toEqual([]);
  });

  /**
   * Y nadie mezcla las dos cosas en la misma vista.
   *
   * Un esqueleto dice «esto va a tener esta forma» y un giro dice «no se lo
   * que viene». Juntos se contradicen, y la pantalla parece montada por dos
   * personas que no hablaron.
   */
  const MEZCLA_PENDIENTE = ["pages/ReportesPsico.tsx"];

  it("ninguna vista mezcla esqueleto y giro", () => {
    const mezclan = TODOS.filter((ruta) => {
      const texto = contenido(ruta);
      // `<Esqueleto` y no `Esqueleto`: lo que cuenta es lo que se PINTA. Con
      // la version laxa, un archivo que solo importa `useCargaVisible` del
      // modulo de esqueletos —para aplicar la regla de los 300 ms a su giro—
      // salia marcado como mezcla, y no lo es: es justo lo contrario.
      return /animate-spin/.test(texto) && /<(?:Esqueleto|Skeleton)[\s/>]/.test(texto);
    }).map(comoRuta);

    const nuevos = mezclan.filter((r) => !MEZCLA_PENDIENTE.includes(r));
    expect(
      nuevos,
      "O esqueleto —cuando se sabe la forma— o giro —cuando no y la espera es " +
        "corta—, nunca los dos en la misma vista."
    ).toEqual([]);

    const yaLimpios = MEZCLA_PENDIENTE.filter((r) => !mezclan.includes(r));
    expect(yaLimpios, "Ya no mezclan: borralos de MEZCLA_PENDIENTE.").toEqual([]);
  });

  /**
   * Hay UNA escala de movimiento, y las duraciones salen de ella.
   *
   * Habia dos casi iguales —160/220/300 y 150/220/280— y la de la casa
   * practicamente no se usaba. Peor: 180 sitios escriben `transition` a secas,
   * y Tailwind les daba 150 ms con la curva `ease`, que arranca y frena igual.
   * Eso es literalmente lo que se percibe como «plano». Hoy el valor por
   * defecto de `transition` es la curva y la duracion de la casa, asi que esos
   * 180 sitios se movieron sin tocar ni uno.
   *
   * Lo que esta prueba impide es volver a escribir milisegundos a mano.
   */
  it("nadie escribe duraciones de animacion a mano", () => {
    const A_MANO = /\bduration-\[\d+m?s\]|transition-duration:\s*\d/;
    const culpables = TODOS.filter((ruta) => A_MANO.test(contenido(ruta))).map(comoRuta);

    expect(
      culpables,
      "Usa la escala: `duration-press` (90 ms), `duration-exit` (130), " +
        "`duration-enter` (220), `duration-context` (280). Un numero suelto es " +
        "una quinta duracion que nadie volvera a mirar."
    ).toEqual([]);
  });

  /**
   * Los iconos tienen SIETE tamaños, y no un octavo.
   *
   * La libreria ya era una sola y el papel de cada icono ya estaba declarado.
   * Lo que seguia suelto era la medida: habia **diez** tamaños distintos, y
   * tres de ellos los usaban seis, siete y UN icono respectivamente. Un
   * tamaño que usa un solo icono no es una decision de diseño, es un numero
   * que alguien tecleo una vez.
   *
   * La escala es:
   *
   *   - **3.5** dentro de una pildora o una etiqueta.
   *   - **4** el corriente, junto a texto. Son 297 de los 635.
   *   - **5** en botones y cabeceras de seccion.
   *   - **6** en cabecera de pagina y navegacion.
   *   - **8** el azulejo de una tarjeta.
   *   - **10** y **12** ya no son iconos: son ilustracion de un estado vacio
   *     o de una pantalla de bienvenida.
   *
   * El 2026-11-17 se plegaron `h-3` → `h-3.5`, `h-7` → `h-8` y `h-9` → `h-8`
   * en todo lo que no es Psicosocial. Lo que queda en la lista es Psicosocial,
   * que no se migra.
   */
  const TAMANO_FUERA_DE_ESCALA_PENDIENTE = [
    "components/ui/reportes/MultiSelectEvaluaciones.tsx",
    "features/psicosocial/web-direct/WebDirectJourneyScreen.tsx",
    "pages/psicosocial/AplicacionDetallePage.tsx",
    "pages/psicosocial/AplicacionesBTPage.tsx",
    "pages/psicosocial/EmpresasPsicoPage.tsx",
    "pages/psicosocial/PsicoEmpleadoRespuestasPage.tsx",
  ];

  it("los iconos salen de la escala, y no aparece un tamaño nuevo", () => {
    const ESCALA = new Set(["3.5", "4", "5", "6", "8", "10", "12"]);
    const ICONO = /<([A-Z][A-Za-z0-9]*)\b([^<>]*?)\/>/g;
    const culpables: string[] = [];

    for (const ruta of TODOS) {
      const texto = contenido(ruta);
      const imports = texto.match(/import\s*\{([^}]*)\}\s*from\s*"lucide-react"/);
      if (!imports) continue;
      const nombres = new Set(
        imports[1].split(",").map((n) => n.trim().split(" as ").pop()!.trim()).filter(Boolean)
      );
      for (const [, tag, props] of texto.matchAll(ICONO)) {
        if (!nombres.has(tag)) continue;
        const medida = props.match(/\bh-([0-9.]+) w-\1\b/);
        if (medida && !ESCALA.has(medida[1])) {
          culpables.push(comoRuta(ruta));
          break;
        }
      }
    }

    const nuevos = culpables.filter((r) => !TAMANO_FUERA_DE_ESCALA_PENDIENTE.includes(r));
    expect(
      nuevos,
      "La escala es 3.5 · 4 · 5 · 6 · 8, mas 10 y 12 para ilustrar un estado " +
        "vacio. Un tamaño nuevo es un octavo criterio que nadie volvera a mirar."
    ).toEqual([]);

    const yaEnEscala = TAMANO_FUERA_DE_ESCALA_PENDIENTE.filter((r) => !culpables.includes(r));
    expect(
      yaEnEscala,
      "Ya estan en la escala: borralos de TAMANO_FUERA_DE_ESCALA_PENDIENTE."
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
    // pantallas de superadmin que son suyas (créditos, empresas) quedan
    // congeladas aquí: la lista solo puede menguar. Psicólogos salió el
    // 2026-11-17 al homologarse.
    const DEL_MONOLITO = [
      "pages/superadmin/SuperAdminCreditosPage.tsx",
      "pages/superadmin/SuperAdminEmpresasPage.tsx",
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
