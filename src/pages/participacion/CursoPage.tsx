// src/pages/participacion/CursoPage.tsx · D-02b + D-03
//
// Dos pantallas en una ruta porque son la misma pregunta desde el punto de vista
// de quien llega: «¿puedo seguir?». Si la cookie está, se sigue; si no, se le
// indica cómo volver al enlace que acota su empresa y asignación.
//
// La identificación por documento vive en el aterrizaje del enlace, nunca en
// esta ruta sin contexto. Así el cliente no envía empresa ni asignación.

import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

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
import { RutaAprendizaje, siguienteLeccion } from "@/features/participacion/RutaAprendizaje";
import { Illustration, IllustrationSurface } from "@/shared/ui/illustration";
import { AnilloProgreso, BarraProgreso } from "@/shared/ui/Progreso";

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
      <ParticipanteLayout progreso={1} ancho="compacto">
        <div className="my-auto flex flex-col items-center text-center">
          <IllustrationSurface tone="positive" className="w-full max-w-xs">
            <Illustration name="courseApproved" size="md" />
          </IllustrationSurface>
          <h1 className="mt-6 font-rel-heading text-2xl font-black sm:text-3xl">
            Ya terminaste esta capacitación
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-rel-muted">
            Tu asistencia quedó registrada. Puedes cerrar esta página.
          </p>
        </div>
      </ParticipanteLayout>
    );
  }

  const siguiente = siguienteLeccion(curso.lecciones);
  const numeroSiguiente = siguiente
    ? curso.lecciones.findIndex((l) => l.leccion_id === siguiente.leccion_id) + 1
    : null;

  return (
    <ParticipanteLayout progreso={avance}>
      {/* --- el curso y cuánto falta --- */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-stretch">
        <div className="flex flex-col justify-center py-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-rel-accent">
            Curso · Versión {curso.numero_version}
          </p>
          <h1 className="mt-2 break-words font-rel-heading text-3xl font-black leading-tight sm:text-4xl">
            {curso.curso}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-rel-muted">
            Avanza en el orden propuesto. Tu progreso se guarda solo, así que
            puedes seguir otro día desde donde quedaste.
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-rel-muted">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-rel-primary" aria-hidden="true" />
              <dt className="sr-only">Lecciones</dt>
              <dd>
                {curso.lecciones.length} {curso.lecciones.length === 1 ? "lección" : "lecciones"}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-rel-primary" aria-hidden="true" />
              <dt className="sr-only">Obligatorias</dt>
              <dd>
                {curso.obligatorias_totales}{" "}
                {curso.obligatorias_totales === 1 ? "obligatoria" : "obligatorias"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-5 rounded-rel-panel border border-rel-border bg-rel-surface p-5 shadow-card">
          <AnilloProgreso valor={avance} etiqueta="Tu progreso en el curso" tamano={112} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-rel-dark">
              Tu progreso
            </p>
            <BarraProgreso valor={avance} etiqueta="Lecciones obligatorias completadas" tamano="sm" className="mt-3" />
            <p className="mt-2 text-sm text-rel-muted">
              {curso.obligatorias_completas} de {curso.obligatorias_totales}{" "}
              {curso.obligatorias_totales === 1 ? "lección completada" : "lecciones completadas"}
            </p>
          </div>
        </div>
      </section>

      {/* --- ruta y siguiente paso --- */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="ruta-titulo">
          <h2 id="ruta-titulo" className="font-rel-heading text-xl font-bold">
            Ruta de aprendizaje
          </h2>
          <p className="mt-1 text-sm text-rel-muted">
            Las lecciones se abren en orden, a medida que terminas la anterior.
          </p>
          <div className="mt-4">
            <RutaAprendizaje lecciones={curso.lecciones} />
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Panel>
            <IllustrationSurface tone="lavender" className="mb-4 hidden aspect-[4/3] lg:flex">
              <Illustration name={curso.puede_finalizar ? "courseApproved" : "learningPath"} size="sm" />
            </IllustrationSurface>
            <p className="font-rel-heading text-lg font-bold">
              {curso.puede_finalizar ? "Completaste el recorrido" : "Tu siguiente paso"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-rel-muted">
              {curso.puede_finalizar
                ? "Confirma tu asistencia para generar el registro y tu constancia."
                : siguiente
                  ? `Lección ${numeroSiguiente}: ${siguiente.titulo}`
                  : "Continúa desde la primera lección disponible."}
            </p>
            <div className="mt-5">
              {curso.puede_finalizar ? (
                <BotonPrincipal onClick={() => navegar("/c/sesion/finalizar")}>
                  Registrar mi asistencia
                </BotonPrincipal>
              ) : siguiente ? (
                <BotonPrincipal onClick={() => navegar(`/c/sesion/leccion/${siguiente.leccion_id}`)}>
                  <span className="inline-flex items-center gap-2">
                    Continuar <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </BotonPrincipal>
              ) : (
                <BotonSecundario onClick={() => void consulta.refrescar()}>
                  Actualizar mi avance
                </BotonSecundario>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </ParticipanteLayout>
  );
}
