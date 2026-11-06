// src/pages/evaluaciones/EvaluacionDetallePage.tsx
//
// Redactar y publicar un cuestionario del banco.
//
// Dos cosas que esta pantalla dice y conviene que siga diciendo:
//
//   1. **Publicar congela.** Lo que se publique no vuelve a cambiar: corregir
//      una pregunta después crea la versión siguiente y deja intacta la que
//      alguien ya respondió. Se advierte ANTES de pulsar, no después.
//   2. **Editar no afecta a los cursos que ya la usan.** Cada lección apunta a
//      una versión concreta, no al borrador. Sin decirlo, quien edita cree que
//      está cambiando lo que están respondiendo hoy, y no se atreve.

import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Archive, BookOpenCheck, ClipboardCheck, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BotonVolver } from "@/shared/ui/BotonVolver";
import { DialogoCasa } from "@/shared/ui/DialogoCasa";
import { Panel } from "@/shared/ui/Panel";
import { SeccionPlegable } from "@/shared/ui/SeccionPlegable";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoPanel,
  ErrorConsulta,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { ConstructorEvaluacion } from "@/features/capacitaciones/components/ConstructorEvaluacion";
import {
  archivarCuestionario,
  editarCuestionario,
  obtenerCuestionario,
  publicarCuestionario,
} from "@/services/evaluacionesService";
import { formatearFechaHora } from "@/features/capacitaciones/formato";
import { EstadoCuestionarioBadge } from "./EvaluacionesPage";
import { ETIQUETA_AMBITO, type CuestionarioDetalle } from "@/types/evaluaciones";
import type { ErrorApi, EvaluacionLeccion } from "@/types/capacitaciones";

export default function EvaluacionDetallePage() {
  const { cuestionarioId = "" } = useParams<{ cuestionarioId: string }>();
  const { toast } = useToast();
  const consulta = useConsulta<CuestionarioDetalle>(
    () => obtenerCuestionario(cuestionarioId),
    [cuestionarioId]
  );
  const recargar = useCallback(() => consulta.refrescar(), [consulta]);

  const [borrador, setBorrador] = useState<EvaluacionLeccion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [confirmarPublicar, setConfirmarPublicar] = useState(false);

  const datos = consulta.datos;
  const cuestionario = datos?.cuestionario;

  // El borrador local arranca del servidor y solo existe mientras se edita: sin
  // esto, cada tecla dispararía una petición.
  const actual: EvaluacionLeccion | null = borrador ?? (
    cuestionario
      ? {
          nota_minima: cuestionario.nota_minima,
          intentos_max: cuestionario.intentos_max,
          preguntas: cuestionario.preguntas ?? [],
        }
      : null
  );

  async function guardar() {
    if (!actual) return;
    setGuardando(true);
    try {
      await editarCuestionario(cuestionarioId, {
        nota_minima: actual.nota_minima,
        intentos_max: actual.intentos_max,
        preguntas: actual.preguntas,
      });
      toast({ title: "Evaluación guardada" });
      setBorrador(null);
      await recargar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos guardar",
        description: err.message,
      });
    } finally {
      setGuardando(false);
    }
  }

  async function publicar() {
    setPublicando(true);
    try {
      const version = await publicarCuestionario(cuestionarioId);
      toast({
        title: `Versión ${version.numero} publicada`,
        description: "Ya se puede elegir desde la lección de un curso.",
      });
      setConfirmarPublicar(false);
      setBorrador(null);
      await recargar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos publicar",
        description: err.message,
      });
    } finally {
      setPublicando(false);
    }
  }

  async function archivar() {
    try {
      await archivarCuestionario(cuestionarioId);
      toast({
        title: "Evaluación archivada",
        description: "Los cursos que ya la usan siguen funcionando.",
      });
      await recargar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos archivarla",
        description: err.message,
      });
    }
  }

  return (
    <div className="space-y-6">
      <BotonVolver a="/evaluaciones">Volver al banco</BotonVolver>

      {consulta.fase === "cargando" ? (
        <CargandoPanel etiqueta="Abriendo la evaluación…" />
      ) : null}

      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && datos && cuestionario && actual ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-rel-panel border border-rel-border bg-rel-surface p-6 shadow-sm">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <EstadoCuestionarioBadge estado={cuestionario.estado} />
                <Badge variant="relBrand">{ETIQUETA_AMBITO[cuestionario.ambito]}</Badge>
                <span className="text-xs text-rel-muted">{cuestionario.codigo}</span>
              </div>
              <h1 className="mt-2 font-rel-heading text-3xl font-black tracking-tight text-rel-dark">
                {cuestionario.titulo}
              </h1>
              <p className="mt-1 max-w-prose font-rel-body text-sm text-rel-muted">
                {cuestionario.version_actual > 0
                  ? `Versión vigente v${cuestionario.version_actual}. Lo que edites aquí no la cambia: forma la siguiente, y los cursos que ya la usan siguen con la suya.`
                  : "Borrador. Ningún curso puede usarla hasta que publiques una versión."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {cuestionario.estado !== "ARCHIVADO" ? (
                <Button variant="relGhost" onClick={() => void archivar()}>
                  <Archive aria-hidden="true" />
                  Archivar
                </Button>
              ) : null}
              <Button
                variant="rel"
                disabled={datos.faltantes.length > 0 || borrador !== null}
                onClick={() => setConfirmarPublicar(true)}
              >
                <Upload aria-hidden="true" />
                Publicar versión
              </Button>
            </div>
          </header>

          <section className="flex items-start gap-3 rounded-rel-card border border-rel-info/25 bg-rel-info-subtle p-4">
            <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-rel-info" aria-hidden="true" />
            <div className="text-sm leading-6 text-rel-dark">
              <p className="font-semibold">Cómo usarla en una capacitación</p>
              {cuestionario.version_actual === 0 ? (
                <p className="text-rel-muted">
                  Completa las preguntas y publica una versión. Después abre un curso,
                  agrega una lección de tipo Evaluación y elige “Del banco de evaluaciones”.
                </p>
              ) : (
                <p className="text-rel-muted">
                  Ya está disponible. En el editor de un curso agrega una lección de tipo
                  Evaluación y elige “Del banco de evaluaciones”.{" "}
                  <Link className="font-semibold text-rel-primary underline-offset-2 hover:underline" to="/capacitaciones/cursos">
                    Ir al catálogo
                  </Link>
                </p>
              )}
            </div>
          </section>

          {/* El checklist se ve SIN pulsar «Publicar». Descubrir lo que falta a
              base de errores es lo que hace que nadie se atreva a pulsarlo. */}
          {datos.faltantes.length > 0 ? (
            <Panel titulo="Falta para poder publicar">
              <ul className="space-y-2">
                {datos.faltantes.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-rel-dark">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rel-warning" />
                    {f}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {borrador !== null ? (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-rel-card border border-rel-warning/30 bg-rel-warning-subtle p-4"
            >
              <p className="text-sm font-semibold text-rel-dark">
                Hay cambios sin guardar.
              </p>
              <div className="flex gap-2">
                <Button variant="relGhost" size="sm" onClick={() => setBorrador(null)}>
                  Descartar
                </Button>
                <Button
                  variant="rel"
                  size="sm"
                  disabled={guardando}
                  onClick={() => void guardar()}
                >
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </div>
          ) : null}

          <SeccionPlegable
            titulo="Cuestionario"
            claveMemoria="abril360.evaluaciones.cuestionario"
            descripcion={
              actual.preguntas.length > 0
                ? `${actual.preguntas.length} ${actual.preguntas.length === 1 ? "pregunta" : "preguntas"}`
                : "Sin preguntas todavía."
            }
            estado={
              actual.preguntas.length === 0 ? (
                <Badge variant="relWarning">Vacío</Badge>
              ) : null
            }
          >
            <ConstructorEvaluacion valor={actual} alCambiar={setBorrador} />
          </SeccionPlegable>

          <SeccionPlegable
            titulo="Versiones publicadas"
            claveMemoria="abril360.evaluaciones.versiones"
            abiertaPorDefecto={false}
            descripcion={
              datos.versiones.length === 0
                ? "Todavía no hay ninguna."
                : `${datos.versiones.length} congeladas. Cada curso apunta a una.`
            }
          >
            {datos.versiones.length === 0 ? (
              <p className="text-sm text-rel-muted">
                Publicar congela una copia con sus preguntas y sus respuestas
                correctas. Es lo único que una lección puede referenciar.
              </p>
            ) : (
              <ol className="space-y-2">
                {datos.versiones.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 rounded-rel-card border border-rel-border p-3"
                  >
                    <span className="font-semibold text-rel-dark">
                      Versión {v.numero}
                      {v.numero === cuestionario.version_actual ? (
                        <Badge variant="relSuccess" className="ml-2">
                          Vigente
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-sm text-rel-muted">
                      {formatearFechaHora(v.publicado_en)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SeccionPlegable>

          <DialogoCasa
            abierto={confirmarPublicar}
            alCerrar={() => setConfirmarPublicar(false)}
            escena="planificacion"
            antetitulo="Publicación"
            titulo={`Publicar la versión ${cuestionario.version_actual + 1}`}
            descripcion={
              <>
                Se congela una copia con las{" "}
                <strong className="text-rel-dark">
                  {actual.preguntas.length}{" "}
                  {actual.preguntas.length === 1 ? "pregunta" : "preguntas"}
                </strong>{" "}
                y sus respuestas correctas. No vuelve a cambiar: corregir algo
                después crea la versión siguiente y deja intacta esta, que es la
                que habrá respondido quien la tome. Los cursos que ya usan una
                versión anterior siguen con la suya.
              </>
            }
            acciones={
              <>
                <Button
                  type="button"
                  variant="relGhost"
                  disabled={publicando}
                  onClick={() => setConfirmarPublicar(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="rel"
                  disabled={publicando}
                  onClick={() => void publicar()}
                >
                  {publicando ? "Publicando…" : "Publicar versión"}
                </Button>
              </>
            }
          />
        </>
      ) : null}
    </div>
  );
}
