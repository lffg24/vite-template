// src/pages/participacion/InvitacionPage.tsx · D-01b / D-02c
//
// La portada de una invitación personal, y su confirmación.
//
// ## Lo que esta pantalla NO tiene, que es lo importante
//
// **No hay campos de documento, nombres ni apellidos.** Esa ausencia es el
// arreglo del P0: antes bastaban el enlace del grupo —que circula por WhatsApp—
// y el número de documento de un compañero para inscribirlo, recibir su secreto
// y dejar una asistencia que esa persona nunca prestó.
//
// No es que ahora se validen mejor: es que no existe dónde afirmar ser otro. La
// identidad la afirmó la empresa al cargar a su gente, y viene en la invitación.
//
// ## Por qué el nombre se muestra enmascarado
//
// Este enlace puede acabar reenviado. Mostrar el documento completo convertiría
// una invitación perdida en una filtración de datos personales. Llega ya
// enmascarado del servidor, no recortado aquí: recortarlo en la pantalla
// significaría que el dato completo viajó por la red.

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";

import { abrirInvitacion, aceptarInvitacion } from "@/services/participacionService";
import type {
  AceptacionEnviada,
  AterrizajeInvitacion,
  ErrorPublico,
} from "@/types/participacion";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  BotonPrincipal,
  Panel,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";
import { Cargando, PantallaDeError } from "@/features/participacion/Estados";
import { SecretoDeReanudacion } from "@/features/participacion/SecretoDeReanudacion";

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function InvitacionPage() {
  const { token = "" } = useParams<{ token: string }>();
  const navegar = useNavigate();
  const consulta = useConsulta<AterrizajeInvitacion>(
    () => abrirInvitacion(token),
    [token]
  );

  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [abierto, setAbierto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);

  const inv = consulta.datos;

  async function confirmar() {
    if (!inv) return;
    setEnviando(true);
    setError(null);
    try {
      // La versión EXACTA que se mostró. Si cambió mientras leía, el servidor
      // lo rechaza y hay que volver a presentarla.
      const aceptaciones: AceptacionEnviada[] = inv.textos.map((t) => ({
        clave: t.clave,
        texto_id_presentado: t.texto_id,
      }));
      const r = await aceptarInvitacion(token, aceptaciones);
      if (r.secreto) {
        setSecreto(r.secreto);
      } else {
        // Ya estaba dentro —volvió a abrir su enlace— y no hay secreto nuevo:
        // emitirlo invalidaría la sesión que quizá tiene abierta en otro sitio.
        navegar("/c/sesion", { replace: true });
      }
    } catch (e) {
      const err = e as ErrorPublico;
      setError(
        err.motivo === "invitacion_no_disponible"
          ? "Esta invitación ya no está disponible. Pídele otra a quien organiza la capacitación en tu empresa."
          : err.motivo === "texto_cambio"
            ? "Los textos cambiaron mientras leías. Vuelve a abrirlos y confírmalos."
            : "No pudimos completar tu inscripción. Inténtalo otra vez."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (consulta.fase === "cargando") {
    return (
      <ParticipanteLayout>
        <Cargando etiqueta="Abriendo tu invitación…" />
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

  if (!inv) return null;

  if (secreto) {
    return (
      <ParticipanteLayout>
        <SecretoDeReanudacion
          secreto={secreto}
          alContinuar={() => navegar("/c/sesion", { replace: true })}
        />
      </ParticipanteLayout>
    );
  }

  const todasMarcadas = inv.textos.every((t) => marcados[t.clave]);

  return (
    <ParticipanteLayout>
      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        Invitación personal
      </p>
      <h1 className="mt-1 font-rel-heading text-2xl font-bold leading-tight">
        {inv.curso}
      </h1>
      <p className="mt-1 text-base text-rel-muted">{inv.empresa}</p>

      {/* Quién eres, para que confirmes que este enlace es tuyo. Es lo único
          que la pantalla dice de tu identidad, y ya llega enmascarado. */}
      <Panel className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
          Esta invitación es para
        </p>
        <p className="mt-1 font-rel-heading text-lg font-bold">
          {inv.identidad.nombre}
        </p>
        <p className="text-sm text-rel-muted">{inv.identidad.documento}</p>
        <p className="mt-3 border-t border-rel-border pt-3 text-sm leading-relaxed text-rel-muted">
          Si no eres tú, no continúes: avísale a quien organiza la capacitación
          en tu empresa.
        </p>
      </Panel>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-rel-muted">Lecciones</dt>
          <dd className="font-semibold">{inv.lecciones}</dd>
        </div>
        {inv.duracion_estimada_min ? (
          <div className="flex justify-between gap-4">
            <dt className="text-rel-muted">Duración estimada</dt>
            <dd className="font-semibold">{inv.duracion_estimada_min} minutos</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-rel-muted">Versión</dt>
          <dd className="font-semibold">v{inv.numero_version}</dd>
        </div>
      </dl>

      <p className="mt-4 flex items-start gap-2 text-sm text-rel-muted">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Esta invitación sirve hasta el {fecha(inv.expira_en)}, y solo una vez.
      </p>

      <fieldset
        className="mt-6 rounded-rel-card border border-rel-border bg-rel-surface p-4"
        aria-describedby={!todasMarcadas && error ? "err-aceptaciones" : undefined}
      >
        <legend className="px-1 text-sm font-semibold">Autorizaciones</legend>
        <div className="space-y-4">
          {inv.textos.map((t) => (
            <div key={t.clave}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(marcados[t.clave])}
                  onChange={(e) =>
                    setMarcados((m) => ({ ...m, [t.clave]: e.target.checked }))
                  }
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--rel-primary))]"
                  // Solo cuando el texto está desplegado: `hidden` saca el
                  // elemento del árbol de accesibilidad, así que apuntar ahí
                  // colapsado deja una referencia que no resuelve a nada.
                  aria-describedby={abierto === t.clave ? `texto-${t.clave}` : undefined}
                />
                <span className="text-sm leading-relaxed">
                  {t.finalidad ?? "Autorizo el tratamiento de mis datos."}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setAbierto(abierto === t.clave ? null : t.clave)}
                className="mt-1 min-h-11 pl-8 text-sm font-semibold text-rel-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
                aria-expanded={abierto === t.clave}
                aria-controls={`texto-${t.clave}`}
                aria-label={`${abierto === t.clave ? "Ocultar" : "Leer"} el texto completo de: ${
                  t.finalidad ?? "Autorizo el tratamiento de mis datos."
                }`}
              >
                {abierto === t.clave ? "Ocultar el texto" : "Leer el texto completo"}
              </button>
              <div
                id={`texto-${t.clave}`}
                hidden={abierto !== t.clave}
                className="mt-2 max-h-64 overflow-y-auto rounded-rel-control bg-rel-surface-subtle p-3 text-sm leading-relaxed text-rel-muted"
              >
                <p className="whitespace-pre-line">{t.contenido}</p>
                <p className="mt-2 text-xs">Versión {t.version}</p>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p
          id="err-aceptaciones"
          role="alert"
          className="mt-4 rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm leading-relaxed"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-start gap-3 rounded-rel-card bg-rel-info-subtle p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rel-info" aria-hidden="true" />
        <p className="text-sm leading-relaxed">
          Al continuar quedará registrado que <strong>tú</strong> hiciste esta
          capacitación. Tu constancia llevará tu nombre.
        </p>
      </div>

      <div className="mt-auto pt-6">
        <BotonPrincipal onClick={confirmar} disabled={enviando || !todasMarcadas}>
          {enviando ? (
            "Entrando…"
          ) : (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              Confirmar y empezar
            </span>
          )}
        </BotonPrincipal>
        {!todasMarcadas ? (
          <p className="mt-2 text-center text-xs text-rel-muted">
            Marca las dos autorizaciones para continuar.
          </p>
        ) : null}
      </div>
    </ParticipanteLayout>
  );
}
