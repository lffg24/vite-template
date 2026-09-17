// src/features/participacion/ReproductorRecurso.tsx · D-05 y D-06
//
// El material de una lección de video o de documento.
//
// Tres decisiones que conviene no tener que volver a discutir:
//
//   1. **La URL de incrustación se deriva de la que guardó quien redacta.**
//      Nadie pega una dirección de embed: pega la del navegador, la de
//      compartir, o la que copió de la barra. Convertirla es trabajo de la
//      pantalla, y está en una función pura para poder probar cada forma.
//
//   2. **Siempre hay un enlace directo visible**, aunque el incrustado funcione.
//      Un `X-Frame-Options: DENY` del proveedor deja el marco en blanco sin
//      avisar de nada, y un participante mirando un rectángulo vacío no tiene
//      forma de saber que el material sí existe. El enlace es la salida.
//
//   3. **No se inventa un porcentaje.** De un incrustado de terceros no se puede
//      medir cuánto se reprodujo sin la API del proveedor. La lección se da por
//      vista cuando la persona lo confirma, y la pantalla lo dice con esas
//      palabras en vez de pintar una barra que no mide nada.

import { ExternalLink } from "lucide-react";

import type { RecursoPublico } from "@/types/participacion";

/**
 * La dirección que se puede meter en un `iframe`, o `null` si no la hay.
 *
 * Devuelve `null` en vez de la URL original cuando no sabe convertirla: meter
 * una página cualquiera en un marco casi siempre acaba en blanco por política
 * del sitio, y un marco vacío es peor que un enlace honesto.
 */
export function urlIncrustable(recurso: RecursoPublico): string | null {
  let u: URL;
  try {
    u = new URL(recurso.url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;

  const host = u.hostname.toLowerCase();

  if (recurso.proveedor === "YOUTUBE") {
    // Tres formas de la misma dirección, y las tres llegan pegadas de verdad:
    // la del navegador, la de «compartir» y la de un enlace de lista.
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : u.searchParams.get("v") ?? (u.pathname.startsWith("/embed/") ? u.pathname.slice(7) : "");
    return id
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?playsinline=1&rel=0`
      : null;
  }

  if (recurso.proveedor === "VIMEO") {
    const id = u.pathname.split("/").filter(Boolean).pop() ?? "";
    return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  if (recurso.proveedor === "DRIVE") {
    // `/file/d/<id>/view` → `/preview`. Es la única forma de Drive que se
    // incrusta; un enlace de carpeta o de «cualquiera con el enlace» sin ese
    // formato no, y para eso está el enlace directo.
    const partes = u.pathname.split("/").filter(Boolean);
    const i = partes.indexOf("d");
    const id = i >= 0 ? partes[i + 1] : undefined;
    return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : null;
  }

  return null;
}

export function ReproductorRecurso({
  recurso,
  tipo,
}: {
  recurso: RecursoPublico;
  tipo: string;
}) {
  const incrustable = urlIncrustable(recurso);
  const esVideo = tipo === "VIDEO";

  return (
    <div className="space-y-3">
      {incrustable ? (
        <div
          className={
            esVideo
              ? "aspect-video w-full overflow-hidden rounded-rel-card bg-rel-dark"
              : "h-[60vh] min-h-[320px] w-full overflow-hidden rounded-rel-card border border-rel-border bg-rel-surface-subtle"
          }
        >
          <iframe
            src={incrustable}
            title={recurso.titulo}
            className="h-full w-full"
            // `allow-same-origin` junto a `allow-scripts` hace falta para que
            // los reproductores de los proveedores funcionen. Lo que NO se
            // concede es `allow-top-navigation`: sin eso el material no puede
            // sacar al participante de su curso.
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
            // YouTube rechaza el reproductor con error 153 cuando el navegador
            // elimina por completo el origen. Solo se comparte el origen, no la
            // ruta ni el token del enlace público.
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="rounded-rel-card border border-dashed border-rel-border-strong bg-rel-surface-subtle p-6 text-center">
          <p className="font-rel-body text-sm text-rel-muted">
            Este material se abre en una pestaña aparte.
          </p>
        </div>
      )}

      <a
        href={recurso.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-rel-control border border-rel-border bg-rel-surface px-4 py-2 text-sm font-bold text-rel-dark hover:bg-rel-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        {esVideo ? "Ver el video en su sitio" : "Abrir el documento"}
      </a>
    </div>
  );
}
