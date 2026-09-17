// src/pages/participacion/CursoPage.tsx · D-02b + D-03
//
// Dos pantallas en una ruta porque son la misma pregunta desde el punto de vista
// de quien llega: «¿puedo seguir?». Si la cookie está, se sigue; si no, se le
// indica cómo volver al enlace que acota su empresa y asignación.
//
// La identificación por documento vive en el aterrizaje del enlace, nunca en
// esta ruta sin contexto. Así el cliente no envía empresa ni asignación.

import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Lock } from "lucide-react";

import { miCurso } from "@/services/participacionService";
import type { ErrorPublico, EstadoCurso } from "@/types/participacion";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  BotonPrincipal,
  BotonSecundario,
  Panel,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";
import { Cargando, PantallaDeError } from "@/features/participacion/Estados";

export default function CursoPage() {
  const navegar = useNavigate();
  const consulta = useConsulta<EstadoCurso>(() => miCurso(), []);

  if (consulta.fase === "cargando") {
    return (
      <ParticipanteLayout>
        <Cargando etiqueta="Buscando tu curso…" />
      </ParticipanteLayout>
    );
  }

  // D-02b. La sesión inválida NO es un error que se reintente: es que este
  // dispositivo no tiene cookie. Tratarlo como fallo genérico dejaría a la
  // persona pulsando «reintentar» sin que nada cambiara nunca.
  if (consulta.fase === "error" && (consulta.error as ErrorPublico)?.motivo === "sesion_invalida") {
    return (
      <ParticipanteLayout ancho="compacto">
        <div className="my-auto rounded-rel-panel border border-rel-border bg-rel-surface p-6 text-center shadow-card sm:p-8">
          <h1 className="font-rel-heading text-2xl font-bold">Vuelve a abrir tu enlace</h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-rel-muted">
            En este dispositivo no encontramos una sesión activa. Abre de nuevo
            el enlace de la capacitación y elige “Ya había empezado” para entrar
            con tu documento.
          </p>
        </div>
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

  const curso = consulta.datos;
  if (!curso) return null;

  const avance =
    curso.obligatorias_totales > 0
      ? curso.obligatorias_completas / curso.obligatorias_totales
      : 0;

  if (curso.estado === "COMPLETADA") {
    return (
      <ParticipanteLayout progreso={1}>
        <div className="flex flex-1 flex-col justify-center text-center">
          <CheckCircle2
            className="mx-auto h-10 w-10 text-rel-success"
            aria-hidden="true"
          />
          <h1 className="mt-4 font-rel-heading text-2xl font-bold">
            Ya terminaste esta capacitación
          </h1>
          <p className="mt-3 text-base leading-relaxed text-rel-muted">
            Tu asistencia quedó registrada. Puedes cerrar esta página.
          </p>
        </div>
      </ParticipanteLayout>
    );
  }

  return (
    <ParticipanteLayout progreso={avance}>
      <section className="rounded-rel-panel border border-rel-border bg-rel-surface p-5 shadow-card sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rel-accent">
              Curso · Versión {curso.numero_version}
            </p>
            <h1 className="mt-2 font-rel-heading text-3xl font-black leading-tight sm:text-4xl">
              {curso.curso}
            </h1>
            <p className="mt-3 text-sm text-rel-muted">
              Avanza en el orden propuesto. Tu progreso se guarda automáticamente.
            </p>
          </div>
          <div className="rounded-rel-card bg-rel-accent-subtle p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">Tu progreso</p>
                <p className="mt-1 font-rel-heading text-2xl font-black tabular-nums">{Math.round(avance * 100)}%</p>
              </div>
              <p className="text-right text-sm text-rel-muted">
                {curso.obligatorias_completas} de {curso.obligatorias_totales}{" "}
                {curso.obligatorias_totales === 1 ? "lección" : "lecciones"}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-rel-surface">
              <div className="h-full rounded-full bg-rel-primary" style={{ width: `${avance * 100}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <h2 className="font-rel-heading text-xl font-bold">Ruta de aprendizaje</h2>
          <p className="mt-1 text-sm text-rel-muted">Selecciona la siguiente lección disponible.</p>
          <ol className="mt-4 space-y-3">
        {curso.lecciones.map((l) => {
          const bloqueada = !l.desbloqueada && !l.completada;
          return (
            <li key={l.leccion_id}>
              {/* Lo bloqueado es un `<div>` y no un botón deshabilitado: un
                  botón que no hace nada sigue recibiendo el foco al tabular y
                  promete algo que no cumple. */}
              {bloqueada ? (
                <div className="flex items-center gap-3 rounded-rel-card border border-rel-border bg-rel-surface p-4 opacity-60">
                  <Lock className="h-5 w-5 shrink-0 text-rel-muted" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.titulo}</p>
                    <p className="text-sm text-rel-muted">
                      Termina la lección anterior para abrirla
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  to={`/c/sesion/leccion/${l.leccion_id}`}
                  className="flex min-h-16 items-center gap-3 rounded-rel-card border border-rel-border bg-rel-surface p-4 transition-colors duration-rel-micro hover:bg-rel-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
                >
                  {l.completada ? (
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 text-rel-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-rel-primary" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.titulo}</p>
                    <p className="text-sm text-rel-muted">
                      {l.completada
                        ? "Completada"
                        : l.bloques_vistos > 0
                          ? `Vas por ${l.bloques_vistos} de ${l.bloques_totales}`
                          : `${l.bloques_totales} ${l.bloques_totales === 1 ? "parte" : "partes"}`}
                      {l.obligatoria ? "" : " · no obligatoria"}
                    </p>
                  </div>
                </Link>
              )}
            </li>
          );
        })}
          </ol>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Panel>
            <p className="font-rel-heading text-lg font-bold">
              {curso.puede_finalizar ? "Completaste el recorrido" : "Sigue avanzando"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-rel-muted">
              {curso.puede_finalizar
                ? "Confirma tu asistencia para generar el registro y la constancia."
                : "Continúa desde la primera lección disponible."}
            </p>
            <div className="mt-5">
              {curso.puede_finalizar ? (
                <BotonPrincipal onClick={() => navegar("/c/sesion/finalizar")}>
                  Registrar mi asistencia
                </BotonPrincipal>
              ) : (
                <BotonSecundario
                  onClick={() => {
                    const siguiente = curso.lecciones.find((l) => !l.completada && l.desbloqueada);
                    if (siguiente) navegar(`/c/sesion/leccion/${siguiente.leccion_id}`);
                  }}
                >
                  Continuar donde quedé
                </BotonSecundario>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </ParticipanteLayout>
  );
}
