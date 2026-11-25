import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";

import { BarraAccionesMovil } from "@/shared/ui/BotonAccion";
import { BotonPrincipal, BotonSecundario, Panel, ParticipanteLayout } from "@/features/participacion/ParticipanteLayout";
import { Cargando } from "@/features/participacion/Estados";
import { Illustration } from "@/shared/ui/illustration/Illustration";
import { IllustrationSurface } from "@/shared/ui/illustration/IllustrationSurface";
import { Caja } from "@/shared/ui/Caja";
import { Casilla } from "@/shared/ui/Casilla";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  abrirCalificacion,
  enviarCalificacion,
  errorCalificacion,
  type ContactoCalificacion,
  type FormularioCalificacion,
  type PreguntaCalificacion,
} from "@/services/cxPublicoService";

type Fase = "cargando" | "lista" | "enviando" | "confirmada" | "no_disponible" | "error" | "caducada";

const SIN_DATOS = { nombre: "", correo: "", telefono: "" };

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
  // El paso de contacto va DESPUÉS de la última pregunta: la calificación es
  // lo que se vino a dar, y los datos personales son un añadido voluntario.
  const [enContacto, setEnContacto] = useState(false);
  const [datos, setDatos] = useState(SIN_DATOS);
  // Arranca en falso y sin premarcar: el consentimiento se otorga, no se
  // hereda de un valor por defecto.
  const [consiente, setConsiente] = useState(false);
  const [errorContacto, setErrorContacto] = useState("");
  const intento = useRef<{ huella: string; clave: string } | null>(null);
  const avanceAutomatico = useRef<number | null>(null);
  const tiempoTransicion = useRef<number | null>(null);
  const seleccionConFlechas = useRef(false);
  const tituloPregunta = useRef<HTMLLegendElement>(null);
  const [transicionPregunta, setTransicionPregunta] = useState(false);

  function cancelarAvanceAutomatico() {
    if (avanceAutomatico.current !== null) {
      window.clearTimeout(avanceAutomatico.current);
      avanceAutomatico.current = null;
    }
  }

  function cambiarPregunta(siguiente: number) {
    cancelarAvanceAutomatico();
    if (tiempoTransicion.current !== null) window.clearTimeout(tiempoTransicion.current);
    setTransicionPregunta(true);
    tiempoTransicion.current = window.setTimeout(() => {
      setIndice(siguiente);
      tiempoTransicion.current = window.setTimeout(() => {
        tiempoTransicion.current = null;
        setTransicionPregunta(false);
      }, 30);
    }, 150);
  }

  useEffect(() => () => {
    cancelarAvanceAutomatico();
    if (tiempoTransicion.current !== null) window.clearTimeout(tiempoTransicion.current);
  }, []);
  useEffect(() => { tituloPregunta.current?.focus(); }, [indice]);

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
      setEnContacto(false);
      setDatos(SIN_DATOS);
      setConsiente(false);
      setErrorContacto("");
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
      cambiarPregunta(indice + 1);
      return;
    }

    // Esta versión pide contacto: hay un paso más antes de enviar.
    if (formulario.contacto) {
      setEnContacto(true);
      return;
    }
    await enviar(null);
  }

  function seleccionarRespuesta(valor: number) {
    setRespuestas((actuales) => ({ ...actuales, [pregunta!.id]: valor }));
    setErrorPregunta(false);
    setErrorEnvio(false);
    cancelarAvanceAutomatico();

    // Las flechas forman parte del patrón de teclado de un radio: permiten
    // explorar la escala antes de confirmar el paso con el botón Siguiente.
    if (seleccionConFlechas.current || indice >= total - 1) return;
    avanceAutomatico.current = window.setTimeout(() => {
      avanceAutomatico.current = null;
      cambiarPregunta(indice + 1);
    }, 420);
  }

  /** Envía la calificación. `contacto` a `null` es el camino anónimo, y está
   *  disponible siempre: negar los datos no puede costar la calificación. */
  async function enviar(contacto: ContactoCalificacion | null) {
    if (!formulario || fase === "enviando") return;
    const valores = formulario.preguntas
      .filter((item) => respuestas[item.id] !== undefined)
      .map((item) => ({ item_id: item.id, valor: respuestas[item.id] }));
    if (!valores.length) {
      setEnContacto(false);
      setErrorPregunta(true);
      return;
    }
    // Un fallo de red conserva la clave del mismo contenido. Si la persona
    // cambia una respuesta después, ese nuevo intento recibe otra clave.
    //
    // El contacto NO entra en la huella: la clave identifica un intento de
    // calificación, y meterlo aquí haría que reenviar con el correo corregido
    // creara un envío nuevo, contando dos veces la misma opinión.
    const huella = JSON.stringify([formulario.presentacion, valores]);
    if (intento.current?.huella !== huella) intento.current = { huella, clave: crypto.randomUUID() };
    setErrorEnvio(false);
    setErrorContacto("");
    setFase("enviando");
    try {
      await enviarCalificacion(token, {
        presentacion: formulario.presentacion,
        idempotency_key: intento.current.clave,
        respuestas: valores,
        contacto,
      });
      setFase("confirmada");
    } catch (error) {
      const fallo = errorCalificacion(error);
      if (fallo.motivo === "presentacion_vencida" || fallo.motivo === "autorizacion_actualizada") {
        // La autorización se republicó mientras la persona diligenciaba. No se
        // registra ninguna de las dos redacciones: hay que presentarla de nuevo.
        setFase("caducada");
      } else if (fallo.status === 404) {
        setFase("no_disponible");
      } else if (fallo.motivo === "contacto_invalido" || fallo.motivo === "respuesta_invalida") {
        // Rechazos que la persona puede corregir: se queda donde está, con el
        // mensaje del servidor y sus datos intactos.
        setErrorContacto(fallo.mensaje || "Revisa los datos antes de enviar.");
        setFase("lista");
      } else {
        setErrorEnvio(true);
        setFase("lista");
      }
    }
  }

  function enviarConContacto() {
    const autorizacion = formulario?.contacto?.autorizacion;
    if (!autorizacion) return;
    if (!consiente) {
      setErrorContacto("Marca la autorización de tratamiento de datos para dejar tus datos.");
      return;
    }
    const nombre = datos.nombre.trim();
    const correo = datos.correo.trim();
    if (!nombre || !correo) {
      setErrorContacto("El nombre y el correo son obligatorios para que podamos contactarte.");
      return;
    }
    const telefono = datos.telefono.trim();
    void enviar({
      nombre,
      correo,
      // Solo viaja si esta versión lo pidió; el servidor rechaza un campo que
      // la persona no vio que se le pedía.
      telefono: formulario?.contacto?.pide_telefono && telefono ? telefono : null,
      consentimiento: true,
      texto_id_presentado: autorizacion.texto_id,
    });
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

  // Paso de contacto. Va aparte y no dentro del recorrido de preguntas: no es
  // una pregunta más, es una decisión distinta y con dos salidas válidas.
  if (enContacto && formulario?.contacto) {
    const { pide_telefono: pideTelefono, autorizacion } = formulario.contacto;
    return (
      <ParticipanteLayout ancho="compacto" progreso={1} progresoEtiqueta="Avance de la calificación">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pb-5">
          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-rel-primary">Último paso, opcional</p>
            <h1 className="mt-2 font-rel-heading text-2xl font-black text-rel-dark sm:text-3xl">¿Quieres que te contactemos?</h1>
            <p className="mt-2 text-sm leading-relaxed text-rel-muted">Tu calificación ya está lista para enviarse. Dejar tus datos es voluntario: puedes enviarla sin ellos y seguirá contando igual.</p>
          </div>

          <Panel className="p-5 sm:p-8">
            <div className="grid gap-4">
              <div>
                <label htmlFor="cx-contacto-nombre" className="block text-sm font-bold text-rel-dark">Nombre <span className="text-rel-danger" aria-label="obligatorio">*</span></label>
                <Input id="cx-contacto-nombre" type="text" autoComplete="name" maxLength={160} value={datos.nombre}
                  onChange={(e) => { setDatos((a) => ({ ...a, nombre: e.target.value })); setErrorContacto(""); }}
                  disabled={fase === "enviando"}
                  className="mt-2 min-h-12" />
              </div>
              <div>
                <label htmlFor="cx-contacto-correo" className="block text-sm font-bold text-rel-dark">Correo electrónico <span className="text-rel-danger" aria-label="obligatorio">*</span></label>
                <Input id="cx-contacto-correo" type="email" inputMode="email" autoComplete="email" maxLength={200} value={datos.correo}
                  onChange={(e) => { setDatos((a) => ({ ...a, correo: e.target.value })); setErrorContacto(""); }}
                  disabled={fase === "enviando"}
                  className="mt-2 min-h-12" />
              </div>
              {pideTelefono ? <div>
                <label htmlFor="cx-contacto-telefono" className="block text-sm font-bold text-rel-dark">Teléfono <small className="font-normal text-rel-muted">(opcional)</small></label>
                <Input id="cx-contacto-telefono" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={datos.telefono}
                  onChange={(e) => { setDatos((a) => ({ ...a, telefono: e.target.value })); setErrorContacto(""); }}
                  disabled={fase === "enviando"}
                  className="mt-2 min-h-12" />
              </div> : null}
            </div>

            <div className="mt-6 border-t border-rel-border pt-6">
              {autorizacion.finalidad ? <p className="text-sm text-rel-dark"><strong className="font-bold">Para qué los usamos:</strong> {autorizacion.finalidad}</p> : null}
              <Casilla className="mt-4" marcada={consiente} deshabilitada={fase === "enviando"}
                alCambiar={(marcada) => { setConsiente(marcada); setErrorContacto(""); }}
                etiqueta={<>Autorizo el tratamiento de mis datos personales según la política de tratamiento de datos. <span className="text-rel-danger" aria-label="obligatorio">*</span></>} />
              <Caja como="details" tono="hundida" className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-rel-primary">Leer la política de tratamiento de datos</summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-rel-muted">{autorizacion.contenido}</p>
              </Caja>
            </div>

            {errorContacto ? <p className="mt-5 text-sm font-semibold text-rel-danger" role="alert">{errorContacto}</p> : null}
          </Panel>

          {errorEnvio && <Caja como="p" tono="peligro" className="mt-4 text-sm text-rel-danger" role="alert">No pudimos guardar tu calificación. Inténtalo otra vez; tus respuestas siguen aquí.</Caja>}

          <BarraAccionesMovil className="mt-auto lg:mt-6">
            <div className="flex flex-col gap-3">
              <BotonPrincipal onClick={enviarConContacto} disabled={fase === "enviando"}>
                {fase === "enviando" ? "Enviando…" : "Enviar con mis datos"}
                {fase !== "enviando" && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
              </BotonPrincipal>
              <BotonSecundario onClick={() => void enviar(null)} disabled={fase === "enviando"}>Enviar sin dejar mis datos</BotonSecundario>
              <Button type="button" variant="relGhost" onClick={() => { setEnContacto(false); setErrorContacto(""); }} disabled={fase === "enviando"}
                className="self-center">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mis respuestas
              </Button>
            </div>
          </BarraAccionesMovil>
        </div>
      </ParticipanteLayout>
    );
  }

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

        <Panel className={`p-5 transition-[opacity,translate] duration-rel-panel sm:p-8 ${transicionPregunta ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100"}`}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-rel-dark">Pregunta {indice + 1} de {total}</span>
            <span className="text-rel-muted">{Math.round(((indice + 1) / total) * 100)} %</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-rel-border" aria-hidden="true">
            <div className="h-full rounded-full bg-rel-primary transition-[width] duration-rel-panel" style={{ width: `${((indice + 1) / total) * 100}%` }} />
          </div>
          <fieldset className="mt-8" aria-describedby={`ayuda-${pregunta.id}${errorPregunta ? ` error-${pregunta.id}` : ""}`}>
            <legend ref={tituloPregunta} tabIndex={-1} className="rounded-sm font-rel-heading text-xl font-bold leading-snug text-rel-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-rel-primary sm:text-2xl">
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
                    disabled={fase === "enviando" || transicionPregunta}
                    onKeyDown={(evento) => { seleccionConFlechas.current = evento.key.startsWith("Arrow"); }}
                    onKeyUp={() => { seleccionConFlechas.current = false; }}
                    onBlur={() => { seleccionConFlechas.current = false; }}
                    onChange={() => seleccionarRespuesta(valor)}
                    aria-label={`${valor} de ${valores[valores.length - 1]}`}
                  />
                  <span className="flex min-h-14 items-center justify-center rounded-rel-control border border-rel-border-strong bg-rel-surface text-base font-bold text-rel-dark transition-colors peer-checked:border-rel-primary peer-checked:bg-rel-accent-subtle peer-checked:text-rel-primary peer-focus-visible:outline-solid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rel-primary hover:border-rel-primary">
                    {valor}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex justify-between gap-3 text-xs text-rel-muted"><span>{minimo}</span><span className="text-right">{maximo}</span></div>
            {errorPregunta && <p id={`error-${pregunta.id}`} className="mt-4 text-sm font-semibold text-rel-danger" role="alert">Selecciona una respuesta para continuar.</p>}
          </fieldset>
        </Panel>

        {errorEnvio && <Caja como="p" tono="peligro" className="mt-4 text-sm text-rel-danger" role="alert">No pudimos guardar tu calificación. Inténtalo otra vez; tus respuestas siguen aquí.</Caja>}
        {errorContacto && <Caja como="p" tono="peligro" className="mt-4 text-sm text-rel-danger" role="alert">{errorContacto}</Caja>}

        <BarraAccionesMovil className="mt-auto lg:mt-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {indice > 0 && <BotonSecundario className="sm:w-auto" onClick={() => { setIndice(indice - 1); setErrorPregunta(false); }} disabled={fase === "enviando"}><ArrowLeft className="h-5 w-5" aria-hidden="true" />Anterior</BotonSecundario>}
            <BotonPrincipal className="sm:flex-1" onClick={() => void continuar()} disabled={fase === "enviando"}>
              {fase === "enviando" ? "Guardando…" : indice < total - 1 ? "Siguiente" : formulario.contacto ? "Continuar" : "Enviar calificación"}
              {fase !== "enviando" && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
            </BotonPrincipal>
          </div>
        </BarraAccionesMovil>
      </div>
    </ParticipanteLayout>
  );
}
