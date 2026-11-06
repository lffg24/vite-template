// src/features/participacion/Evaluacion.tsx · D-07
//
// El cuestionario que responde el participante.
//
// Una pregunta por pantalla, como el resto del recorrido. No es preferencia
// estética: es un teléfono de gama media con una mano ocupada, y una lista de
// cinco preguntas con veinte opciones obliga a desplazar para comprobar qué se
// marcó. Con una por pantalla, lo que se ve es lo que se está respondiendo.
//
// **Nada se califica aquí.** El componente reúne índices y los manda; la nota
// la pone el servidor. Un puntaje calculado en el navegador es un puntaje que
// cualquiera escribe con la consola abierta, y acabaría dentro de una
// constancia.
//
// Las opciones son `OpcionesExcluyentes`, el mismo componente que usa la
// administración para elegir el modo de identidad y que Psicosocial usa en sus
// preguntas. Eso es lo que hace que responder aquí se sienta igual que
// responder allí, y que arreglar el foco una vez lo arregle en los tres sitios.

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { OpcionesExcluyentes } from "@/shared/ui/OpcionesExcluyentes";
import { OpcionesMultiples } from "@/shared/ui/OpcionesMultiples";
import { BotonPrincipal } from "@/features/participacion/ParticipanteLayout";
import type { EvaluacionPublica, IntentoCalificado } from "@/types/participacion";

/** Índice de opción como cadena: `OpcionesExcluyentes` trabaja con claves. */
const clave = (i: number) => String(i);

export function Evaluacion({
  evaluacion,
  enviando,
  error,
  resultado,
  alEnviar,
  alReintentar,
  alTerminar,
}: {
  evaluacion: EvaluacionPublica;
  enviando: boolean;
  error: string | null;
  /** El del envío recién hecho. `null` mientras no se haya enviado nada. */
  resultado: IntentoCalificado | null;
  alEnviar: (respuestas: (number | number[])[]) => void;
  alReintentar: () => void;
  alTerminar: () => void;
}) {
  const [actual, setActual] = useState(0);
  // Un índice, o varios si la pregunta admite varias. La forma la decide el
  // TIPO, no la pantalla: mandar un índice suelto donde se esperan varios es
  // un envío que el servidor rechaza.
  const [respuestas, setRespuestas] = useState<Record<number, number | number[]>>({});

  const total = evaluacion.preguntas.length;
  const pregunta = evaluacion.preguntas[actual];
  const respondida = (i: number) => {
    const r = respuestas[i];
    return Array.isArray(r) ? r.length > 0 : r !== undefined;
  };
  const respondidas = evaluacion.preguntas.filter((_, i) => respondida(i)).length;
  const esUltima = actual >= total - 1;

  // --- ya hay veredicto ------------------------------------------------------
  if (resultado) {
    return (
      <Veredicto
        resultado={resultado}
        alReintentar={() => {
          setRespuestas({});
          setActual(0);
          alReintentar();
        }}
        alTerminar={alTerminar}
      />
    );
  }

  // Aprobada en una sesión anterior, o sin intentos: no se vuelve a preguntar.
  if (!evaluacion.puede_intentar) {
    return (
      <div className="mt-5 flex-1 space-y-4">
        <div
          className={`rounded-rel-card border p-5 text-center ${
            evaluacion.aprobado
              ? "border-rel-success/30 bg-rel-success-subtle"
              : "border-rel-warning/30 bg-rel-warning-subtle"
          }`}
        >
          <p className="font-rel-heading text-lg font-bold">
            {evaluacion.aprobado ? "Ya aprobaste esta evaluación" : "Se acabaron los intentos"}
          </p>
          <p className="mt-1 text-sm text-rel-muted">
            {evaluacion.mejor_puntaje !== null
              ? `Tu mejor resultado fue ${evaluacion.mejor_puntaje} %.`
              : null}{" "}
            {evaluacion.aprobado
              ? "Volver a responder solo podría empeorar lo que quedó registrado."
              : "Habla con quien organiza la capacitación en tu empresa."}
          </p>
        </div>
        <BotonPrincipal onClick={alTerminar}>Volver al curso</BotonPrincipal>
      </div>
    );
  }

  return (
    <div className="mt-5 flex-1 space-y-5">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
            Pregunta {actual + 1} de {total}
          </p>
          <p className="text-xs text-rel-muted">
            Intento {evaluacion.intentos_usados + 1} de {evaluacion.intentos_max}
          </p>
        </div>
        {/* La barra mide preguntas RESPONDIDAS, no la que se está viendo:
            avanzar sin contestar no es progreso. */}
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-rel-neutral-subtle"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={respondidas}
          aria-label="Preguntas respondidas"
        >
          <div
            className="h-full bg-rel-primary transition-[width] motion-reduce:transition-none"
            style={{ width: `${(respondidas / total) * 100}%` }}
          />
        </div>
      </div>

      {pregunta.tipo === "OPCION_MULTIPLE" ? (
        <OpcionesMultiples
          nombre={`pregunta-${actual}`}
          leyenda={pregunta.enunciado}
          ayuda="Marca todas las que apliquen."
          valores={((respuestas[actual] as number[]) ?? []).map(clave)}
          alCambiar={(v) =>
            setRespuestas((r) => ({ ...r, [actual]: v.map(Number).sort((a, b) => a - b) }))
          }
          opciones={pregunta.opciones.map((texto, i) => ({
            valor: clave(i),
            titulo: texto,
          }))}
        />
      ) : (
        <OpcionesExcluyentes
          nombre={`pregunta-${actual}`}
          leyenda={pregunta.enunciado}
          valor={
            respuestas[actual] === undefined ? "" : clave(respuestas[actual] as number)
          }
          alCambiar={(v) => setRespuestas((r) => ({ ...r, [actual]: Number(v) }))}
          opciones={pregunta.opciones.map((texto, i) => ({
            valor: clave(i),
            titulo: texto,
            descripcion: "",
          }))}
        />
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        {actual > 0 ? (
          <button
            type="button"
            onClick={() => setActual((a) => a - 1)}
            className="min-h-[3rem] shrink-0 rounded-rel-control border border-rel-border px-4 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
          >
            Anterior
          </button>
        ) : null}

        {esUltima ? (
          <BotonPrincipal
            // Se exige haberlas respondido TODAS. Mandar menos calificaría las
            // que faltan como fallos, y se perdería un intento por un descuido
            // en vez de por no saber. El servidor lo rechaza igual.
            disabled={enviando || respondidas < total}
            onClick={() =>
              alEnviar(evaluacion.preguntas.map((_, i) => respuestas[i]))
            }
          >
            {enviando
              ? "Enviando…"
              : respondidas < total
                ? total - respondidas === 1
                  ? "Falta 1 por responder"
                  : `Faltan ${total - respondidas} por responder`
                : "Enviar respuestas"}
          </BotonPrincipal>
        ) : (
          <BotonPrincipal
            disabled={!respondida(actual)}
            onClick={() => setActual((a) => a + 1)}
          >
            Siguiente
          </BotonPrincipal>
        )}
      </div>
    </div>
  );
}

function Veredicto({
  resultado,
  alReintentar,
  alTerminar,
}: {
  resultado: IntentoCalificado;
  alReintentar: () => void;
  alTerminar: () => void;
}) {
  const Icono = resultado.aprobado ? CheckCircle2 : XCircle;

  return (
    <div className="mt-5 flex-1 space-y-5" aria-live="polite">
      <div
        className={`rounded-rel-card border p-6 text-center ${
          resultado.aprobado
            ? "border-rel-success/30 bg-rel-success-subtle"
            : "border-rel-warning/30 bg-rel-warning-subtle"
        }`}
      >
        <Icono
          className={`mx-auto h-10 w-10 ${
            resultado.aprobado ? "text-rel-success" : "text-rel-warning"
          }`}
          aria-hidden="true"
        />
        <p className="mt-3 font-rel-heading text-2xl font-black tabular-nums">
          {resultado.puntaje} %
        </p>
        <p className="mt-1 text-sm text-rel-muted">
          {resultado.aciertos} de {resultado.preguntas} correctas · se aprueba con{" "}
          {resultado.nota_minima} %
        </p>
        <p className="mt-3 font-rel-body text-base font-semibold">
          {resultado.aprobado
            ? "Aprobaste esta evaluación."
            : resultado.puede_reintentar
              ? "Todavía no. Puedes volver a intentarlo."
              : "No alcanzaste la nota y se acabaron los intentos."}
        </p>
      </div>

      {/* La retroalimentación llega VACÍA mientras queden intentos: con otro por
          delante, señalar los fallos convierte el segundo en copiar la
          corrección del primero. Cuando ya no hay reintento, el texto es
          material de enseñanza y esconderlo no protege nada. */}
      {resultado.retroalimentacion.length > 0 ? (
        <ol className="space-y-3">
          {resultado.retroalimentacion.map((r, i) => (
            <li
              key={i}
              className={`rounded-rel-card border p-4 ${
                r.acierto
                  ? "border-rel-success/30 bg-rel-success-subtle"
                  : "border-rel-danger/30 bg-rel-danger-subtle"
              }`}
            >
              <p className="text-sm font-semibold">
                {r.acierto ? "Correcta" : "Incorrecta"} · {r.enunciado}
              </p>
              {r.texto ? (
                <p className="mt-1 text-sm text-rel-muted">{r.texto}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {resultado.puede_reintentar ? (
        <BotonPrincipal onClick={alReintentar}>
          Intentar de nuevo · queda{" "}
          {resultado.intentos_max - resultado.intentos_usados === 1
            ? "1 intento"
            : `${resultado.intentos_max - resultado.intentos_usados} intentos`}
        </BotonPrincipal>
      ) : (
        <BotonPrincipal onClick={alTerminar}>Volver al curso</BotonPrincipal>
      )}
    </div>
  );
}
