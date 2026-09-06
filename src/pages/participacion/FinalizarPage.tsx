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

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { finalizar, miCurso } from "@/services/participacionService";
import type { ErrorPublico, EstadoCurso } from "@/types/participacion";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  BotonPrincipal,
  BotonSecundario,
  Panel,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";
import { Cargando, PantallaDeError } from "@/features/participacion/Estados";

export default function FinalizarPage() {
  const navegar = useNavigate();
  const consulta = useConsulta<EstadoCurso>(() => miCurso(), []);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = useCallback(async () => {
    setEnviando(true);
    setError(null);
    try {
      await finalizar();
      setListo(true);
    } catch (e) {
      const err = e as ErrorPublico;
      setError(
        err.motivo === "orden_no_respetado"
          ? "Todavía te faltan lecciones obligatorias."
          : "No pudimos registrar tu asistencia. Inténtalo otra vez."
      );
    } finally {
      setEnviando(false);
    }
  }, []);

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
        <div className="flex flex-1 flex-col justify-center text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-rel-success" aria-hidden="true" />
          {/* Sobrio. Es un documento de cumplimiento, no un logro personal:
              confeti aquí desentona con lo que la persona acaba de hacer. */}
          <h1 className="mt-4 font-rel-heading text-2xl font-bold">
            Tu asistencia quedó registrada
          </h1>
          <p className="mt-3 text-base leading-relaxed text-rel-muted">
            Ya puedes cerrar esta página. Tu empresa verá el registro en su
            matriz de cumplimiento.
          </p>
          <p className="mt-6 text-sm text-rel-muted">
            La constancia descargable llegará más adelante; todavía no está
            disponible.
          </p>
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
    <ParticipanteLayout progreso={1}>
      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        Paso 3 de 3
      </p>
      <h1 className="mt-1 font-rel-heading text-2xl font-bold">
        Registra tu asistencia
      </h1>

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
    </ParticipanteLayout>
  );
}
