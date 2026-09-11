// src/shared/ui/TablaDatos.tsx
//
// La tabla de ABRIL-360: carcasa, ordenamiento, paginación y celda principal
// enlazada, en un solo sitio.
//
// Existe porque cada pantalla estaba resolviendo lo mismo por su cuenta y
// ninguna igual: una ordenaba en el cliente y otra no ordenaba, una paginaba
// con `StandardPagination` y otra pintaba la lista entera, y el nombre de la
// fila era texto plano en unas y un botón en otras. El resultado es que dos
// tablas del mismo producto se operan distinto, y eso el usuario lo nota antes
// que cualquier detalle de color.
//
// Decisiones que conviene no volver a discutir:
//
//   - **Ordena y pagina en el cliente.** Es correcto mientras el listado quepa
//     entero en la respuesta, que es el caso de todo lo que hay hoy. El día que
//     un endpoint pagine de verdad, esto se sustituye por el mismo componente
//     con los datos ya cortados — por eso `total` y `pagina` son calculables
//     desde fuera si hiciera falta, y por eso el ordenamiento sale de una
//     función `valor` y no de leer el DOM.
//   - **La paginación es `StandardPagination`**, la que ya usa Psicosocial. No
//     se reimplementa: si hay una sola paginación en el proyecto, arreglarla
//     una vez la arregla en todas partes.
//   - **La celda principal es un enlace**, no un botón ni texto. Un enlace se
//     puede abrir en otra pestaña, copiar y compartir; un `onClick` no. Es la
//     diferencia entre una tabla que se consulta y una que se sufre.

import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { StandardPagination } from "@/components/common/StandardPagination";
import { TablaBody, TablaHead, TablaPanel } from "./Panel";

export type ColumnaTabla<T> = {
  /** Identifica la columna al ordenar. Único dentro de la tabla. */
  clave: string;
  titulo: string;
  alineacion?: "izquierda" | "derecha";
  /** Qué se pinta. */
  celda: (fila: T) => ReactNode;
  /**
   * Con qué se ordena. Su presencia es lo que hace ordenable la columna.
   *
   * Es un valor y no un comparador a propósito: un comparador por columna
   * acaba con seis criterios de desempate distintos en la misma tabla.
   */
  valor?: (fila: T) => string | number | null | undefined;
  /** Columna de acciones: ocupa sitio, no anuncia título. */
  soloAcciones?: boolean;
};

type Direccion = "asc" | "desc";

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

export function TablaDatos<T>({
  filas,
  columnas,
  claveFila,
  ordenInicial,
  tamanoPaginaInicial = 25,
  etiquetaElemento = "registros",
  etiquetaTabla,
}: {
  filas: T[];
  columnas: ColumnaTabla<T>[];
  claveFila: (fila: T) => string;
  /** Columna por la que se entra ordenado. Sin esto, se respeta el orden del servidor. */
  ordenInicial?: { clave: string; direccion?: Direccion };
  tamanoPaginaInicial?: number;
  etiquetaElemento?: string;
  /** Nombre accesible de la tabla. Obligatorio si hay más de una en la pantalla. */
  etiquetaTabla?: string;
}) {
  const [orden, setOrden] = useState<{ clave: string; direccion: Direccion } | null>(
    ordenInicial ? { clave: ordenInicial.clave, direccion: ordenInicial.direccion ?? "asc" } : null
  );
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(tamanoPaginaInicial);

  const ordenadas = useMemo(() => {
    if (!orden) return filas;
    const col = columnas.find((c) => c.clave === orden.clave);
    if (!col?.valor) return filas;
    const signo = orden.direccion === "asc" ? 1 : -1;
    // Copia antes de ordenar: `sort` muta, y mutar el array de la consulta deja
    // el orden del servidor destruido para quien lo lea después.
    return [...filas].sort((a, b) => signo * comparar(col.valor!(a), col.valor!(b)));
  }, [filas, columnas, orden]);

  // La página se recorta contra el total en vez de reiniciarse: quien borra la
  // última fila de la página 4 espera quedarse en la 3, no volver a la 1.
  const paginas = Math.max(1, Math.ceil(ordenadas.length / tamano));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = ordenadas.slice((paginaActual - 1) * tamano, paginaActual * tamano);

  function alternar(clave: string) {
    setOrden((previo) =>
      previo?.clave === clave
        ? { clave, direccion: previo.direccion === "asc" ? "desc" : "asc" }
        : { clave, direccion: "asc" }
    );
    setPagina(1);
  }

  return (
    <TablaPanel>
      <table className="min-w-full text-left text-sm" aria-label={etiquetaTabla}>
        <TablaHead>
          <tr>
            {columnas.map((c) => {
              const activa = orden?.clave === c.clave;
              const derecha = c.alineacion === "derecha";
              return (
                <th
                  key={c.clave}
                  scope="col"
                  className={cn("px-4 py-3", derecha && "text-right")}
                  // `aria-sort` es lo que hace que un lector de pantalla diga
                  // «ordenado de forma ascendente» en vez de leer un icono.
                  aria-sort={activa ? (orden.direccion === "asc" ? "ascending" : "descending") : undefined}
                >
                  {c.soloAcciones ? (
                    <span className="sr-only">{c.titulo}</span>
                  ) : c.valor ? (
                    <button
                      type="button"
                      onClick={() => alternar(c.clave)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-rel-control py-0.5 uppercase tracking-wide transition-colors hover:text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
                        activa && "text-rel-dark",
                        derecha && "flex-row-reverse"
                      )}
                    >
                      {c.titulo}
                      {activa ? (
                        orden.direccion === "asc" ? (
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
                </th>
              );
            })}
          </tr>
        </TablaHead>

        <TablaBody>
          {visibles.map((fila) => (
            <tr key={claveFila(fila)} className="hover:bg-rel-surface-subtle">
              {columnas.map((c) => (
                <td
                  key={c.clave}
                  className={cn("px-4 py-4", c.alineacion === "derecha" && "text-right")}
                >
                  {c.celda(fila)}
                </td>
              ))}
            </tr>
          ))}
        </TablaBody>
      </table>

      {/* Se pinta siempre, también con una sola página: es donde se lee cuántos
          registros hay en total, y esconderla obliga a contar filas a ojo. */}
      <StandardPagination
        page={paginaActual}
        pageSize={tamano}
        total={ordenadas.length}
        itemLabel={etiquetaElemento}
        onPageChange={setPagina}
        onPageSizeChange={(n) => {
          setTamano(n);
          setPagina(1);
        }}
      />
    </TablaPanel>
  );
}

/**
 * La celda principal de una fila: el nombre, enlazado, con su línea de apoyo.
 *
 * Se usa en TODAS las tablas para que el nombre sea siempre la forma de entrar
 * al detalle. Que en una tabla se entre por el nombre y en otra por un botón al
 * final de la fila obliga a aprender cada pantalla por separado.
 */
export function CeldaPrincipal({
  a,
  titulo,
  apoyo,
}: {
  /** Ruta del detalle. */
  a: string;
  titulo: string;
  apoyo?: ReactNode;
}) {
  return (
    <>
      <Link
        to={a}
        className="font-black text-rel-dark underline-offset-2 hover:text-rel-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
      >
        {titulo}
      </Link>
      {apoyo ? <p className="mt-0.5 text-xs text-rel-muted">{apoyo}</p> : null}
    </>
  );
}
