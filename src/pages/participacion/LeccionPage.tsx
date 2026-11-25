// src/pages/participacion/LeccionPage.tsx · D-05 y D-06
//
// Dos formas de lección en la misma pantalla, y a propósito: para quien cursa,
// «la lección 3» es un sitio, no dos rutas distintas según de qué esté hecha.
//
// La nativa: bloques de texto que se recorren de uno en uno.
//
// De uno en uno y no en una página larga con scroll, y la razón no es estética.
// El progreso se guarda por bloque, así que un solo scroll no permitiría saber
// dónde quedó alguien cuando se le acaba la batería. Con bloques, cerrar la
// pestaña no pierde nada.
//
// **El servidor guarda el máximo, nunca retrocede.** Por eso volver atrás para
// releer es gratis: reenviar un número menor no borra avance.

import { EsqueletoLeccion } from "@/shared/ui/EsqueletoPantalla";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import {
  enviarIntento,
  guardarProgreso,
  leerLeccion,
  miCurso,
} from "@/services/participacionService";
import type {
  ErrorPublico,
  EstadoCurso,
  IntentoCalificado,
  LeccionCompleta,
} from "@/types/participacion";
import { LeccionesLateral } from "@/features/participacion/LeccionesLateral";
import { PasosCurso, type EstadoPaso } from "@/shared/ui/PasosCurso";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  BotonPrincipal,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";
import { Casilla } from "@/shared/ui/Casilla";
import { Cargando, PantallaDeError } from "@/features/participacion/Estados";
import { ReproductorRecurso } from "@/features/participacion/ReproductorRecurso";
import { Evaluacion } from "@/features/participacion/Evaluacion";
import { BarraAccionesMovil } from "@/shared/ui/BotonAccion";
import { Caja } from "@/shared/ui/Caja";
import { Button } from "@/components/ui/button";

export default function LeccionPage() {
  const { leccionId = "" } = useParams<{ leccionId: string }>();
  const navegar = useNavigate();
  // Se pide SOLO esta lección. El índice ya trajo los metadatos; el texto pesa
  // y no hay razón para descargar el curso entero para leer una parte.
  const consulta = useConsulta<LeccionCompleta>(() => leerLeccion(leccionId), [leccionId]);

  // El índice del curso, solo para el lateral de pantallas anchas. Si falla no
  // pasa nada: la lección se lee igual y el lateral simplemente no aparece.
  const indice = useConsulta<EstadoCurso>(() => miCurso(), []);

  const [bloque, setBloque] = useState(0);
  // La confirmación de haber visto el material. Empieza SIEMPRE en falso,
  // también al volver a abrir una lección ya completada: es una afirmación de
  // la persona, y darla por hecha porque el servidor guardó un 1 convertiría el
  // control en decorado.
  const [confirmado, setConfirmado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [resultado, setResultado] = useState<IntentoCalificado | null>(null);
  // Persiste durante los reenvíos del mismo intento. Solo rota cuando la
  // persona decide empezar otro después de recibir un veredicto.
  const [solicitudId, setSolicitudId] = useState(() => crypto.randomUUID());

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

  async function enviar(respuestas: (number | number[])[]) {
    setGuardando(true);
    setErrorGuardado(null);
    try {
      setResultado(await enviarIntento(leccionId, solicitudId, respuestas));
    } catch (e) {
      const err = e as ErrorPublico;
      // El 409 se distingue del resto: «ya no puedes» no es «falló la red», y
      // ofrecer «reintentar» ante el primero sería mentir.
      setErrorGuardado(
        err.motivo === "intentos_agotados"
          ? err.message
          : err.motivo === "respuestas_invalidas"
            ? "Revisa que hayas respondido todas las preguntas."
            : "No pudimos enviar tus respuestas. Revisa tu conexión."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (consulta.fase === "cargando") {
    return (
      <ParticipanteLayout>
        <Cargando etiqueta="Abriendo la lección…" esqueleto={<EsqueletoLeccion />} />
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

  // Una lección de material tiene UNA unidad de avance: la confirmación. El
  // denominador lo calcula igual el servidor; aquí solo se pinta lo mismo.
  const recurso = leccion.recurso;
  const evaluacion = leccion.evaluacion;
  const total = recurso || evaluacion ? 1 : Math.max(1, leccion.bloques.length);
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
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
      <Button
        type="button"
        variant="link"
        onClick={() => navegar("/c/sesion")}
        className="-ml-1 mb-3 self-start px-0 no-underline hover:no-underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al curso
      </Button>

      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        {evaluacion
          ? "Evaluación"
          : recurso
            ? leccion.tipo === "VIDEO"
              ? "Video"
              : "Documento"
            : `Parte ${bloque + 1} de ${total}`}
      </p>
      <h1 className="mt-1 font-rel-heading text-2xl font-black leading-tight sm:text-3xl">
        {leccion.titulo}
      </h1>

      {/* Una raya por parte: cuántas son y cuál toca, sin contar. Solo cuando
          hay más de una; con una sola parte la raya no dice nada. */}
      {!evaluacion && !recurso && total > 1 ? (
        <PasosCurso
          etiqueta="Partes de la lección"
          className="mt-4 max-w-md"
          pasos={Array.from({ length: total }, (_, i): EstadoPaso =>
            i < bloque ? "hecho" : i === bloque ? "actual" : "pendiente"
          )}
        />
      ) : null}

      {/* `aria-live` para que un lector de pantalla anuncie el bloque nuevo: sin
          esto, avanzar no produce ningún cambio audible y parece que el botón
          no hizo nada. */}
      {evaluacion ? (
        <Evaluacion
          evaluacion={evaluacion}
          enviando={guardando}
          error={errorGuardado}
          resultado={resultado}
          alEnviar={(r) => void enviar(r)}
          alReintentar={async () => {
            setSolicitudId(crypto.randomUUID());
            setResultado(null);
            setErrorGuardado(null);
            // Se recarga: el número de intentos usados cambió, y seguir con el
            // de antes mostraría «intento 1 de 1» en el segundo.
            await consulta.refrescar();
          }}
          alTerminar={() => navegar("/c/sesion", { replace: true })}
        />
      ) : recurso ? (
        <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <ReproductorRecurso recurso={recurso} tipo={leccion.tipo} />

          {/* La confirmación es lo que cuenta, y la pantalla dice por qué en
              vez de fingir una barra de reproducción: de un incrustado de
              terceros no se puede medir cuánto se vio sin la API del proveedor,
              y un porcentaje calculado en el navegador sería inventado. */}
          <Caja
            aire="normal"
            className="shadow-rel-card lg:sticky lg:top-6"
          >
          <Casilla
            marcada={confirmado}
            alCambiar={setConfirmado}
            etiqueta={
              <span className="text-base font-semibold">
                {leccion.tipo === "VIDEO"
                  ? "He visto el video completo"
                  : "He revisado el documento"}
              </span>
            }
            descripcion="Con esto queda registrada tu participación en esta lección."
          />
          </Caja>
        </div>
      ) : (
        <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
          <Caja aire="amplio" className="min-h-64 shadow-rel-card lg:p-10" aria-live="polite">
            {/* El bloque nuevo entra con un corrimiento corto: sin él, pulsar
                «Siguiente» cambia el texto sin que nada diga que pasó algo.
                `key` hace que cada parte sea un elemento nuevo y la entrada
                corra de nuevo. */}
            <div
              key={bloque}
              className="mx-auto max-w-[68ch] animate-in fade-in slide-in-from-right-[1rem] duration-enter ease-rel-out motion-reduce:animate-none"
            >
              {leccion.bloques[bloque]?.titulo ? (
                <h2 className="mb-3 font-rel-heading text-lg font-bold">
                  {leccion.bloques[bloque].titulo}
                </h2>
              ) : null}
              {/* `whitespace-pre-line` respeta los saltos con los que se redactó
                  el bloque. El contenido es texto plano por decisión del editor:
                  nada que sanear, nada que pueda inyectar marcado. La medida
                  (68 caracteres) es la que se lee cómoda: sin ella, en una
                  pantalla ancha cada línea corría de lado a lado. */}
              <p className="whitespace-pre-line text-base leading-relaxed lg:text-lg lg:leading-8">
                {leccion.bloques[bloque]?.contenido ?? ""}
              </p>
            </div>
          </Caja>
          {indice.datos ? (
            <aside className="hidden lg:sticky lg:top-6 lg:block">
              <LeccionesLateral lecciones={indice.datos.lecciones} actualId={leccion.leccion_id} />
            </aside>
          ) : null}
        </div>
      )}

      {errorGuardado && !evaluacion ? (
        <p
          role="alert"
          className="mt-4 rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm"
        >
          {errorGuardado}
        </p>
      ) : null}

      {evaluacion ? null : (
      <BarraAccionesMovil className="flex gap-3 lg:ml-auto lg:w-full lg:max-w-md">
        {!recurso && bloque > 0 ? (
          <Button
            type="button"
            variant="relOutline"
            size="icon"
            onClick={() => setBloque((b) => b - 1)}
            className="h-14 w-14 shrink-0"
            aria-label="Parte anterior"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        ) : null}
        <BotonPrincipal onClick={siguiente} disabled={guardando || (Boolean(recurso) && !confirmado)}>
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
      </BarraAccionesMovil>
      )}
      </div>
    </ParticipanteLayout>
  );
}
