// src/pages/participacion/FinalizarPage.tsx · D-08
//
// El momento probatorio: aquí se escribe el registro de asistencia.
//
// El resumen va **antes** de confirmar, no después. Una confirmación sobre datos
// que no se vieron no prueba nada, y este registro tiene que sostenerse ante una
// auditoría.
//
// ## Lo que el wireframe tenía y esto no
//
// El wireframe D-08 dibujaba un área de firma con el dedo. **No está**, y no por
// olvido: el backend registra la asistencia sin firma, y capturarla exigiría un
// campo donde guardarla y una decisión sobre si una firma dibujada añade valor
// probatorio al sello HMAC que el registro ya lleva. Fingir el control aquí
// dejaría a la gente firmando en algo que se descarta.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { finalizar, miConstancia, miCurso } from "@/services/participacionService";
import type {
  ConstanciaEmitida,
  ErrorPublico,
  EstadoCurso,
} from "@/types/participacion";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  BotonPrincipal,
  BotonSecundario,
  Panel,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";
import { Cargando, PantallaDeError } from "@/features/participacion/Estados";
import { ConstanciaDocumento } from "@/features/capacitaciones/components/ConstanciaDocumento";
import type { ConstanciaImprimible } from "@/types/constancia";
import { Illustration } from "@/shared/ui/illustration";
import { descargarElementoComoPdf } from "@/shared/pdf/descargarElementoComoPdf";

export default function FinalizarPage() {
  const navegar = useNavigate();
  const consulta = useConsulta<EstadoCurso>(() => miCurso(), []);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [constancia, setConstancia] = useState<ConstanciaEmitida | null>(null);
  const [falloConstancia, setFalloConstancia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = useCallback(async () => {
    setEnviando(true);
    setError(null);
    try {
      const r = await finalizar();
      setConstancia(r.constancia);
      setListo(true);
    } catch (e) {
      const err = e as ErrorPublico;
      setError(
        err.motivo === "orden_no_respetado"
          ? "Todavía te faltan lecciones obligatorias."
          : err.message || "No pudimos registrar tu asistencia. Inténtalo otra vez."
      );
    } finally {
      setEnviando(false);
    }
  }, []);

  // Al volver a una inscripción YA completada —otro dispositivo, la pestaña
  // reabierta— no hay `resultado` en memoria y el folio se perdería. Se vuelve a
  // llamar a `finalizar`, que es idempotente: no registra una segunda asistencia
  // y devuelve la constancia que ya existe.
  //
  // El efecto se declara antes de cualquier salida temprana: las reglas de los
  // hooks no admiten declararlo dentro de la rama que lo necesita.
  const yaCompletada = consulta.datos?.estado === "COMPLETADA";
  useEffect(() => {
    // `falloConstancia` corta el reintento automático: sin él, marcar el fallo
    // re-dispararía el efecto y quedaría un bucle de peticiones contra un
    // endpoint con límite por IP. Volver a intentarlo es decisión de la persona.
    if (!yaCompletada || constancia || falloConstancia) return;
    let vigente = true;
    finalizar()
      .then((r) => {
        if (vigente) setConstancia(r.constancia);
      })
      .catch(() => {
        // **No se traga el error.** Antes sí, y la pantalla se quedaba en
        // «Preparando tu constancia…» para siempre: quien acababa de terminar
        // su curso veía un texto que prometía algo que ya no iba a llegar, sin
        // nada que pulsar. La asistencia está registrada —eso se dice arriba y
        // es cierto—, pero el folio necesita otra petición, y esa puede fallar.
        if (vigente) setFalloConstancia(true);
      });
    return () => {
      vigente = false;
    };
  }, [yaCompletada, constancia, falloConstancia]);

  if (consulta.fase === "cargando") {
    return (
      <ParticipanteLayout>
        <Cargando />
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

  if (listo || curso.estado === "COMPLETADA") {
    return (
      <ParticipanteLayout progreso={1}>
        <div className="flex flex-1 flex-col items-center py-4 text-center">
          <Illustration
            name="certificateReadyBadge"
            size="sm"
            decorative
            priority
            className="max-h-28 w-28"
          />
          {/* Sobrio. Es un documento de cumplimiento, no un logro personal:
              confeti aquí desentona con lo que la persona acaba de hacer. */}
          <h1 className="mt-5 font-rel-heading text-2xl font-black sm:text-3xl">
            Tu asistencia quedó registrada
          </h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-rel-muted">
            Tu empresa verá el registro en su matriz de cumplimiento. Esta es tu
            constancia: puedes descargarla en PDF y verificarla en línea.
          </p>

          <div className="mt-6 w-full text-left">
            {constancia ? (
              <DocumentoDeLaConstancia emitida={constancia} />
            ) : falloConstancia ? (
              <div className="mx-auto max-w-xl rounded-rel-card border border-rel-border bg-rel-surface p-5">
                {/* Dice qué se perdió y qué NO: la asistencia está a salvo. Sin
                    esa distinción, quien lea esto creerá que hay que repetir el
                    curso. */}
                <p className="text-sm leading-relaxed">
                  No pudimos mostrarte el folio de tu constancia.{" "}
                  <strong className="font-semibold">Tu asistencia sí quedó
                  registrada</strong>; esto es solo la consulta del documento.
                </p>
                <div className="mt-4">
                  <BotonSecundario onClick={() => setFalloConstancia(false)}>
                    Volver a intentarlo
                  </BotonSecundario>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-rel-muted" aria-live="polite">
                Preparando tu constancia…
              </p>
            )}
          </div>
        </div>
      </ParticipanteLayout>
    );
  }

  if (!curso.puede_finalizar) {
    return (
      <ParticipanteLayout progreso={curso.obligatorias_completas / Math.max(1, curso.obligatorias_totales)}>
        <div className="flex flex-1 flex-col justify-center text-center">
          <h1 className="font-rel-heading text-xl font-bold">Todavía te falta</h1>
          <p className="mt-3 text-base leading-relaxed text-rel-muted">
            Llevas {curso.obligatorias_completas} de {curso.obligatorias_totales}{" "}
            lecciones obligatorias.
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

  return (
    <ParticipanteLayout progreso={1} ancho="compacto">
      <div className="my-auto w-full rounded-rel-panel border border-rel-border bg-rel-surface p-5 shadow-card sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-rel-accent">
        Paso 3 de 3
      </p>
      <h1 className="mt-2 font-rel-heading text-3xl font-black">
        Confirma tu asistencia
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-rel-muted">
        Revisa el resumen antes de registrar la evidencia de participación.
      </p>

      <Panel className="mt-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-rel-border pb-2">
            <dt className="text-rel-muted">Capacitación</dt>
            <dd className="text-right font-semibold">{curso.curso}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-rel-border pb-2">
            <dt className="text-rel-muted">Versión</dt>
            <dd className="text-right font-semibold">v{curso.numero_version}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-rel-muted">Lecciones completadas</dt>
            <dd className="text-right font-semibold">
              {curso.obligatorias_completas} de {curso.obligatorias_totales}
            </dd>
          </div>
        </dl>
      </Panel>

      <div className="mt-4 flex items-start gap-3 rounded-rel-card bg-rel-info-subtle p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rel-info" aria-hidden="true" />
        <p className="text-sm leading-relaxed">
          Este registro queda como evidencia ante tu empresa y ante una
          auditoría. No se puede modificar después.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-auto space-y-3 pt-6">
        <BotonPrincipal onClick={confirmar} disabled={enviando}>
          {enviando ? "Registrando…" : "Registrar asistencia"}
        </BotonPrincipal>
        <BotonSecundario onClick={() => navegar("/c/sesion")}>
          Volver al curso
        </BotonSecundario>
      </div>
      </div>
    </ParticipanteLayout>
  );
}


/**
 * D-09. El documento completo, y lo que se hace con él.
 *
 * El folio y el código ya llegaron con `finalizar`; el documento es otra
 * petición y puede fallar. Si falla, queda el panel con folio y código —que es
 * lo que de verdad hace falta para pedirla o verificarla— en lugar de una
 * pantalla vacía.
 */
function DocumentoDeLaConstancia({ emitida }: { emitida: ConstanciaEmitida }) {
  const consulta = useConsulta<ConstanciaImprimible>(() => miConstancia(), [emitida.codigo_verificacion]);
  const urlVerificacion = `${window.location.origin}/c/verificar/${encodeURIComponent(emitida.codigo_verificacion)}`;
  const documentoRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  if (consulta.fase === "cargando") {
    return (
      <p className="text-center text-sm text-rel-muted" aria-live="polite">
        Preparando tu constancia…
      </p>
    );
  }
  if (consulta.fase === "error" || !consulta.datos) {
    return (
      <div className="mx-auto max-w-xl">
        <ConstanciaEmitidaPanel constancia={emitida} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={documentoRef}>
        <ConstanciaDocumento constancia={consulta.datos} urlVerificacion={urlVerificacion} />
      </div>
      <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 print:hidden">
        <BotonPrincipal
          disabled={descargando}
          onClick={async () => {
            const elemento = documentoRef.current?.querySelector<HTMLElement>(".hoja-constancia");
            if (!elemento) return;
            setDescargando(true);
            setErrorDescarga(null);
            try {
              await descargarElementoComoPdf(
                elemento,
                `Constancia-${consulta.datos.codigo_verificacion}`,
              );
            } catch {
              setErrorDescarga("No pudimos preparar el PDF. Inténtalo otra vez.");
            } finally {
              setDescargando(false);
            }
          }}
        >
          <span className="inline-flex items-center gap-2">
            {descargando ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}
            {descargando ? "Preparando PDF…" : "Descargar PDF"}
          </span>
        </BotonPrincipal>
        <Link
          to={`/c/verificar/${encodeURIComponent(emitida.codigo_verificacion)}`}
          className="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-rel-control border border-rel-primary bg-rel-surface px-5 text-base font-semibold text-rel-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
        >
          <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Verificar
        </Link>
      </div>
      {errorDescarga ? <p role="alert" className="mx-auto max-w-4xl text-center text-sm text-rel-danger print:hidden">{errorDescarga}</p> : null}
      <p className="mx-auto max-w-4xl text-center text-xs text-rel-muted print:hidden">El archivo se descarga en formato PDF horizontal. Cualquiera puede comprobarlo con el código, sin crear una cuenta.</p>
    </div>
  );
}

/**
 * D-09. El folio y el código, en la misma pantalla en que se terminó.
 *
 * Es el respaldo de `DocumentoDeLaConstancia` cuando el documento no llega: la
 * constancia existe, tiene folio, y cualquiera puede comprobarla tecleando el
 * código. El papel es una representación de esto, no al revés.
 */
function ConstanciaEmitidaPanel({ constancia }: { constancia: ConstanciaEmitida }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(constancia.codigo_verificacion);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // El portapapeles no está disponible en todos los navegadores ni fuera de
      // HTTPS. El código está a la vista y se puede copiar a mano, así que no se
      // muestra un error por perder un atajo.
    }
  }

  return (
    <Panel className="mt-6 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        Tu constancia
      </p>

      <dl className="mt-3 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-rel-muted">Folio</dt>
          <dd className="font-semibold tabular-nums">N.º {constancia.folio}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-rel-muted">Vigencia</dt>
          <dd className="font-semibold">
            {constancia.vence_el
              ? `Hasta ${new Date(constancia.vence_el).toLocaleDateString("es-CO")}`
              : "No vence"}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-rel-muted">
        Código de verificación
      </p>
      {/* Grande y monoespaciado: se dicta por teléfono y se copia a mano. El
          alfabeto ya excluye los caracteres confundibles; la tipografía termina
          el trabajo. */}
      <p className="mt-1 font-mono text-2xl font-bold tracking-[0.15em] tabular-nums">
        {constancia.codigo_verificacion}
      </p>

      <button
        type="button"
        onClick={copiar}
        className="mt-3 inline-flex min-h-[2.75rem] items-center gap-2 text-sm font-semibold text-rel-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
        {copiado ? "Copiado" : "Copiar el código"}
      </button>
      {/* `aria-live` para que un lector de pantalla anuncie el resultado: sin
          esto, pulsar el botón no produce ningún cambio audible. */}
      <span className="sr-only" aria-live="polite">
        {copiado ? "Código copiado al portapapeles" : ""}
      </span>

      <p className="mt-4 border-t border-rel-border pt-3 text-sm leading-relaxed text-rel-muted">
        Guárdalo. Con ese código, cualquiera puede comprobar tu constancia en{" "}
        <span className="font-semibold text-rel-dark">/c/verificar</span> sin
        necesidad de una cuenta.
      </p>
    </Panel>
  );
}
