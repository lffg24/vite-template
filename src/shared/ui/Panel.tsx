// src/shared/ui/Panel.tsx
//
// El contenedor de contenido de ABRIL-360, y la carcasa de tabla que va dentro.
//
// Mismo origen que `PageHeader`: es el marcado que Psicosocial ya usa
// (`EmpresasPsicoPage.tsx:39` y `:50-53`), extraído para poder consumirlo.
//
// ## Qué cambió en la homologación (2026-11-15)
//
// Antes este archivo definía su propia tabla —`bg-rel-surface-subtle`,
// `text-xs uppercase tracking-wide`, `divide-y`, sin realce al pasar el
// puntero— mientras `components/ui/table.tsx` definía otra con otro relleno,
// otro radio y otro realce. Dos tablas del mismo producto se operaban distinto.
//
// Ahora `TablaHead` y `TablaBody` DELEGAN en esas primitivas y la carcasa reusa
// sus clases exportadas. No queda ninguna cadena de estilos de tabla duplicada:
// `components/ui/table.tsx` es la única definición y este archivo es el
// adaptador que consume `TablaDatos`.
//
// Por qué la carcasa sigue viviendo aquí y no es `<Table>` entero: en
// `TablaDatos` la tabla comparte borde con la paginación, así que la caja tiene
// que envolver a las dos. De ahí `pie`.

import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  CLASES_CARCASA_TABLA,
  CLASES_SCROLL_TABLA,
  TableBody,
  TableHeader,
} from "@/components/ui/table";

/**
 * Contenedor de contenido. Mismos valores visuales que `Card`
 * (`components/ui/card.tsx`) —radio, borde, fondo y sombra— porque son la
 * misma caja: lo único propio es que esto es una `<section>` con título
 * opcional, que es información de estructura y no de estilo.
 */
export function Panel({
  children,
  className,
  titulo,
  descripcion,
  icono: Icono,
  accion,
}: {
  children: ReactNode;
  className?: string;
  titulo?: string;
  /**
   * La frase que explica de qué va la sección. Va bajo el título, nunca dentro
   * del cuerpo: metida en el cuerpo se lee como el primer dato de la lista.
   */
  descripcion?: ReactNode;
  /** Decorativo, a la derecha del encabezado. */
  icono?: LucideIcon;
  /** Un botón o un filtro, a la derecha. Desplaza al icono si van los dos. */
  accion?: ReactNode;
}) {
  const conEncabezado = Boolean(titulo || descripcion || accion || Icono);
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 text-card-foreground shadow-card",
        className
      )}
    >
      {conEncabezado ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo ? (
              <h2 className="font-heading text-base font-bold text-foreground">{titulo}</h2>
            ) : null}
            {descripcion ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>
            ) : null}
          </div>
          {accion ??
            (Icono ? (
              <Icono className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            ) : null)}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Carcasa de tabla: esquinas recortadas y desborde horizontal PROPIO.
 *
 * `overflow-x-auto` va en el contenedor de la tabla y no en la página: una
 * tabla ancha debe hacer scroll dentro de su caja, nunca mover el documento.
 *
 * `cabecera`, `movil` y `pie` van FUERA de esa caja de scroll y dentro del
 * borde. Antes la paginación entraba como un hijo más, así que en una tabla
 * ancha se desplazaba de lado junto a las columnas: para cambiar de página
 * había que volver a arrastrar la tabla hasta la izquierda. Lo mismo valdría
 * para un buscador o para una lista de tarjetas.
 */
export function TablaPanel({
  children,
  cabecera,
  anuncio,
  movil,
  pie,
  className,
  ...resto
}: {
  children: ReactNode;
  /** Buscador o filtros, encima de la tabla y dentro del borde. */
  cabecera?: ReactNode;
  /**
   * Lo que la tabla le dice a un lector de pantalla y no se ve: que está
   * cargando, cuántos resultados quedaron.
   *
   * Tiene sitio propio, fuera de la tabla y fuera de las tarjetas, porque si
   * fuera dentro de cualquiera de las dos quedaría escondido en el ancho en
   * que esa forma no se pinta — y un anuncio que solo funciona en un tamaño de
   * pantalla no es un anuncio.
   */
  anuncio?: ReactNode;
  /**
   * La misma lista en formato tarjeta. Cuando viene, **sustituye** a la tabla:
   * son dos formas del mismo dato y nunca se pintan las dos.
   *
   * Que una de las dos esté oculta por CSS no basta. Las dos seguirían en el
   * documento: el texto de cada fila aparecería dos veces para quien busque en
   * la página, y cada prueba que mire una fila encontraría dos. Quien decide
   * cuál toca es `useIsMobile`, con el mismo punto de corte que `md`.
   */
  movil?: ReactNode;
  pie?: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(CLASES_CARCASA_TABLA, className)} {...resto}>
      {cabecera ? <div className="border-b border-border/70 p-4">{cabecera}</div> : null}
      {anuncio ?? null}
      {movil ?? (
        /* `relative`: sin él, lo que va en posición absoluta dentro de la tabla
           —los textos solo para lector de pantalla, por ejemplo— no queda
           recortado por esta caja y alarga la página entera hacia la derecha. */
        <div className={CLASES_SCROLL_TABLA}>{children}</div>
      )}
      {/* Sin borde propio: `StandardPagination` ya dibuja el suyo, y dos
          bordes contiguos producen una linea doble de 2 px. */}
      {pie ?? null}
    </div>
  );
}

/** Encabezado de tabla de la casa. Se usa como `<thead>`. */
export function TablaHead({
  children,
  fijo,
}: {
  children: ReactNode;
  /** Mantiene el encabezado visible al desplazar un listado largo. */
  fijo?: boolean;
}) {
  return <TableHeader sticky={fijo}>{children}</TableHeader>;
}

/** Cuerpo de tabla de la casa: separadores finos, sin bordes verticales. */
export function TablaBody({ children }: { children: ReactNode }) {
  return <TableBody>{children}</TableBody>;
}
