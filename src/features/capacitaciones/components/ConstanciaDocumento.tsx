// src/features/capacitaciones/components/ConstanciaDocumento.tsx
//
// La constancia, compuesta al mostrarla. La misma pieza sirve al participante
// (D-09) y a la administración: un documento, una plantilla.
//
// ## Por qué no hay un archivo guardado
//
// Guardar un PDF por constancia duplicaría el dato: el snapshot ya tiene
// congelado todo lo que el documento dice. Dos copias de la misma verdad acaban
// discrepando el día que la plantilla cambie, y además cuestan un archivo por
// persona y por curso, para siempre. Se compone desde el snapshot y el navegador
// lo imprime; es reproducible porque lo que lo determina está congelado.
//
// ## Lo que la plantilla NO puede decidir
//
// **El tipo de documento y el texto legal salen del snapshot.** El servidor
// congela «CONSTANCIA DE ASISTENCIA» y el aviso de que no certifica
// competencias. Una plantilla se cambia mañana; si esos textos vivieran aquí,
// reescribirían lo que dicen los documentos de ayer. Por eso el diseño dice
// «asistencia» aunque el boceto dijera «participación»: lo que se imprime es lo
// que se emitió.
//
// ## El adorno es CSS y SVG, no imágenes
//
// Un documento se imprime. Las formas en CSS y el QR en SVG salen nítidos a la
// resolución del papel; un PNG de 640 px se ve blando y un QR borroso no se lee.

import { Award } from "lucide-react";

import evaLogoColor from "@/assets/eva-logo-color.png";
import AbrilWordmark from "@/components/brand/AbrilWordmark";
import { formatearFecha } from "@/features/capacitaciones/formato";
import { CodigoQr } from "@/shared/ui/CodigoQr";
import { Pill } from "@/shared/ui/Pill";
import { Illustration } from "@/shared/ui/illustration";
import type { ConstanciaImprimible } from "@/types/constancia";

/** Minutos a la forma en que se dice una duración de formación. */
export function duracionFormacion(minutos: number | null | undefined): string | null {
  if (!minutos || minutos <= 0) return null;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} minutos`;
  if (resto === 0) return horas === 1 ? "1 hora" : `${horas} horas`;
  return `${horas} h ${resto} min`;
}

/** «CONSTANCIA DE ASISTENCIA» → «Constancia de asistencia», para la píldora. */
function enFrase(texto: string): string {
  const bajo = texto.toLocaleLowerCase("es-CO");
  return bajo.charAt(0).toLocaleUpperCase("es-CO") + bajo.slice(1);
}

export function ConstanciaDocumento({
  constancia,
  urlVerificacion,
}: {
  constancia: ConstanciaImprimible;
  /** A dónde lleva el QR. Lo arma quien llama porque conoce el origen. */
  urlVerificacion: string;
}) {
  const s = constancia.snapshot ?? {};
  const p = s.participante ?? {};
  const curso = s.curso ?? {};
  const anulada = constancia.estado === "ANULADA";
  const horas = duracionFormacion(curso.intensidad_horaria_min);
  const tipo = s.documento ?? "CONSTANCIA";
  const nombre = [p.nombres, p.apellidos].filter(Boolean).join(" ") || "—";

  return (
    <article
      // `hoja-constancia`: la hoja de impresión deja solo esto en la página.
      className="hoja-constancia relative mx-auto w-full max-w-4xl overflow-hidden rounded-rel-panel border border-rel-border bg-white text-rel-dark shadow-card print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      aria-label={`${enFrase(tipo)} ${constancia.codigo_verificacion}`}
    >
      <Illustration
        name="certificateCornerTop"
        size="full"
        decorative
        className="pointer-events-none absolute -right-20 -top-20 w-72 opacity-70"
      />
      <Illustration
        name="certificateCornerBottom"
        size="full"
        decorative
        className="pointer-events-none absolute -bottom-28 -left-24 w-80 opacity-60"
      />

      <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_12rem]">
        {/* --- el cuerpo --- */}
        <div className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-4">
            {/* El mismo sello de marca que la cabecera del participante. */}
            <div className="flex items-center gap-3">
              <img src={evaLogoColor} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
              <AbrilWordmark
                className="font-rel-heading text-2xl font-black tracking-tight text-rel-dark"
                accentClassName="text-rel-primary"
              />
            </div>
            <Pill tono="marca" punto={false}>
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              {enFrase(tipo)}
            </Pill>
          </header>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-rel-muted">
            Otorga la presente
          </p>
          <p className="font-rel-heading text-4xl font-black uppercase tracking-tight sm:text-5xl">
            Constancia
          </p>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-rel-muted">A</p>
          <h2 className="mt-1 break-words border-b border-rel-border pb-3 font-rel-heading text-2xl font-black tracking-tight sm:text-3xl">
            {nombre}
          </h2>
          {p.numero_documento ? (
            <p className="mt-2 text-sm text-rel-muted">
              {p.tipo_documento} {p.numero_documento}
              {p.cargo ? ` · ${p.cargo}` : ""}
            </p>
          ) : null}

          <p className="mt-6 text-sm text-rel-muted">Por su asistencia a la formación</p>
          <h3 className="mt-1 break-words font-rel-heading text-lg font-black uppercase tracking-tight sm:text-xl">
            {curso.titulo ?? "—"}
          </h3>
          <p className="mt-1 text-sm text-rel-muted">
            {[
              s.empresa?.nombre
                ? `${s.empresa.nombre}${s.empresa.nit ? ` · NIT ${s.empresa.nit}` : ""}`
                : null,
              s.completada_en ? `Realizada el ${formatearFecha(s.completada_en)}` : null,
              horas ? `Intensidad: ${horas}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {/* --- lo legal: congelado, dice lo que acredita y lo que NO --- */}
          <p className="mt-6 max-w-xl text-xs leading-5 text-rel-muted">
            {s.aviso ??
              "Constancia de asistencia a formación interna. No certifica competencias laborales."}
            {constancia.vence_el ? ` Vigente hasta ${formatearFecha(constancia.vence_el)}.` : ""}
          </p>
          {s.identidad?.aviso ? (
            <p className="mt-1 max-w-xl text-xs leading-5 text-rel-warning">{s.identidad.aviso}</p>
          ) : null}

          {/* --- quién emite --- */}
          <footer className="mt-8">
            <p className="font-rel-heading text-sm font-bold">ABRIL-360</p>
            <p className="text-xs text-rel-muted">
              Emitida el {formatearFecha(constancia.emitida_en)}
              {curso.responsable_contenido
                ? ` · Contenido a cargo de ${curso.responsable_contenido}`
                : ""}
            </p>
          </footer>
        </div>

        {/* --- verificación --- */}
        <aside className="flex flex-col items-start gap-3 border-rel-border md:items-center md:border-l md:pl-8 md:text-center">
          <CodigoQr
            valor={urlVerificacion}
            etiqueta={`Código QR para verificar la constancia ${constancia.codigo_verificacion}`}
            className="h-36 w-36 rounded-rel-control border border-rel-border p-1"
          />
          <div>
            <p className="text-xs text-rel-muted">Folio</p>
            <p className="font-rel-heading text-lg font-black tabular-nums">{constancia.folio}</p>
          </div>
          <div>
            <p className="text-xs text-rel-muted">Código de verificación</p>
            <p className="font-mono text-sm font-bold tracking-wider text-rel-accent">
              {constancia.codigo_verificacion}
            </p>
          </div>
          <p className="text-xs leading-5 text-rel-muted">
            Escanea el código o escríbelo en la página de verificación.
          </p>
        </aside>
      </div>

      {/* --- anulada: se dice ENCIMA del documento, y también en texto --- */}
      {anulada ? (
        <>
          <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
            <p className="rotate-[-18deg] rounded-rel-card border-4 border-rel-danger bg-white/70 px-8 py-3 font-rel-heading text-5xl font-black uppercase tracking-widest text-rel-danger">
              Anulada
            </p>
          </div>
          <p className="sr-only">Esta constancia fue anulada y ya no es válida.</p>
        </>
      ) : null}
    </article>
  );
}
