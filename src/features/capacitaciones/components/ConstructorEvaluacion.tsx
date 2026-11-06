// src/features/capacitaciones/components/ConstructorEvaluacion.tsx
//
// El cuestionario de una lección de evaluación.
//
// El modelo que edita NO es de Capacitaciones: es el núcleo de cuestionarios
// del CORE (`hseq/core/cuestionarios`), el mismo que van a usar una evaluación
// 360 y una de clima laboral. Por eso este componente habla de preguntas,
// tipos, opciones y puntos, y no sabe nada de cursos ni de constancias: lo que
// es de Capacitaciones —nota mínima, intentos— lo pone quien lo monta.
//
// Decisiones que conviene no volver a discutir:
//
//   - **La correcta se marca dentro de la lista de opciones**, con radio o
//     casilla según el tipo, no con un desplegable «¿cuál es la correcta?»
//     aparte. El control deja ver de un vistazo qué está marcado mientras se
//     redactan las demás; un desplegable obliga a recordar el número.
//   - **No se puede quedar sin correcta.** Al borrar la marcada, la marca pasa
//     a la primera que quede. Una pregunta sin respuesta correcta no es un
//     borrador incompleto: es una pregunta que no se puede calificar, y el
//     servidor la rechaza al guardar.
//   - **Un verdadero/falso no escribe sus opciones.** Las pone el sistema, y
//     por eso no se pueden editar aquí: un «Verdaero» mal tecleado quedaría
//     congelado para siempre en una versión publicada.

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EtiquetaConAyuda } from "@/shared/ui/Ayuda";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AYUDA_TIPO_PREGUNTA,
  ETIQUETA_TIPO_PREGUNTA,
  INTENTOS_DEFECTO,
  NOTA_MINIMA_DEFECTO,
  OPCIONES_MAX,
  OPCIONES_MIN,
  OPCIONES_VERDADERO_FALSO,
  PREGUNTAS_MAX,
  PUNTOS_DEFECTO,
  TIPOS_PREGUNTA,
  type EvaluacionLeccion,
  type PreguntaLeccion,
  type TipoPregunta,
} from "@/types/capacitaciones";

export const EVALUACION_VACIA: EvaluacionLeccion = {
  nota_minima: NOTA_MINIMA_DEFECTO,
  intentos_max: INTENTOS_DEFECTO,
  preguntas: [],
};

export function preguntaVacia(): PreguntaLeccion {
  return {
    tipo: "OPCION_UNICA",
    enunciado: "",
    opciones: ["", ""],
    correctas: [0],
    puntos: PUNTOS_DEFECTO,
  };
}

/** Las opciones REALES: un verdadero/falso no guarda las suyas. */
export function opcionesDe(pregunta: PreguntaLeccion): string[] {
  return pregunta.tipo === "VERDADERO_FALSO"
    ? [...OPCIONES_VERDADERO_FALSO]
    : (pregunta.opciones ?? []);
}

/**
 * Cambiar de tipo reescribe lo que el tipo nuevo necesita.
 *
 * Es donde más fácil se cuela un defecto: pasar de múltiple a única dejando dos
 * correctas guarda una pregunta que el servidor rechaza, y quien redacta ve un
 * error que no entiende porque en pantalla solo hay una marcada.
 */
function alCambiarTipo(pregunta: PreguntaLeccion, tipo: TipoPregunta): PreguntaLeccion {
  if (tipo === "VERDADERO_FALSO") {
    return { ...pregunta, tipo, opciones: undefined, correctas: [pregunta.correctas[0] ?? 0] };
  }
  const opciones = pregunta.opciones?.length ? pregunta.opciones : ["", ""];
  if (tipo === "OPCION_UNICA") {
    return { ...pregunta, tipo, opciones, correctas: [pregunta.correctas[0] ?? 0] };
  }
  // A múltiple: se conserva lo marcado. El servidor exige al menos dos, y la
  // pantalla lo dice en vez de marcar una segunda por su cuenta — elegir cuál
  // sería inventarse la respuesta.
  return { ...pregunta, tipo, opciones, correctas: pregunta.correctas };
}

export function ConstructorEvaluacion({
  valor,
  alCambiar,
}: {
  valor: EvaluacionLeccion;
  alCambiar: (v: EvaluacionLeccion) => void;
}) {
  function cambiarPregunta(i: number, cambio: Partial<PreguntaLeccion>) {
    alCambiar({
      ...valor,
      preguntas: valor.preguntas.map((p, j) => (j === i ? { ...p, ...cambio } : p)),
    });
  }

  function alternarCorrecta(i: number, k: number) {
    const pregunta = valor.preguntas[i];
    if (pregunta.tipo === "OPCION_MULTIPLE") {
      const correctas = pregunta.correctas.includes(k)
        ? pregunta.correctas.filter((c) => c !== k)
        : [...pregunta.correctas, k].sort((a, b) => a - b);
      cambiarPregunta(i, { correctas });
      return;
    }
    cambiarPregunta(i, { correctas: [k] });
  }

  function quitarOpcion(i: number, k: number) {
    const pregunta = valor.preguntas[i];
    const opciones = (pregunta.opciones ?? []).filter((_, j) => j !== k);
    // La marca sigue a la opción, no al número: si se borra una anterior, baja
    // un puesto; si se borra una marcada, desaparece de la lista.
    const correctas = pregunta.correctas
      .filter((c) => c !== k)
      .map((c) => (c > k ? c - 1 : c));
    cambiarPregunta(i, {
      opciones,
      correctas: correctas.length > 0 ? correctas : [0],
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <EtiquetaConAyuda
            htmlFor="e-nota"
            ayuda={
              <>
                Sobre los <strong className="text-rel-dark">puntos</strong>, no
                sobre el número de preguntas: una pregunta de cierre puede pesar
                más que una de trámite. Se redondea hacia abajo, así que 2 de 3
                es 66&nbsp;% y con mínima 67 no aprueba.
              </>
            }
            etiquetaAyuda="Cómo se calcula la nota"
          >
            Nota mínima para aprobar
          </EtiquetaConAyuda>
          <div className="flex items-center gap-2">
            <Input
              id="e-nota"
              inputMode="numeric"
              className="w-24"
              value={String(valor.nota_minima)}
              onChange={(e) =>
                alCambiar({ ...valor, nota_minima: Number(e.target.value) || 0 })
              }
            />
            <span className="text-sm text-rel-muted">%</span>
          </div>

        </div>

        <div className="space-y-2">
          <EtiquetaConAyuda
            htmlFor="e-intentos"
            ayuda="Al aprobar ya no se puede reintentar. Y la retroalimentación solo se muestra cuando no queda ningún intento: con otro por delante, señalar los fallos convierte el segundo en copiar la corrección del primero."
            etiquetaAyuda="Cómo funcionan los intentos"
          >
            Intentos permitidos
          </EtiquetaConAyuda>
          <Input
            id="e-intentos"
            inputMode="numeric"
            className="w-24"
            value={String(valor.intentos_max)}
            onChange={(e) =>
              alCambiar({ ...valor, intentos_max: Number(e.target.value) || 0 })
            }
          />

        </div>
      </div>

      <div className="space-y-4">
        {valor.preguntas.map((pregunta, i) => {
          const opciones = opcionesDe(pregunta);
          const fijas = pregunta.tipo === "VERDADERO_FALSO";
          const multiple = pregunta.tipo === "OPCION_MULTIPLE";

          return (
            <fieldset
              key={i}
              className="space-y-4 rounded-rel-card border border-rel-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <legend className="px-1 text-sm font-semibold text-rel-dark">
                  Pregunta {i + 1}
                </legend>
                <Button
                  type="button"
                  variant="relGhost"
                  size="sm"
                  className="text-rel-danger hover:bg-rel-danger-subtle"
                  onClick={() =>
                    alCambiar({
                      ...valor,
                      preguntas: valor.preguntas.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 aria-hidden="true" />
                  <span className="sr-only">Eliminar la pregunta {i + 1}</span>
                </Button>
              </div>

              {/* Tipo: los tres a la vista, no dentro de un desplegable. Son
                  tres y la elección cambia la forma del resto del formulario;
                  esconderlos obligaría a abrir para recordar qué hay. */}
              <div className="grid gap-2 sm:grid-cols-3">
                {TIPOS_PREGUNTA.map((tipo) => (
                  <label
                    key={tipo}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-rel-control border p-3 text-left",
                      pregunta.tipo === tipo
                        ? "border-rel-primary bg-rel-accent-subtle"
                        : "border-rel-border bg-rel-surface"
                    )}
                  >
                    <input
                      type="radio"
                      name={`tipo-${i}`}
                      checked={pregunta.tipo === tipo}
                      onChange={() => cambiarPregunta(i, alCambiarTipo(pregunta, tipo))}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-rel-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-rel-dark">
                        {ETIQUETA_TIPO_PREGUNTA[tipo]}
                      </span>
                      <span className="block text-xs text-rel-muted">
                        {AYUDA_TIPO_PREGUNTA[tipo]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <Textarea
                rows={2}
                maxLength={500}
                value={pregunta.enunciado}
                placeholder="¿Qué se pregunta?"
                onChange={(e) => cambiarPregunta(i, { enunciado: e.target.value })}
                aria-label={`Enunciado de la pregunta ${i + 1}`}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-rel-dark">
                  {multiple
                    ? "Opciones · marca todas las correctas"
                    : "Opciones · marca la correcta"}
                </p>
                {opciones.map((opcion, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <input
                      type={multiple ? "checkbox" : "radio"}
                      name={multiple ? undefined : `correcta-${i}`}
                      checked={pregunta.correctas.includes(k)}
                      onChange={() => alternarCorrecta(i, k)}
                      className="h-4 w-4 shrink-0 accent-rel-primary"
                      aria-label={`Marcar «${opcion || `opción ${k + 1}`}» como correcta`}
                    />
                    <Input
                      value={opcion}
                      maxLength={250}
                      disabled={fijas}
                      placeholder={`Opción ${k + 1}`}
                      onChange={(e) =>
                        cambiarPregunta(i, {
                          opciones: (pregunta.opciones ?? []).map((o, j) =>
                            j === k ? e.target.value : o
                          ),
                        })
                      }
                      aria-label={`Texto de la opción ${k + 1} de la pregunta ${i + 1}`}
                    />
                    {fijas ? null : (
                      <Button
                        type="button"
                        variant="relGhost"
                        size="sm"
                        disabled={opciones.length <= OPCIONES_MIN}
                        onClick={() => quitarOpcion(i, k)}
                      >
                        <Trash2 aria-hidden="true" />
                        <span className="sr-only">
                          Quitar la opción {k + 1} de la pregunta {i + 1}
                        </span>
                      </Button>
                    )}
                  </div>
                ))}

                {fijas ? (
                  <p className="text-sm text-rel-muted">
                    Las opciones de un verdadero/falso las pone el sistema.
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="relOutline"
                    size="sm"
                    disabled={opciones.length >= OPCIONES_MAX}
                    onClick={() =>
                      cambiarPregunta(i, { opciones: [...(pregunta.opciones ?? []), ""] })
                    }
                  >
                    <Plus aria-hidden="true" />
                    Agregar opción
                  </Button>
                )}

                {multiple && pregunta.correctas.length < 2 ? (
                  <p role="status" className="text-sm text-rel-warning">
                    Una selección múltiple necesita al menos dos correctas. Si de
                    verdad solo hay una, es de selección única.
                  </p>
                ) : null}
                {multiple && pregunta.correctas.length === opciones.length ? (
                  <p role="status" className="text-sm text-rel-warning">
                    Están todas marcadas: marcarlas todas la acertaría sin saber
                    nada.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
                <div className="space-y-2">
                  <Label htmlFor={`p-puntos-${i}`} className="text-rel-dark">
                    Puntos
                  </Label>
                  <Input
                    id={`p-puntos-${i}`}
                    inputMode="numeric"
                    value={String(pregunta.puntos)}
                    onChange={(e) =>
                      cambiarPregunta(i, { puntos: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`p-ok-${i}`} className="text-rel-dark">
                    Si acierta
                  </Label>
                  <Input
                    id={`p-ok-${i}`}
                    maxLength={300}
                    placeholder="Opcional"
                    value={pregunta.retroalimentacion_correcta ?? ""}
                    onChange={(e) =>
                      cambiarPregunta(i, { retroalimentacion_correcta: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`p-no-${i}`} className="text-rel-dark">
                  Si falla
                </Label>
                <Input
                  id={`p-no-${i}`}
                  maxLength={300}
                  placeholder="Opcional · se muestra cuando ya no queda reintento"
                  value={pregunta.retroalimentacion_incorrecta ?? ""}
                  onChange={(e) =>
                    cambiarPregunta(i, { retroalimentacion_incorrecta: e.target.value })
                  }
                />
              </div>
            </fieldset>
          );
        })}

        {valor.preguntas.length === 0 ? (
          <p className="rounded-rel-card border border-dashed border-rel-border-strong bg-rel-surface-subtle p-4 text-sm text-rel-muted">
            Una evaluación sin preguntas no se puede publicar: no habría nada que
            responder.
          </p>
        ) : null}

        <Button
          type="button"
          variant="relOutline"
          size="sm"
          disabled={valor.preguntas.length >= PREGUNTAS_MAX}
          onClick={() =>
            alCambiar({ ...valor, preguntas: [...valor.preguntas, preguntaVacia()] })
          }
        >
          <Plus aria-hidden="true" />
          Agregar pregunta
        </Button>
      </div>
    </div>
  );
}
