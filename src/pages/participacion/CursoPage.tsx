// src/pages/participacion/CursoPage.tsx · D-02b + D-03
//
// Dos pantallas en una ruta porque son la misma pregunta desde el punto de vista
// de quien llega: «¿puedo seguir?». Si la cookie está, se sigue; si no, se pide
// el código.
//
// **Reanudar por documento no existe**, y no por descuido: quien tuviera el
// enlace del grupo y conociera el documento de un compañero podría continuar su
// curso y descargar su constancia.

import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Lock } from "lucide-react";

import { miCurso, reanudar } from "@/services/participacionService";
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

  const [codigo, setCodigo] = useState("");
  const [reanudando, setReanudando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);

  const entrarConCodigo = useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();
      if (!codigo.trim()) {
        setErrorCodigo("Escribe el código que te dimos al empezar.");
        return;
      }
      setReanudando(true);
      setErrorCodigo(null);
      try {
        await reanudar(codigo.trim());
        await consulta.refrescar();
      } catch (e) {
        const err = e as ErrorPublico;
        setErrorCodigo(
          err.motivo === "sesion_invalida"
            ? "Ese código no corresponde a ninguna capacitación en curso."
            : err.message
        );
      } finally {
        setReanudando(false);
      }
    },
    [codigo, consulta]
  );

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
      <ParticipanteLayout>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-rel-heading text-2xl font-bold">
            ¿Estás en otro teléfono?
          </h1>
          <p className="mt-3 text-base leading-relaxed text-rel-muted">
            En este dispositivo no hay ninguna capacitación empezada. Si ya la
            habías comenzado en otro, escribe el código de continuación.
          </p>

          <form onSubmit={entrarConCodigo} className="mt-6 space-y-3" noValidate>
            <label htmlFor="codigo" className="block text-sm font-semibold">
              Código de continuación
            </label>
            <input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoComplete="one-time-code"
              enterKeyHint="go"
              className="min-h-12 w-full rounded-rel-control border border-rel-border bg-rel-surface px-3 font-mono text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
              aria-invalid={errorCodigo ? true : undefined}
              aria-describedby={errorCodigo ? "err-codigo" : undefined}
            />
            {errorCodigo ? (
              <p id="err-codigo" role="alert" className="text-sm text-rel-danger">
                {errorCodigo}
              </p>
            ) : null}
            <BotonPrincipal type="submit" disabled={reanudando}>
              {reanudando ? "Entrando…" : "Continuar"}
            </BotonPrincipal>
          </form>

          <p className="mt-6 text-sm leading-relaxed text-rel-muted">
            ¿No lo tienes? Pídele a quien te compartió el enlace que te ayude.
            Por seguridad, el número de documento no basta para continuar el
            curso de alguien.
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
      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        Versión {curso.numero_version}
      </p>
      <h1 className="mt-1 font-rel-heading text-2xl font-bold leading-tight">
        {curso.curso}
      </h1>
      <p className="mt-2 text-sm text-rel-muted">
        {curso.obligatorias_completas} de {curso.obligatorias_totales}{" "}
        {curso.obligatorias_totales === 1 ? "lección" : "lecciones"}
      </p>

      <ol className="mt-5 space-y-3">
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

      <div className="mt-auto pt-6">
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
    </ParticipanteLayout>
  );
}
