// src/shared/ui/Esqueleto.tsx
//
// El sistema de carga de ABRIL360.
//
// ## Por qué un sistema y no «esqueletos en todas partes»
//
// La petición fue «esqueletos en todas las pantallas», y la cita que la
// acompañaba es cierta: *un giro hace esperar, un esqueleto hace anticipar*.
// Pero la misma biblioteca de patrones de la que viene esa frase dice, en el
// patrón de al lado, que **el esqueleto por defecto en todas partes es la
// señal de una interfaz perezosa**. Las dos cosas son verdad, y la diferencia
// está en qué se sabe de la espera:
//
//   - **Se sabe la FORMA** (una lista, una tabla, una ficha) y la espera pasa
//     de ~300 ms → **esqueleto**. Previsualiza la maqueta que va a llegar, y
//     el cerebro empieza a leerla antes de que llegue el dato.
//   - **No se sabe la forma** y la espera es corta (un botón guardando) →
//     **giro**, y nunca a pantalla completa: un giro eterno sin contexto se
//     lee como congelado.
//   - **Se sabe el PORCENTAJE** y pasa de ~3 s (una subida, una exportación)
//     → **barra de progreso** con tiempo restante.
//   - **La acción es del usuario y es reversible** (marcar, guardar) → no se
//     muestra nada: se pinta el resultado y se concilia por detrás.
//   - **Menos de ~300 ms → NADA.** Esto es lo que casi nadie hace y lo que más
//     se nota. Un destello de esqueleto se percibe como un fallo gráfico, no
//     como una respuesta. Por eso `useCargaVisible` existe y por eso
//     `ZonaCargando` la usa siempre.
//
// ## La regla que hace que no se note el truco
//
// El esqueleto tiene que tener **las medidas del contenido real**. Uno que
// salta a otra maqueta al cargar es peor que un giro, porque promete una cosa
// y entrega otra. Por eso aquí no hay un `Esqueleto` genérico y suelto: hay
// uno por forma —texto, tabla, tarjetas, ficha— y cada uno recibe cuántas
// filas o columnas va a haber.

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Verdadero solo cuando la espera ya merece anunciarse.
 *
 * Los ~300 ms no son un número redondo: por debajo de eso el ojo registra la
 * aparición y la desaparición como un parpadeo, y un parpadeo se lee como que
 * algo se rompió. Dejar la pantalla quieta un cuarto de segundo se percibe
 * mejor que llenarla de cajas grises durante un suspiro.
 */
export function useCargaVisible(cargando: boolean, retardoMs = 300) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!cargando) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), retardoMs);
    return () => window.clearTimeout(t);
  }, [cargando, retardoMs]);

  return visible;
}

/**
 * Un bloque. La pieza con la que se construyen todas las formas de abajo.
 *
 * El barrido no es adorno: un esqueleto quieto se lee como una pantalla rota
 * y uno que recorre se lee como una pantalla en camino. Va en
 * `motion-safe`, así que quien pide menos movimiento ve el bloque quieto.
 */
export function Esqueleto({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cn("relative block overflow-hidden rounded-md bg-muted", className)}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-safe:animate-barrido dark:via-white/10" />
    </span>
  );
}

/**
 * Varias líneas de texto.
 *
 * La última sale más corta a propósito: un párrafo real no termina justo en el
 * margen derecho, y un bloque de barras todas iguales se delata como relleno.
 */
export function EsqueletoTexto({ lineas = 3, className }: { lineas?: number; className?: string }) {
  return (
    <span className={cn("block space-y-2", className)}>
      {Array.from({ length: lineas }).map((_, i) => (
        <Esqueleto key={i} className={cn("h-3.5", i === lineas - 1 && "w-2/3")} />
      ))}
    </span>
  );
}

/**
 * Un listado: cabecera y filas.
 *
 * `columnas` y `filas` vienen de la tabla que va a aparecer, no de un valor
 * cómodo: si el esqueleto trae cinco filas y llegan veinte, la página pega un
 * salto en el momento en que debería sentirse continua.
 */
export function EsqueletoTabla({
  filas = 6,
  columnas = 4,
  className,
}: {
  filas?: number;
  columnas?: number;
  className?: string;
}) {
  return (
    <span className={cn("block", className)}>
      <span className="mb-3 flex gap-4 border-b border-border pb-3">
        {Array.from({ length: columnas }).map((_, c) => (
          <Esqueleto key={c} className={cn("h-3", c === 0 ? "w-1/3" : "flex-1")} />
        ))}
      </span>
      <span className="block space-y-3">
        {Array.from({ length: filas }).map((_, f) => (
          <span
            key={f}
            className="flex items-center gap-4 motion-safe:animate-entrada"
            /* El escalonado: cada fila entra 50 ms después de la anterior. Con
               30 ms se funden en un bloque y con 100 ms la lista se arrastra. */
            style={{ animationDelay: `calc(${f} * var(--motion-stagger))` }}
          >
            {Array.from({ length: columnas }).map((_, c) => (
              <Esqueleto key={c} className={cn("h-4", c === 0 ? "w-1/3" : "flex-1")} />
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Una rejilla de tarjetas, con el alto de las que van a llegar. */
export function EsqueletoTarjetas({
  tarjetas = 4,
  alto = "h-32",
  className,
}: {
  tarjetas?: number;
  alto?: string;
  className?: string;
}) {
  return (
    <span className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: tarjetas }).map((_, i) => (
        <span
          key={i}
          className="block rounded-xl border border-border bg-surface p-4 motion-safe:animate-entrada"
          style={{ animationDelay: `calc(${i} * var(--motion-stagger))` }}
        >
          <Esqueleto className="h-3 w-1/2" />
          <Esqueleto className={cn("mt-3", alto)} />
        </span>
      ))}
    </span>
  );
}

/**
 * Lo que envuelve a todo lo demás.
 *
 * Decide por la pantalla las dos cosas que las pantallas olvidan: no enseñar
 * nada durante los primeros 300 ms, y anunciar la espera a quien no la ve.
 * `aria-busy` más un `role="status"` es lo que hace que un lector de pantalla
 * diga «cargando» en vez de quedarse mudo sobre una región vacía.
 */
export function ZonaCargando({
  cargando,
  esqueleto,
  etiqueta = "Cargando",
  children,
}: {
  cargando: boolean;
  /** La forma de lo que viene. Sin esto no hay nada que anticipar. */
  esqueleto: ReactNode;
  etiqueta?: string;
  children: ReactNode;
}) {
  const visible = useCargaVisible(cargando);

  if (!cargando) return <>{children}</>;

  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{etiqueta}</span>
      {/* Durante los primeros 300 ms no se pinta NADA, ni esqueleto ni giro.
          Es deliberado: el destello molesta más que el cuarto de segundo. */}
      {visible ? esqueleto : null}
    </div>
  );
}
