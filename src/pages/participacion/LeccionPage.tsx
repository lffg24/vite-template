// src/pages/participacion/LeccionPage.tsx · D-06
//
// La lección nativa: bloques de texto que se recorren de uno en uno.
//
// De uno en uno y no en una página larga con scroll, y la razón no es estética.
// El progreso se guarda por bloque, así que un solo scroll no permitiría saber
// dónde quedó alguien cuando se le acaba la batería. Con bloques, cerrar la
// pestaña no pierde nada.
//
// **El servidor guarda el máximo, nunca retrocede.** Por eso volver atrás para
// releer es gratis: reenviar un número menor no borra avance.

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { guardarProgreso, leerLeccion } from "@/services/participacionService";
import type { ErrorPublico, LeccionCompleta } from "@/types/participacion";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  BotonPrincipal,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";
import { Cargando, PantallaDeError } from "@/features/participacion/Estados";

export default function LeccionPage() {
  const { leccionId = "" } = useParams<{ leccionId: string }>();
  const navegar = useNavigate();
  // Se pide SOLO esta lección. El índice ya trajo los metadatos; el texto pesa
  // y no hay razón para descargar el curso entero para leer una parte.
  const consulta = useConsulta<LeccionCompleta>(() => leerLeccion(leccionId), [leccionId]);

  const [bloque, setBloque] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  const leccion = consulta.datos;

  // Se retoma donde quedó, no desde el principio. Volver a empezar cada vez que
  // se abre la lección es la forma más rápida de que alguien la abandone.
  useEffect(() => {
    if (leccion) {
      setBloque(Math.min(leccion.bloques_vistos, Math.max(0, leccion.bloques.length - 1)));
    }
  }, [leccion?.leccion_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = useCallback(
    async (vistos: number) => {
      setGuardando(true);
      setErrorGuardado(null);
      try {
        await guardarProgreso(leccionId, vistos);
        return true;
      } catch (e) {
        const err = e as ErrorPublico;
        setErrorGuardado(
          err.motivo === "orden_no_respetado"
            ? "Falta terminar una lección anterior."
            : "No pudimos guardar tu avance. Revisa tu conexión."
        );
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [leccionId]
  );

  if (consulta.fase === "cargando") {
    return (
      <ParticipanteLayout>
        <Cargando etiqueta="Abriendo la lección…" />
      </ParticipanteLayout>
    );
  }

  if (consulta.fase === "error" && consulta.error) {
    return (
      <ParticipanteLayout>
        <PantallaDeError
          error={consulta.error as ErrorPublico}
          reintentar={consulta.refrescar}
        />
      </ParticipanteLayout>
    );
  }

  if (!leccion) {
    return (
      <ParticipanteLayout>
        <div className="flex flex-1 flex-col justify-center text-center">
          <h1 className="font-rel-heading text-xl font-bold">
            Esta lección no está en tu curso
          </h1>
          <p className="mt-3 text-base text-rel-muted">
            Vuelve al índice y elige una de la lista.
          </p>
          <div className="mt-6">
            <BotonPrincipal onClick={() => navegar("/c/sesion", { replace: true })}>
              Volver al curso
            </BotonPrincipal>
          </div>
        </div>
      </ParticipanteLayout>
    );
  }

  const total = Math.max(1, leccion.bloques.length);
  const esUltimo = bloque >= total - 1;

  async function siguiente() {
    const vistos = Math.min(bloque + 1, total);
    const ok = await guardar(vistos);
    if (!ok) return;
    if (esUltimo) {
      navegar("/c/sesion", { replace: true });
    } else {
      setBloque((b) => b + 1);
    }
  }

  return (
    <ParticipanteLayout progreso={(bloque + 1) / total}>
      <button
        type="button"
        onClick={() => navegar("/c/sesion")}
        className="-ml-1 mb-3 flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-rel-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al curso
      </button>

      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        Parte {bloque + 1} de {total}
      </p>
      <h1 className="mt-1 font-rel-heading text-xl font-bold leading-tight">
        {leccion.titulo}
      </h1>

      {/* `aria-live` para que un lector de pantalla anuncie el bloque nuevo: sin
          esto, avanzar no produce ningún cambio audible y parece que el botón
          no hizo nada. */}
      <div
        className="mt-5 flex-1 rounded-rel-card border border-rel-border bg-rel-surface p-5"
        aria-live="polite"
      >
        {leccion.bloques[bloque]?.titulo ? (
          <h2 className="mb-2 font-rel-heading text-base font-bold">
            {leccion.bloques[bloque].titulo}
          </h2>
        ) : null}
        {/* `whitespace-pre-line` respeta los saltos con los que se redactó el
            bloque. El contenido es texto plano por decisión del editor: nada que
            sanear, nada que pueda inyectar marcado. */}
        <p className="whitespace-pre-line text-base leading-relaxed">
          {leccion.bloques[bloque]?.contenido ?? ""}
        </p>
      </div>

      {errorGuardado ? (
        <p
          role="alert"
          className="mt-4 rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm"
        >
          {errorGuardado}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        {bloque > 0 ? (
          <button
            type="button"
            onClick={() => setBloque((b) => b - 1)}
            className="min-h-12 shrink-0 rounded-rel-control border border-rel-border px-4 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
            aria-label="Parte anterior"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
        <BotonPrincipal onClick={siguiente} disabled={guardando}>
          {guardando ? (
            "Guardando…"
          ) : esUltimo ? (
            <span className="inline-flex items-center gap-2">
              <Check className="h-5 w-5" aria-hidden="true" />
              Terminar la lección
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Siguiente
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </BotonPrincipal>
      </div>
    </ParticipanteLayout>
  );
}
