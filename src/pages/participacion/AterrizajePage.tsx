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
} from "@/services/participacionService";
import type { Aterrizaje, ErrorPublico, Identificacion } from "@/types/participacion";
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
import { SecretoDeReanudacion } from "@/features/participacion/SecretoDeReanudacion";

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

  const [paso, setPaso] = useState<"portada" | "datos">("portada");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<ErrorPublico | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);

  const enviar = useCallback(
    async (datos: Identificacion) => {
      setEnviando(true);
      setErrorEnvio(null);
      try {
        const r = await inscribirse(token, datos);
        if (r.secreto) {
          // Se muestra una vez y no se guarda en el navegador. La sesión ya va
          // en la cookie `HttpOnly`; guardar el secreto en `localStorage` lo
          // dejaría legible por cualquier script, que es justo lo que la cookie
          // evita.
          setSecreto(r.secreto);
        } else {
          navegar("/c/sesion", { replace: true });
        }
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

  if (secreto) {
    return (
      <ParticipanteLayout progreso={0.33}>
        <SecretoDeReanudacion
          secreto={secreto}
          alContinuar={() => navegar("/c/sesion", { replace: true })}
        />
      </ParticipanteLayout>
    );
  }

  if (paso === "datos") {
    return (
      <ParticipanteLayout progreso={0.15}>
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
      </ParticipanteLayout>
    );
  }

  return (
    <ParticipanteLayout>
      {errorEnvio?.motivo === "texto_cambio" ? (
        <p
          role="alert"
          className="mb-4 rounded-rel-card border border-rel-warning/30 bg-rel-warning-subtle p-3 text-sm text-rel-dark"
        >
          El texto de autorización se actualizó mientras lo leías. Vuelve a
          revisarlo antes de continuar.
        </p>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        {datos.empresa}
      </p>
      <h1 className="mt-2 font-rel-heading text-2xl font-bold leading-tight">
        {datos.curso}
      </h1>

      <dl className="mt-4 space-y-2 text-sm text-rel-muted">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Lecciones</dt>
          <dd>
            {datos.lecciones} {datos.lecciones === 1 ? "lección" : "lecciones"}
          </dd>
        </div>
        {formatearDuracion(datos.duracion_estimada_min) ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Duración</dt>
            {/* La duración va ANTES de empezar: quien está en turno decide si
                tiene el rato, y descubrirlo a mitad es lo que hace abandonar. */}
            <dd>{formatearDuracion(datos.duracion_estimada_min)}</dd>
          </div>
        ) : null}
      </dl>

      <Panel className="mt-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-rel-success"
            aria-hidden="true"
          />
          {/* Ni «descargable» ni «te la enviamos»: no hay PDF ni correo. Se
              promete exactamente lo que la pantalla de cierre entrega — el folio
              y el código—, porque prometer aquí lo que no existe convierte el
              final del curso en una decepción justo donde había que dar
              confianza. */}
          <p className="text-sm leading-relaxed">
            Al terminar recibes tu{" "}
            <strong className="font-semibold">constancia de asistencia</strong>:
            un registro con folio y un código con el que cualquiera puede
            verificarla.
          </p>
        </div>
      </Panel>

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
            <BotonSecundario onClick={() => navegar("/c/sesion")}>
              Ya había empezado
            </BotonSecundario>
          </div>
        </div>
      ) : (
        <div className="mt-auto space-y-3 pt-6">
          <BotonPrincipal onClick={() => setPaso("datos")}>Comenzar</BotonPrincipal>
          <BotonSecundario onClick={() => navegar("/c/sesion")}>
            Ya había empezado
          </BotonSecundario>
        </div>
      )}
    </ParticipanteLayout>
  );
}
