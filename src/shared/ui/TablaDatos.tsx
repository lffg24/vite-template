// src/shared/ui/TablaDatos.tsx
//
// La tabla de ABRIL-360: carcasa, ordenamiento, paginación, estados y celda
// principal enlazada, en un solo sitio.
//
// Existe porque cada pantalla estaba resolviendo lo mismo por su cuenta y
// ninguna igual: una ordenaba en el cliente y otra no ordenaba, una paginaba
// con `StandardPagination` y otra pintaba la lista entera, y el nombre de la
// fila era texto plano en unas y un botón en otras. El resultado es que dos
// tablas del mismo producto se operan distinto, y eso el usuario lo nota antes
// que cualquier detalle de color.
//
// ## Qué se amplió (2026-11-16) y por qué
//
// Veinticuatro pantallas seguían escribiendo `<table>` a mano. No era desidia:
// este componente no servía para ellas. Le faltaban tres cosas, y las tres eran
// la misma — daba por hecho que la lista entera cabía en la respuesta:
//
//   - **Paginación del servidor** (`control`). Auditoría y Créditos reciben una
//     página ya cortada; cortarla otra vez en el cliente paginaba la página.
//   - **Variante móvil** (`movil` en cada columna). Empresas pintaba una tabla
//     y, aparte, una lista de tarjetas con los MISMOS datos escritos dos veces.
//     Ahora las tarjetas se derivan de las mismas columnas: un dato, una
//     declaración, dos formas.
//   - **Estados** (`cargando`, `vacio`). Sin ellos, una pantalla vacía o
//     cargando tenía que resolverse fuera, y por eso había tantas maneras
//     distintas de decir «no hay nada todavía» como pantallas.
//
// Decisiones que conviene no volver a discutir:
//
//   - **Por omisión ordena y pagina en el cliente.** Es correcto mientras el
//     listado quepa entero en la respuesta. Cuando el endpoint pagina de
//     verdad, la pantalla pasa `control` y este componente deja de cortar: no
//     son dos componentes, es un modo.
//   - **La paginación es `StandardPagination`**, la que ya usa Psicosocial. No
//     se reimplementa: si hay una sola paginación en el proyecto, arreglarla
//     una vez la arregla en todas partes.
//   - **La celda principal es un enlace**, no un botón ni texto. Un enlace se
//     puede abrir en otra pestaña, copiar y compartir; un `onClick` no. Es la
//     diferencia entre una tabla que se consulta y una que se sufre.

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { CursorPagination, StandardPagination } from "@/components/common/StandardPagination";
import { Esqueleto, useCargaVisible } from "./Esqueleto";
import { useIsMobile } from "@/hooks/use-mobile";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { TablaBody, TablaHead, TablaPanel } from "./Panel";

export type ColumnaTabla<T> = {
  /** Identifica la columna al ordenar. Único dentro de la tabla. */
  clave: string;
  titulo: string;
  alineacion?: "izquierda" | "derecha";
  /** Qué se pinta. */
  celda: (fila: T) => ReactNode;
  /**
   * Con qué se ordena EN EL CLIENTE. Su presencia es lo que hace ordenable la
   * columna cuando no hay `control`.
   *
   * Es un valor y no un comparador a propósito: un comparador por columna
   * acaba con seis criterios de desempate distintos en la misma tabla.
   */
  valor?: (fila: T) => string | number | null | undefined;
  /**
   * Con `control`, declara que el SERVIDOR sabe ordenar por esta columna. Sin
   * `control` no se mira: ahí lo que ordena es `valor`.
   */
  ordenable?: boolean;
  /** Columna de acciones: ocupa sitio, no anuncia título. */
  soloAcciones?: boolean;
  /**
   * Dónde cae esta columna en la tarjeta de móvil.
   *
   * Por omisión: la primera columna que no es de acciones es el `titular`, las
   * de acciones van al `pie` de la tarjeta, y el resto son pares
   * etiqueta/valor. Esto solo hace falta cuando ese reparto no es el bueno —
   * por ejemplo para esconder en móvil una columna que allí no aporta.
   */
  movil?: "titular" | "pie" | "oculta";
};

type Direccion = "asc" | "desc";

export type Orden = { clave: string; direccion: Direccion };

/**
 * Paginación y orden que manda el servidor.
 *
 * Cuando esto viene, `TablaDatos` NO corta ni ordena: pinta `filas` tal cual y
 * se limita a pedir la página o el orden siguiente. Es el único modo en el que
 * `filas.length` y `total` son números distintos.
 */
type ControlComun = {
  orden?: Orden | null;
  /** Sin esto ninguna cabecera es pulsable, aunque la columna sea `ordenable`. */
  onOrden?: (orden: Orden) => void;
};

export type ControlPaginas = ControlComun & {
  modo?: "paginas";
  pagina: number;
  tamano: number;
  /** Cuántos registros hay en total, no cuántos llegaron en esta página. */
  total: number;
  onPagina: (pagina: number) => void;
  onTamano?: (tamano: number) => void;
};

/**
 * Listados que avanzan por cursor: los de CX.
 *
 * Ahí el backend no sabe decir cuántos hay en total, solo si queda algo
 * después. No es una limitación que se pueda esconder: sin total no hay
 * «última página» ni «mostrando 20 de 340», y fingirlo sería mentir en
 * pantalla. La tabla es la misma; lo que cambia es la barra de abajo.
 */
export type ControlCursor = ControlComun & {
  modo: "cursor";
  /** Solo para decir en qué página va. No se puede saltar a ella. */
  pagina: number;
  hayAnterior: boolean;
  haySiguiente: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
};

export type ControlServidor = ControlPaginas | ControlCursor;

/**
 * Compara con la intención correcta según el tipo.
 *
 * Los números se comparan como números —`"10" < "9"` en texto, y una tabla que
 * ordena así se lee como averiada— y los textos con `localeCompare` en español,
 * que es lo que pone la Ñ y los acentos donde un hispanohablante los busca.
 * Los vacíos van SIEMPRE al final, suba o baje el orden: lo que falta no es ni
 * lo mayor ni lo menor, es lo que no se sabe.
 */
function comparar(a: unknown, b: unknown): number {
  const aVacio = a === null || a === undefined || a === "";
  const bVacio = b === null || b === undefined || b === "";
  if (aVacio && bVacio) return 0;
  if (aVacio) return 1;
  if (bVacio) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

/** Reparto de las columnas en la tarjeta de móvil. */
function repartirMovil<T>(columnas: ColumnaTabla<T>[]) {
  const titulares: ColumnaTabla<T>[] = [];
  const acciones: ColumnaTabla<T>[] = [];
  const detalle: ColumnaTabla<T>[] = [];
  let hayTitular = false;

  for (const c of columnas) {
    if (c.movil === "oculta") continue;
    if (c.movil === "titular") {
      titulares.push(c);
      hayTitular = true;
    } else if (c.movil === "pie" || c.soloAcciones) {
      acciones.push(c);
    } else if (!hayTitular) {
      titulares.push(c);
      hayTitular = true;
    } else {
      detalle.push(c);
    }
  }

  return { titulares, acciones, detalle };
}

export function TablaDatos<T>({
  filas,
  columnas,
  claveFila,
  ordenInicial,
  tamanoPaginaInicial = 25,
  opcionesTamano,
  etiquetaElemento = "registros",
  etiquetaTabla,
  cabecera,
  control,
  cargando = false,
  vacio,
}: {
  filas: T[];
  columnas: ColumnaTabla<T>[];
  claveFila: (fila: T) => string;
  /** Columna por la que se entra ordenado. Sin esto, se respeta el orden del servidor. */
  ordenInicial?: { clave: string; direccion?: Direccion };
  tamanoPaginaInicial?: number;
  opcionesTamano?: number[];
  etiquetaElemento?: string;
  /** Nombre accesible de la tabla. Obligatorio si hay más de una en la pantalla. */
  etiquetaTabla?: string;
  /**
   * Buscador, filtros o lo que gobierne el listado. Va DENTRO de la carcasa y
   * encima de la tabla, no suelto en la página: lo que filtra una tabla
   * pertenece visualmente a esa tabla.
   */
  cabecera?: ReactNode;
  /** Presente = pagina y ordena el servidor. Ausente = lo hace el cliente. */
  control?: ControlServidor;
  cargando?: boolean;
  /** Qué decir cuando no hay ni una fila. Sin esto se dice lo mínimo. */
  vacio?: ReactNode;
}) {
  const [ordenPropio, setOrdenPropio] = useState<Orden | null>(
    ordenInicial ? { clave: ordenInicial.clave, direccion: ordenInicial.direccion ?? "asc" } : null
  );
  const [paginaPropia, setPaginaPropia] = useState(1);
  const [tamanoPropio, setTamanoPropio] = useState(tamanoPaginaInicial);

  const servidor = Boolean(control);
  const cursor = control?.modo === "cursor" ? control : null;
  const paginado = control && control.modo !== "cursor" ? control : null;
  const orden = servidor ? control?.orden ?? null : ordenPropio;

  const ordenadas = useMemo(() => {
    if (servidor || !ordenPropio) return filas;
    const col = columnas.find((c) => c.clave === ordenPropio.clave);
    if (!col?.valor) return filas;
    const signo = ordenPropio.direccion === "asc" ? 1 : -1;
    // Copia antes de ordenar: `sort` muta, y mutar el array de la consulta deja
    // el orden del servidor destruido para quien lo lea después.
    return [...filas].sort((a, b) => signo * comparar(col.valor!(a), col.valor!(b)));
  }, [servidor, filas, columnas, ordenPropio]);

  // La página se recorta contra el total en vez de reiniciarse: quien borra la
  // última fila de la página 4 espera quedarse en la 3, no volver a la 1.
  const paginas = Math.max(1, Math.ceil(ordenadas.length / tamanoPropio));
  const paginaCliente = Math.min(paginaPropia, paginas);

  const total = paginado ? paginado.total : ordenadas.length;
  const pagina = control ? control.pagina : paginaCliente;
  const tamano = paginado ? paginado.tamano : tamanoPropio;
  // Con `control`, las filas YA vienen cortadas por el servidor. Cortarlas otra
  // vez aquí es el error que convierte la página 3 en las primeras 25 filas de
  // la página 3.
  const visibles = servidor
    ? filas
    : ordenadas.slice((paginaCliente - 1) * tamanoPropio, paginaCliente * tamanoPropio);

  function esOrdenable(c: ColumnaTabla<T>): boolean {
    return servidor ? Boolean(c.ordenable && control?.onOrden) : Boolean(c.valor);
  }

  function alternar(clave: string) {
    const direccion: Direccion =
      orden?.clave === clave && orden.direccion === "asc" ? "desc" : "asc";
    if (servidor) {
      control?.onOrden?.({ clave, direccion });
      return;
    }
    setOrdenPropio({ clave, direccion });
    setPaginaPropia(1);
  }

  function irAPagina(n: number) {
    if (paginado) paginado.onPagina(n);
    else setPaginaPropia(n);
  }

  function cambiarTamano(n: number) {
    if (paginado) {
      paginado.onTamano?.(n);
      return;
    }
    setTamanoPropio(n);
    setPaginaPropia(1);
  }

  // `useIsMobile` ya existía (lo usa la barra lateral) y corta en el mismo
  // ancho que `md`. Se reutiliza en vez de añadir una segunda idea de «móvil»,
  // que es justo cómo aparecen dos definiciones de lo mismo.
  const esMovil = useIsMobile();

  const { titulares, acciones, detalle } = repartirMovil(columnas);
  /* Los primeros 300 ms de espera no se pintan. Por debajo de ese umbral el
     ojo lee la aparicion y la desaparicion del esqueleto como un parpadeo, y
     un parpadeo se percibe como un fallo grafico y no como una respuesta.
     Esta linea le da esa regla a TODAS las pantallas que usan la tabla. */
  const esqueletoVisible = useCargaVisible(cargando);
  const sinFilas = !cargando && visibles.length === 0;
  // Ni una fila de esqueleto —una tabla vacía parpadeando— ni treinta: las que
  // se van a ver sin desplazar la página.
  const filasEsqueleto = Math.min(Math.max(tamano, 1), 6);

  /**
   * El mensaje de «no hay nada» se pinta UNA vez y sustituye a la tabla y a
   * las tarjetas, no una vez en cada una.
   *
   * No es un detalle: la tabla y las tarjetas son la misma lista en dos
   * formas, y una de las dos siempre está oculta por CSS, pero las dos están
   * en el DOM. Repetir ahí el texto deja dos «No hay áreas para este filtro.»
   * en la página, que es exactamente lo que una prueba con `getByText`
   * encuentra duplicado y lo que un buscador de texto del navegador cuenta
   * dos veces.
   */
  const bloqueVacio = (
    <p className="px-5 py-14 text-center text-sm text-muted-foreground">
      {vacio ?? "No hay nada que mostrar."}
    </p>
  );

  return (
    <TablaPanel
      cabecera={cabecera}
      aria-busy={cargando || undefined}
      /* El esqueleto no se oye. Para quien usa un lector de pantalla, una
         tabla que se rellena de cajas grises es una tabla que no dice nada, y
         `aria-busy` por sí solo no se anuncia. Esta línea es el equivalente
         hablado del esqueleto, y es lo que antes decía cada pantalla por su
         cuenta con su propio «Cargando empresas…». */
      anuncio={
        /* `aria-live` SIN `role="status"`, y a propósito.
         *
         * La región tiene que existir antes de que cambie su texto: si se
         * inserta ya con el mensaje dentro, varios lectores de pantalla no lo
         * leen. Pero una región permanente con `role="status"` en CADA tabla
         * deja la pantalla llena de elementos con ese rol, y entonces el aviso
         * propio de la pantalla —«ninguna constancia coincide»— ya no se puede
         * señalar sin ambigüedad. `aria-live` da el comportamiento; el rol solo
         * añadía el estorbo. */
        <p aria-live="polite" className="sr-only">
          {cargando ? `Cargando ${etiquetaElemento}…` : ""}
        </p>
      }
      movil={
        /* Las tarjetas SUSTITUYEN a la tabla, no se esconden a su lado. Y van
           fuera de la caja de desplazamiento horizontal: una tarjeta no
           desborda de lado. */
        !esMovil || sinFilas ? null : (
        <div className="grid gap-3 p-4">
          {cargando ? (esqueletoVisible &&
            Array.from({ length: 3 }, (_, i) => (
              <div key={`esqueleto-${i}`} className="rounded-xl border border-border p-4">
                <Esqueleto className="h-5 w-2/3" />
                <Esqueleto className="mt-3 h-4 w-full" />
                <Esqueleto className="mt-2 h-4 w-4/5" />
              </div>
            ))
          ) : (
            visibles.map((fila) => (
              <article
                key={claveFila(fila)}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {titulares.map((c) => (
                      <Fragment key={c.clave}>{c.celda(fila)}</Fragment>
                    ))}
                  </div>
                  {acciones.length ? (
                    <div className="flex shrink-0 items-center gap-1">
                      {acciones.map((c) => (
                        <Fragment key={c.clave}>{c.celda(fila)}</Fragment>
                      ))}
                    </div>
                  ) : null}
                </div>
                {detalle.length ? (
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border/70 pt-3 text-sm">
                    {detalle.map((c) => (
                      <Fragment key={c.clave}>
                        <dt className="font-heading text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {c.titulo}
                        </dt>
                        <dd className="text-right text-foreground">{c.celda(fila)}</dd>
                      </Fragment>
                    ))}
                  </dl>
                ) : null}
              </article>
            ))
          )}
        </div>
        )
      }
      /* Se pinta siempre, tambien con una sola pagina: es donde se lee cuantos
         registros hay en total, y esconderla obliga a contar filas a ojo. Va
         como `pie` y no como hijo para que no se desplace de lado con las
         columnas en una tabla ancha. */
      pie={
        cursor ? (
          <CursorPagination
            page={cursor.pagina}
            mostrados={cargando ? undefined : visibles.length}
            hayAnterior={cursor.hayAnterior}
            haySiguiente={cursor.haySiguiente}
            onAnterior={cursor.onAnterior}
            onSiguiente={cursor.onSiguiente}
            itemLabel={etiquetaElemento}
          />
        ) : (
          <StandardPagination
            page={pagina}
            pageSize={tamano}
            total={total}
            pageSizeOptions={opcionesTamano}
            itemLabel={etiquetaElemento}
            onPageChange={irAPagina}
            /* El selector de filas por página desaparece si el servidor manda y
               no ofrece cambiarlo: un control que no hace nada es peor que
               ninguno. */
            onPageSizeChange={paginado && !paginado.onTamano ? undefined : cambiarTamano}
          />
        )
      }
    >
      {sinFilas ? (
        bloqueVacio
      ) : (
      <table className="w-full min-w-full caption-bottom text-left text-sm" aria-label={etiquetaTabla}>
        <TablaHead>
          <tr>
            {columnas.map((c) => {
              const activa = orden?.clave === c.clave;
              const derecha = c.alineacion === "derecha";
              return (
                <TableHead
                  key={c.clave}
                  align={derecha ? "right" : "left"}
                  // `aria-sort` es lo que hace que un lector de pantalla diga
                  // «ordenado de forma ascendente» en vez de leer un icono.
                  aria-sort={
                    activa ? (orden!.direccion === "asc" ? "ascending" : "descending") : undefined
                  }
                >
                  {c.soloAcciones ? (
                    <span className="sr-only">{c.titulo}</span>
                  ) : esOrdenable(c) ? (
                    <button
                      type="button"
                      onClick={() => alternar(c.clave)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md py-0.5 transition-colors duration-rel-micro ease-rel-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                        activa && "text-foreground",
                        derecha && "flex-row-reverse"
                      )}
                    >
                      {c.titulo}
                      {activa ? (
                        orden!.direccion === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    c.titulo
                  )}
                </TableHead>
              );
            })}
          </tr>
        </TablaHead>

        <TablaBody>
          {cargando ? (esqueletoVisible &&
            /* Esqueleto con la forma de la tabla, no un texto «Cargando…»: el
               encabezado y el alto de fila ya están puestos, así que cuando
               llegan los datos no salta nada de sitio. */
            Array.from({ length: filasEsqueleto }, (_, i) => (
              <TableRow key={`esqueleto-${i}`}>
                {columnas.map((c) => (
                  <TableCell key={c.clave}>
                    <Esqueleto className={cn("h-4", c.soloAcciones ? "ml-auto w-16" : "w-3/4")} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            visibles.map((fila) => (
              <TableRow key={claveFila(fila)}>
                {columnas.map((c) => (
                  <TableCell key={c.clave} align={c.alineacion === "derecha" ? "right" : "left"}>
                    {c.celda(fila)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TablaBody>
      </table>
      )}
    </TablaPanel>
  );
}

/**
 * La celda principal de una fila: el nombre, enlazado, con su línea de apoyo.
 *
 * Se usa en TODAS las tablas para que el nombre sea siempre la forma de entrar
 * al detalle. Que en una tabla se entre por el nombre y en otra por un botón al
 * final de la fila obliga a aprender cada pantalla por separado.
 *
 * `a` es una ruta y es lo que se debe usar: un enlace se abre en otra pestaña,
 * se copia y se comparte. `alAbrir` existe SOLO para las filas que todavía no
 * tienen página propia —Participantes, Empresas— y abren un panel lateral. No
 * es una alternativa de estilo: cuando esa fila tenga ruta, pasa a `a`.
 *
 * Sin `a` ni `alAbrir` es texto plano, y eso también hace falta: en un listado
 * que se consulta y no se abre —auditoría, movimientos de crédito— el nombre de
 * la fila no debe fingir que lleva a alguna parte. Antes cada una de esas
 * pantallas resolvía ese caso con su propio `<div>` en negrita.
 */
type CeldaPrincipalProps = {
  titulo: ReactNode;
  apoyo?: ReactNode;
} & (
  | { a: string; alAbrir?: never }
  | { a?: never; alAbrir: () => void }
  | { a?: never; alAbrir?: never }
);

const CLASES_PRINCIPAL =
  "rounded-md text-left font-bold text-foreground underline-offset-4 transition-colors duration-rel-micro ease-rel-out hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

export function CeldaPrincipal({ a, alAbrir, titulo, apoyo }: CeldaPrincipalProps) {
  return (
    <>
      {a ? (
        <Link to={a} className={CLASES_PRINCIPAL}>
          {titulo}
        </Link>
      ) : alAbrir ? (
        <button type="button" onClick={alAbrir} className={CLASES_PRINCIPAL}>
          {titulo}
        </button>
      ) : (
        <span className="font-bold text-foreground">{titulo}</span>
      )}
      {apoyo ? <p className="mt-0.5 text-xs text-muted-foreground">{apoyo}</p> : null}
    </>
  );
}
