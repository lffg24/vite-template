import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";

import { BarraAccionesMovil } from "@/shared/ui/BotonAccion";
import { BotonPrincipal, BotonSecundario, Panel, ParticipanteLayout } from "@/features/participacion/ParticipanteLayout";
import { Cargando } from "@/features/participacion/Estados";
import { Illustration } from "@/shared/ui/illustration/Illustration";
import { IllustrationSurface } from "@/shared/ui/illustration/IllustrationSurface";
import {
  abrirCalificacion,
  enviarCalificacion,
  errorCalificacion,
  type FormularioCalificacion,
  type PreguntaCalificacion,
} from "@/services/cxPublicoService";

type Fase = "cargando" | "lista" | "enviando" | "confirmada" | "no_disponible" | "error" | "caducada";

function escala(tipo: PreguntaCalificacion["tipo"]): number[] {
  if (tipo.startsWith("NPS_")) return Array.from({ length: 11 }, (_, indice) => indice);
  if (tipo === "CES") return [1, 2, 3, 4, 5, 6, 7];
  return [1, 2, 3, 4, 5];
}

function ayudaEscala(tipo: PreguntaCalificacion["tipo"]): [string, string] {
  if (tipo.startsWith("NPS_")) return ["Nada probable", "Muy probable"];
  if (tipo === "CES") return ["Muy difícil", "Muy fácil"];
  if (tipo === "FACTOR") return ["Valor mínimo", "Valor máximo"];
  return ["Muy insatisfecho", "Muy satisfecho"];
}

export default function CalificacionPublicaPage() {
  const { token = "" } = useParams<{ token: string }>();
  const [fase, setFase] = useState<Fase>("cargando");
  const [formulario, setFormulario] = useState<FormularioCalificacion | null>(null);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [errorPregunta, setErrorPregunta] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(false);
  const intento = useRef<{ huella: string; clave: string } | null>(null);

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setFase("cargando");
    setErrorEnvio(false);
    try {
      const datos = await abrirCalificacion(token, signal);
      if (signal?.aborted) return;
      if (!datos.preguntas.length) {
        setFase("no_disponible");
        return;
      }
      setFormulario(datos);
      setIndice(0);
      setRespuestas({});
      intento.current = null;
      setFase("lista");
    } catch (error) {
      if (signal?.aborted) return;
      setFase(errorCalificacion(error).status === 404 ? "no_disponible" : "error");
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  const pregunta = formulario?.preguntas[indice];
  const total = formulario?.preguntas.length ?? 0;
  const progreso = fase === "confirmada" ? 1 : total ? (indice + 1) / total : undefined;

  async function continuar() {
    if (!formulario || !pregunta || fase === "enviando") return;
    if (pregunta.obligatorio && respuestas[pregunta.id] === undefined) {
      setErrorPregunta(true);
      return;
    }
    setErrorPregunta(false);
    setErrorEnvio(false);
    if (indice < total - 1) {
      setIndice(indice + 1);
      return;
    }

    const valores = formulario.preguntas
      .filter((item) => respuestas[item.id] !== undefined)
      .map((item) => ({ item_id: item.id, valor: respuestas[item.id] }));
    if (!valores.length) {
      setErrorPregunta(true);
      return;
    }
    // Un fallo de red conserva la clave del mismo contenido. Si la persona
    // cambia una respuesta después, ese nuevo intento recibe otra clave.
    const huella = JSON.stringify([formulario.presentacion, valores]);
    if (intento.current?.huella !== huella) intento.current = { huella, clave: crypto.randomUUID() };
    setFase("enviando");
    try {
      await enviarCalificacion(token, {
        presentacion: formulario.presentacion,
        idempotency_key: intento.current.clave,
        respuestas: valores,
      });
      setFase("confirmada");
    } catch (error) {
      const fallo = errorCalificacion(error);
      if (fallo.motivo === "presentacion_vencida") {
        setFase("caducada");
      } else if (fallo.status === 404) {
        setFase("no_disponible");
      } else {
        setErrorEnvio(true);
        setFase("lista");
      }
    }
  }

  if (fase === "cargando") return <ParticipanteLayout ancho="compacto"><Cargando etiqueta="Preparando tu calificación…" /></ParticipanteLayout>;

  if (fase === "confirmada") return (
    <ParticipanteLayout ancho="compacto" progreso={1} progresoEtiqueta="Avance de la calificación">
      <div className="flex flex-1 items-center justify-center py-10 text-center" role="status" aria-live="polite">
        <Panel className="w-full max-w-xl py-10 sm:py-14">
          <IllustrationSurface tone="positive" className="mx-auto h-44 w-44 border-0 sm:h-52 sm:w-52">
            <Illustration name="satisfactorio" size="full" className="h-full" priority />
          </IllustrationSurface>
          <h1 className="mt-5 font-rel-heading text-3xl font-black text-rel-dark">Gracias por tu calificación</h1>
          <p className="mt-3 text-rel-muted">Tu respuesta quedó registrada. Ya puedes cerrar esta ventana.</p>
        </Panel>
      </div>
    </ParticipanteLayout>
  );

  if (fase === "no_disponible" || fase === "error" || fase === "caducada") return (
    <ParticipanteLayout ancho="compacto">
      <div className="flex flex-1 items-center justify-center py-10 text-center">
        <Panel className="w-full max-w-xl py-10 sm:py-14">
          <ClipboardCheck className="mx-auto h-12 w-12 text-rel-primary" aria-hidden="true" />
          <h1 className="mt-5 font-rel-heading text-2xl font-black text-rel-dark">
            {fase === "no_disponible" ? "Esta calificación no está disponible" : fase === "caducada" ? "Actualiza el formulario" : "No pudimos abrir el formulario"}
          </h1>
          <p className="mt-3 text-rel-muted">
            {fase === "no_disponible" ? "Consulta con quien compartió el enlace." : fase === "caducada" ? "La sesión del formulario terminó. Ábrelo de nuevo para ver las preguntas vigentes." : "Revisa tu conexión e inténtalo otra vez."}
          </p>
          {fase !== "no_disponible" && <div className="mx-auto mt-7 max-w-xs"><BotonSecundario onClick={() => void cargar()}><RefreshCw className="h-5 w-5" aria-hidden="true" />Volver a abrir</BotonSecundario></div>}
        </Panel>
      </div>
    </ParticipanteLayout>
  );

  if (!formulario || !pregunta) return null;
  const valores = escala(pregunta.tipo);
  const [minimo, maximo] = ayudaEscala(pregunta.tipo);

  return (
    <ParticipanteLayout ancho="compacto" progreso={progreso} progresoEtiqueta="Avance de la calificación">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pb-5">
        <div className="mb-6 flex items-center gap-4 sm:mb-8 sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-rel-primary">Tu opinión cuenta</p>
            <h1 className="mt-2 font-rel-heading text-2xl font-black text-rel-dark sm:text-3xl">{formulario.titulo}</h1>
            <p className="mt-2 text-sm leading-relaxed text-rel-muted">Responde según tu experiencia. Te tomará menos de un minuto.</p>
          </div>
          <IllustrationSurface tone="neutral" className="h-28 w-28 shrink-0 border-0 sm:h-40 sm:w-40">
            <Illustration name="feedbackRating" size="full" className="h-full" priority />
          </IllustrationSurface>
        </div>

        <Panel className="p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-rel-dark">Pregunta {indice + 1} de {total}</span>
            <span className="text-rel-muted">{Math.round(((indice + 1) / total) * 100)} %</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-rel-border" aria-hidden="true">
            <div className="h-full rounded-full bg-rel-primary transition-[width] duration-rel-panel" style={{ width: `${((indice + 1) / total) * 100}%` }} />
          </div>
          <fieldset className="mt-8" aria-describedby={`ayuda-${pregunta.id}${errorPregunta ? ` error-${pregunta.id}` : ""}`}>
            <legend className="font-rel-heading text-xl font-bold leading-snug text-rel-dark sm:text-2xl">
              {pregunta.enunciado}{pregunta.obligatorio && <span className="ml-1 text-rel-danger" aria-label="obligatoria">*</span>}
            </legend>
            <p id={`ayuda-${pregunta.id}`} className="mt-2 text-sm text-rel-muted">Selecciona un número de la escala.</p>
            <div className={`mt-6 grid gap-2 ${pregunta.tipo.startsWith("NPS_") || pregunta.tipo === "CES" ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-5"}`} role="radiogroup" aria-required={pregunta.obligatorio}>
              {valores.map((valor) => (
                <label key={valor} className="relative cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name={`pregunta-${pregunta.id}`}
                    value={valor}
                    checked={respuestas[pregunta.id] === valor}
                    onChange={() => { setRespuestas((actuales) => ({ ...actuales, [pregunta.id]: valor })); setErrorPregunta(false); setErrorEnvio(false); }}
                    aria-label={`${valor} de ${valores[valores.length - 1]}`}
                  />
                  <span className="flex min-h-[3.5rem] items-center justify-center rounded-rel-control border border-rel-border-strong bg-rel-surface text-base font-bold text-rel-dark transition-colors peer-checked:border-rel-primary peer-checked:bg-rel-accent-subtle peer-checked:text-rel-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rel-primary hover:border-rel-primary">
                    {valor}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex justify-between gap-3 text-xs text-rel-muted"><span>{minimo}</span><span className="text-right">{maximo}</span></div>
            {errorPregunta && <p id={`error-${pregunta.id}`} className="mt-4 text-sm font-semibold text-rel-danger" role="alert">Selecciona una respuesta para continuar.</p>}
          </fieldset>
        </Panel>

        {errorEnvio && <p className="mt-4 rounded-rel-card border border-rel-danger bg-rel-surface p-4 text-sm text-rel-danger" role="alert">No pudimos guardar tu calificación. Inténtalo otra vez; tus respuestas siguen aquí.</p>}

        <BarraAccionesMovil className="mt-auto lg:mt-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {indice > 0 && <BotonSecundario className="sm:w-auto" onClick={() => { setIndice(indice - 1); setErrorPregunta(false); }} disabled={fase === "enviando"}><ArrowLeft className="h-5 w-5" aria-hidden="true" />Anterior</BotonSecundario>}
            <BotonPrincipal className="sm:flex-1" onClick={() => void continuar()} disabled={fase === "enviando"}>
              {fase === "enviando" ? "Guardando…" : indice === total - 1 ? "Enviar calificación" : "Siguiente"}
              {fase !== "enviando" && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
            </BotonPrincipal>
          </div>
        </BarraAccionesMovil>
      </div>
    </ParticipanteLayout>
  );
}
