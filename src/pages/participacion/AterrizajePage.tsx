// src/pages/participacion/AterrizajePage.tsx · D-01 + D-02 + D-99
//
// La primera pantalla que ve alguien que llegó por WhatsApp. Tres estados en una
// ruta porque son un mismo momento: mirar de qué va, decidir entrar, y dar los
// datos.
//
// El nombre de **su** empresa va arriba y grande. Es lo único que hace creíble
// un enlace que llegó por un chat, y sin eso la pantalla parece un fraude.

import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, FileText } from "lucide-react";

import {
  abrirEnlace,
  inscribirse,
  reanudarConDocumento,
} from "@/services/participacionService";
import type {
  Aterrizaje,
  ErrorPublico,
  Identificacion,
  TipoDocumento,
} from "@/types/participacion";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import { Ilustracion } from "@/shared/ui/ilustraciones";
import {
  BotonPrincipal,
  BotonSecundario,
  Panel,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";
import { Cargando, PantallaDeError } from "@/features/participacion/Estados";
import { FormularioIdentidad } from "@/features/participacion/FormularioIdentidad";
import { FormularioReanudacion } from "@/features/participacion/FormularioReanudacion";
import { Illustration, IllustrationSurface } from "@/shared/ui/illustration";

function formatearDuracion(min: number | null): string | null {
  if (!min) return null;
  if (min < 60) return `${min} minutos aprox.`;
  const horas = Math.floor(min / 60);
  const resto = min % 60;
  return resto ? `${horas} h ${resto} min aprox.` : `${horas} h aprox.`;
}

export default function AterrizajePage() {
  const { token = "" } = useParams<{ token: string }>();
  const navegar = useNavigate();
  const consulta = useConsulta<Aterrizaje>(() => abrirEnlace(token), [token]);

  const [paso, setPaso] = useState<"portada" | "datos" | "reanudar">("portada");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<ErrorPublico | null>(null);

  const enviar = useCallback(
    async (datos: Identificacion) => {
      setEnviando(true);
      setErrorEnvio(null);
      try {
        await inscribirse(token, datos);
        navegar("/c/sesion", { replace: true });
      } catch (e) {
        const err = e as ErrorPublico;
        setErrorEnvio(err);
        if (err.motivo === "texto_cambio") {
          // La redacción cambió mientras leía. Se recarga el aterrizaje para
          // presentarle la nueva: registrar cualquiera de las dos versiones
          // sería fabricar un consentimiento sobre un texto que nadie leyó.
          void consulta.refrescar();
          setPaso("portada");
        }
      } finally {
        setEnviando(false);
      }
    },
    [token, navegar, consulta]
  );

  const reanudar = useCallback(
    async (tipoDocumento: TipoDocumento, numeroDocumento: string) => {
      setEnviando(true);
      setErrorEnvio(null);
      try {
        await reanudarConDocumento(token, tipoDocumento, numeroDocumento);
        navegar("/c/sesion", { replace: true });
      } catch (e) {
        setErrorEnvio(e as ErrorPublico);
      } finally {
        setEnviando(false);
      }
    },
    [token, navegar]
  );

  if (consulta.fase === "cargando") {
    return (
      <ParticipanteLayout>
        <Cargando etiqueta="Abriendo tu capacitación…" />
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

  const datos = consulta.datos;
  if (!datos) return null;

  if (paso === "datos") {
    return (
      <ParticipanteLayout progreso={0.15} ancho="amplio">
        <div className="grid flex-1 overflow-hidden rounded-rel-panel border border-rel-border bg-rel-surface shadow-card lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
          <aside className="hidden bg-rel-accent-subtle p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-rel-accent">
                Antes de comenzar
              </p>
              <h1 className="mt-3 font-rel-heading text-3xl font-bold">
                Tus datos protegen tu avance
              </h1>
              <p className="mt-3 leading-relaxed text-rel-muted">
                Te identificamos para guardar el progreso y emitir tu constancia.
              </p>
            </div>
            <IllustrationSurface tone="lavender" className="mt-8">
              <Illustration name="publicCourseWelcome" size="lg" decorative />
            </IllustrationSurface>
          </aside>
          <div className="p-5 sm:p-8 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto">
            {errorEnvio && errorEnvio.motivo !== "texto_cambio" ? (
              <p
                role="alert"
                className="mb-4 rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm text-rel-dark"
              >
                {errorEnvio.message}
              </p>
            ) : null}
            <FormularioIdentidad
              textos={datos.textos}
              enviando={enviando}
              onEnviar={enviar}
            />
          </div>
        </div>
      </ParticipanteLayout>
    );
  }

  if (paso === "reanudar") {
    return (
      <ParticipanteLayout ancho="compacto">
        <Panel className="my-auto p-5 sm:p-8">
          <FormularioReanudacion
            enviando={enviando}
            error={errorEnvio?.message ?? null}
            onEnviar={(tipo, numero) => void reanudar(tipo, numero)}
            onCancelar={() => {
              setErrorEnvio(null);
              setPaso("portada");
            }}
          />
        </Panel>
      </ParticipanteLayout>
    );
  }

  return (
    <ParticipanteLayout ancho="amplio">
      {errorEnvio?.motivo === "texto_cambio" ? (
        <p
          role="alert"
          className="mb-4 rounded-rel-card border border-rel-warning/30 bg-rel-warning-subtle p-3 text-sm text-rel-dark"
        >
          El texto de autorización se actualizó mientras lo leías. Vuelve a
          revisarlo antes de continuar.
        </p>
      ) : null}

      <section className="overflow-hidden rounded-rel-panel border border-rel-border bg-rel-surface shadow-card">
        <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rel-accent">
              {datos.empresa}
            </p>
            <h1 className="mt-3 max-w-3xl font-rel-heading text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              {datos.curso}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-rel-muted sm:text-lg">
              Aprende a tu ritmo. Tu avance queda guardado para que puedas continuar cuando lo necesites.
            </p>
            <dl className="mt-6 flex flex-wrap gap-3 text-sm text-rel-muted">
              <div className="flex items-center gap-2 rounded-rel-control border border-rel-border bg-rel-surface-subtle px-4 py-3">
                <FileText className="h-4 w-4 shrink-0 text-rel-primary" aria-hidden="true" />
                <dt className="sr-only">Lecciones</dt>
                <dd>{datos.lecciones} {datos.lecciones === 1 ? "lección" : "lecciones"}</dd>
              </div>
              {formatearDuracion(datos.duracion_estimada_min) ? (
                <div className="flex items-center gap-2 rounded-rel-control border border-rel-border bg-rel-surface-subtle px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-rel-primary" aria-hidden="true" />
                  <dt className="sr-only">Duración</dt>
                  <dd>{formatearDuracion(datos.duracion_estimada_min)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <IllustrationSurface tone="lavender" className="mx-auto w-full max-w-md">
            <Illustration name="publicCourseWelcome" size="full" decorative priority />
          </IllustrationSurface>
        </div>
        <div className="grid gap-4 border-t border-rel-border bg-rel-surface-subtle p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6 lg:px-10">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-rel-success" aria-hidden="true" />
            <p className="text-sm leading-relaxed">
              Al terminar recibes una <strong className="font-semibold">constancia de asistencia</strong> con folio verificable.
            </p>
          </div>
          {!datos.exige_invitacion ? (
            <div className="flex flex-col gap-3 sm:min-w-56">
              <BotonPrincipal onClick={() => setPaso("datos")}>Comenzar</BotonPrincipal>
              <button
                type="button"
                onClick={() => setPaso("reanudar")}
                className="min-h-11 text-sm font-semibold text-rel-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
              >
                Ya había empezado
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {datos.exige_invitacion ? (
        // Este enlace es escaparate, no puerta.
        //
        // Antes aquí había un «Comenzar» que llevaba al formulario, pedía el
        // documento y terminaba en un 403. El enlace de grupo sigue sirviendo
        // —explica de qué va el curso, y es adonde llega quien perdió el suyo—,
        // pero decirlo ANTES es la diferencia entre una portada y una trampa.
        //
        // No dice si esta persona está o no en la lista de la empresa: eso
        // revelaría quién trabaja allí a cualquiera que abra el enlace.
        <div className="mt-auto pt-6">
          <Panel>
            <div className="flex items-start gap-3">
              <Ilustracion nombre="invitacion" tamano="sm" className="shrink-0" />
              <div>
                <p className="text-sm font-semibold leading-relaxed">
                  Esta capacitación se hace con una invitación personal.
                </p>
                <p className="mt-1 text-sm leading-relaxed text-rel-muted">
                  Por este enlace puedes ver de qué se trata, pero no inscribirte.
                  Quien organiza la capacitación en tu empresa te envía un enlace
                  propio, solo tuyo. Si no te ha llegado, pídeselo.
                </p>
              </div>
            </div>
          </Panel>
          <div className="mt-3">
            <BotonSecundario onClick={() => navegar("/c/sesion")}>Ya había empezado</BotonSecundario>
          </div>
        </div>
      ) : null}
    </ParticipanteLayout>
  );
}
