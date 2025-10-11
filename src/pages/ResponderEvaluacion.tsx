import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import { obtenerPreguntas } from "@/services/preguntaService";
import {
  guardarRespuestasMultiples,
  obtenerRespuestasPorUsuarioYEvaluacion,
} from "@/services/respuestaService";
import { obtenerEvaluacion } from "@/services/evaluacionService";

import type { Pregunta } from "@/types/pregunta";
import type { Respuesta } from "@/types/respuestaTypes";
import PreguntaSituacional from "@/components/ui/preguntas/PreguntaSituacional";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

// Tipos de pregunta
import PreguntaAbierta from "@/components/ui/preguntas/PreguntaAbierta";
import PreguntaDicotomica from "@/components/ui/preguntas/PreguntaDicotomica";
import PreguntaFrecuenciaTemporal from "@/components/ui/preguntas/PreguntaFrecuenciaTemporal";
import PreguntaLikert from "@/components/ui/preguntas/PreguntaLikert";
import PreguntaRanking from "@/components/ui/preguntas/PreguntaRanking";
import PreguntaSeleccionMultiple from "@/components/ui/preguntas/PreguntaSeleccionMultiple";
import PreguntaSemaforo from "@/components/ui/preguntas/PreguntaSemaforo";
import PreguntaSlider from "@/components/ui/preguntas/PreguntaSlider";

type ResMapa = Record<number, string>;

const SAVE_EVERY = 3; // guarda cada N respuestas nuevas
const SAVE_DEBOUNCE_MS = 1200; // o luego de X ms sin cambios
const SAVE_MAX_INTERVAL_MS = 20000; // como máximo cada 20s

export default function ResponderEvaluacion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const evaluacionId = Number(id);

  const { userId } = useAuth();
  const usuarioId = userId ? Number(userId) : 0;

  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [res, setRes] = useState<ResMapa>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [evalMeta, setEvalMeta] = useState<{
    nombre: string;
    descripcion?: string | null;
  } | null>(null);

  // Navegación paso a paso
  const [idx, setIdx] = useState(0);
  const actual = preguntas[idx];
  const total = preguntas.length;

  const respondidas = useMemo(
    () => preguntas.reduce((acc, p) => (res[p.id]?.trim() ? acc + 1 : acc), 0),
    [preguntas, res]
  );
  const progresoPct = total ? Math.round((respondidas / total) * 100) : 0;

  const obligatorias = useMemo(
    () => preguntas.filter((p) => p.es_obligatoria),
    [preguntas]
  );

  // Carga inicial
  useEffect(() => {
    if (!id || Number.isNaN(evaluacionId)) {
      toast({ title: "Evaluación no válida", variant: "destructive" });
      navigate("/mis-evaluaciones", { replace: true });
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [qs, prev, meta] = await Promise.all([
          obtenerPreguntas(evaluacionId),
          obtenerRespuestasPorUsuarioYEvaluacion(usuarioId, evaluacionId).catch(
            () => [] as Respuesta[]
          ),
          obtenerEvaluacion(evaluacionId).catch(() => null),
        ]);

        if (!mounted) return;

        setPreguntas(qs);
        if (meta)
          setEvalMeta({
            nombre: meta.nombre,
            descripcion: meta.descripcion ?? null,
          });

        if (prev?.length) {
          const mapa: ResMapa = {};
          for (const r of prev) mapa[r.pregunta_id] = r.valor;
          setRes(mapa);

          // ubicarse en la primera pendiente
          const firstPend = qs.findIndex((p) => !mapa[p.id]);
          setIdx(firstPend >= 0 ? firstPend : 0);
        } else {
          setIdx(0);
        }
      } catch (e: any) {
        toast({
          title: "No pudimos cargar la evaluación",
          description:
            e?.response?.status === 403
              ? "No tienes acceso a esta evaluación."
              : e?.response?.status === 404
              ? "La evaluación no existe."
              : "Inténtalo nuevamente.",
          variant: "destructive",
        });
        navigate("/mis-evaluaciones", { replace: true });
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [evaluacionId, usuarioId, id, navigate]);

  // Normaliza y guarda en estado local
  const setRespuesta = useCallback(
    (preguntaId: number, valor: string | string[]) => {
      const v = Array.isArray(valor)
        ? JSON.stringify(valor)
        : typeof valor === "string"
        ? valor
        : String(valor);
      setRes((prev) => ({ ...prev, [preguntaId]: v }));
    },
    []
  );

  // set + auto avance (solo tipos de 1 clic)
  const setYAvanza = useCallback(
    (preguntaId: number, valor: string | string[]) => {
      setRespuesta(preguntaId, valor);
      if (actual && preguntaId === actual.id && idx < total - 1) {
        setTimeout(() => setIdx((i) => Math.min(i + 1, total - 1)), 120);
      }
    },
    [actual, idx, total, setRespuesta]
  );

  // ---- AUTOSAVE -----------------------------------------------------------
  const savedRef = useRef<ResMapa>({});
  const lastSaveAtRef = useRef<number>(0);
  const debounceRef = useRef<number | undefined>(undefined);

  const flushSave = useCallback(async () => {
    const diffs = Object.entries(res).filter(
      ([pid, v]) => savedRef.current[Number(pid)] !== v
    );
    if (!diffs.length) return;

    try {
      setSaving(true);
      await guardarRespuestasMultiples(
        evaluacionId,
        usuarioId,
        diffs.map(([pregunta_id, valor]) => ({
          pregunta_id: Number(pregunta_id),
          valor,
        }))
      );
      for (const [pid, v] of diffs) savedRef.current[Number(pid)] = v;
      lastSaveAtRef.current = Date.now();
    } catch {
      // silencioso; en el próximo ciclo reintenta
    } finally {
      setSaving(false);
    }
  }, [res, evaluacionId, usuarioId]);

  // programa guardado por umbral/debounce/intervalo máximo
  useEffect(() => {
    const diffsCount = Object.entries(res).filter(
      ([pid, v]) => savedRef.current[Number(pid)] !== v
    ).length;

    if (diffsCount === 0) return;

    const now = Date.now();
    const exceededMaxInterval =
      now - lastSaveAtRef.current >= SAVE_MAX_INTERVAL_MS;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (diffsCount >= SAVE_EVERY || exceededMaxInterval) {
      debounceRef.current = window.setTimeout(() => {
        flushSave();
      }, Math.min(500, SAVE_DEBOUNCE_MS));
    } else {
      debounceRef.current = window.setTimeout(() => {
        flushSave();
      }, SAVE_DEBOUNCE_MS);
    }
  }, [res, flushSave]);

  // flush al salir / ocultar página
  useEffect(() => {
    const doFlush = () => {
      const diffs = Object.entries(res).filter(
        ([pid, v]) => savedRef.current[Number(pid)] !== v
      );
      if (!diffs.length) return;

      guardarRespuestasMultiples(
        evaluacionId,
        usuarioId,
        diffs.map(([pregunta_id, valor]) => ({
          pregunta_id: Number(pregunta_id),
          valor,
        }))
      ).catch(() => {});
    };

    const onHide = () => doFlush();
    const onVis = () => {
      if (document.visibilityState === "hidden") doFlush();
    };

    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [res, evaluacionId, usuarioId]);
  // ------------------------------------------------------------------------

  // Guardado final con validación
  const handleGuardarFinal = async () => {
    const faltantes = obligatorias.filter(
      (p) => !res[p.id] || res[p.id].trim() === ""
    );
    if (faltantes.length) {
      toast({
        title: "Responde las preguntas obligatorias",
        description: `Te faltan ${faltantes.length} pregunta(s) obligatoria(s).`,
        variant: "destructive",
      });
      return;
    }

    const items = Object.entries(res).map(([pregunta_id, valor]) => ({
      pregunta_id: Number(pregunta_id),
      valor,
    }));

    try {
      setSaving(true);
      if (items.length) {
        await guardarRespuestasMultiples(evaluacionId, usuarioId, items);
        for (const [pid, valor] of Object.entries(res)) {
          savedRef.current[Number(pid)] = valor;
        }
        lastSaveAtRef.current = Date.now();
      }
      toast({ title: "Respuestas guardadas" });
      navigate("/mis-evaluaciones", { replace: true });
    } catch (e: any) {
      toast({
        title: "No pudimos guardar",
        description: e?.message ?? "Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6 md:pt-8">
        <Card className="p-6">
          <CardTitle>Cargando evaluación…</CardTitle>
        </Card>
      </div>
    );
  }

  if (!actual) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-6 md:pt-8">
        <Card className="p-6">
          <CardTitle>No hay preguntas para esta evaluación.</CardTitle>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 md:pt-8">
      {/* Header vistoso y temado con el color primario */}
      <div className="sticky top-4 md:top-6 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-primary">
              {evalMeta?.nombre ?? "Evaluación"}
            </CardTitle>
            {evalMeta?.descripcion ? (
              <CardDescription className="line-clamp-2">
                {evalMeta.descripcion}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>
                Progreso: {respondidas}/{total} ({progresoPct}%)
              </span>
              <span>
                Pregunta {idx + 1} de {total}
              </span>
            </div>
            <Progress value={progresoPct} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Pregunta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                Pregunta {idx + 1}
              </span>
              {actual.es_obligatoria && (
                <span className="text-xs text-red-600">Obligatoria</span>
              )}
            </div>

            {/* Render de la pregunta actual según tipo */}
            {actual.tipo_respuesta === "abierta" && (
              <PreguntaAbierta
                pregunta={actual}
                valorActual={res[actual.id]}
                onCambiar={setRespuesta} // <- sin auto avance
              />
            )}

            {actual.tipo_respuesta === "likert" && (
              <PreguntaLikert
                pregunta={actual}
                valorSeleccionado={res[actual.id]}
                onSeleccionar={setYAvanza} // <- con auto avance
              />
            )}

            {actual.tipo_respuesta === "dicotomica" && (
              <PreguntaDicotomica
                pregunta={actual}
                valorSeleccionado={res[actual.id]}
                onSeleccionar={setYAvanza} // <- con auto avance
              />
            )}

            {actual.tipo_respuesta === "frecuencia_temporal" && (
              <PreguntaFrecuenciaTemporal
                pregunta={actual}
                valorSeleccionado={res[actual.id]}
                onSeleccionar={setYAvanza} // <- con auto avance
              />
            )}

            {actual.tipo_respuesta === "seleccion_multiple" && (
              <PreguntaSeleccionMultiple
                pregunta={actual}
                valoresSeleccionados={
                  res[actual.id] ? JSON.parse(res[actual.id]) : []
                }
                onCambiar={setRespuesta} // <- sin auto avance
              />
            )}

            {actual.tipo_respuesta === "ranking" && (
              <PreguntaRanking
                pregunta={actual}
                ordenActual={res[actual.id] ? JSON.parse(res[actual.id]) : []}
                onCambiar={setRespuesta} // <- sin auto avance
              />
            )}

            {actual.tipo_respuesta === "semaforo" && (
              <PreguntaSemaforo
                pregunta={actual}
                valorSeleccionado={res[actual.id]}
                onSeleccionar={setYAvanza} // <- con auto avance
              />
            )}

            {actual.tipo_respuesta === "escala_visual" && (
              <PreguntaSlider
                pregunta={actual}
                valorSeleccionado={res[actual.id]}
                onSeleccionar={setRespuesta} // <- sin auto avance (slider)
              />
            )}

            {actual.tipo_respuesta === "situacional" && (
              <PreguntaSituacional
                pregunta={actual}
                valorSeleccionado={res[actual.id]}
                onSeleccionar={setYAvanza}
              />
            )}

            <Separator className="my-1" />
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={idx === 0 || saving}
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
            >
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {idx < total - 1 ? (
                <Button
                  disabled={saving}
                  onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
                >
                  Siguiente
                </Button>
              ) : (
                <Button disabled={saving} onClick={handleGuardarFinal}>
                  Finalizar y guardar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
