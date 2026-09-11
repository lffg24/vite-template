// src/features/capacitaciones/components/ConstructorEvaluacion.tsx
//
// El cuestionario de una lección de evaluación.
//
// Decisiones que conviene no volver a discutir:
//
//   - **La respuesta correcta se marca con un radio dentro de la lista de
//     opciones**, no con un desplegable «¿cuál es la correcta?» aparte. El
//     radio deja ver de un vistazo cuál está marcada mientras se redactan las
//     demás; un desplegable obliga a recordar el número de la opción.
//   - **No se puede quedar sin correcta.** Al borrar la opción marcada, la
//     marca pasa a la primera que quede. Un cuestionario con una pregunta sin
//     respuesta correcta no es un borrador incompleto: es una pregunta que no
//     se puede calificar, y el servidor la rechaza al guardar.
//   - **Los índices no viajan a ciegas.** Al reordenar o borrar opciones, el
//     índice de la correcta se recalcula aquí; mandarlo sin ajustar dejaría
//     marcada otra opción distinta de la que se ve marcada.

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INTENTOS_DEFECTO,
  NOTA_MINIMA_DEFECTO,
  OPCIONES_MAX,
  OPCIONES_MIN,
  PREGUNTAS_MAX,
  type EvaluacionLeccion,
  type PreguntaLeccion,
} from "@/types/capacitaciones";

export const EVALUACION_VACIA: EvaluacionLeccion = {
  nota_minima: NOTA_MINIMA_DEFECTO,
  intentos_max: INTENTOS_DEFECTO,
  preguntas: [],
};

export function preguntaVacia(): PreguntaLeccion {
  return { enunciado: "", opciones: ["", ""], correcta: 0 };
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

  function quitarOpcion(i: number, k: number) {
    const pregunta = valor.preguntas[i];
    const opciones = pregunta.opciones.filter((_, j) => j !== k);
    // La marca sigue a la opción, no al número. Si se borra una anterior, la
    // correcta baja un puesto; si se borra la marcada, pasa a la primera.
    const correcta =
      pregunta.correcta === k
        ? 0
        : pregunta.correcta > k
          ? pregunta.correcta - 1
          : pregunta.correcta;
    cambiarPregunta(i, { opciones, correcta });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="e-nota" className="text-rel-dark">
            Nota mínima para aprobar
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="e-nota"
              inputMode="numeric"
              className="w-24"
              value={String(valor.nota_minima)}
              onChange={(e) =>
                alCambiar({ ...valor, nota_minima: Number(e.target.value) || 0 })
              }
              aria-describedby="e-nota-ayuda"
            />
            <span className="text-sm text-rel-muted">%</span>
          </div>
          <p id="e-nota-ayuda" className="text-sm text-rel-muted">
            Porcentaje de aciertos. Se redondea hacia abajo: 2 de 3 es 66 %, y
            con mínima 67 no aprueba.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="e-intentos" className="text-rel-dark">
            Intentos permitidos
          </Label>
          <Input
            id="e-intentos"
            inputMode="numeric"
            className="w-24"
            value={String(valor.intentos_max)}
            onChange={(e) =>
              alCambiar({ ...valor, intentos_max: Number(e.target.value) || 0 })
            }
            aria-describedby="e-intentos-ayuda"
          />
          <p id="e-intentos-ayuda" className="text-sm text-rel-muted">
            Al aprobar ya no se puede volver a intentar: repetir solo podría
            empeorar lo que quedó registrado.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {valor.preguntas.map((pregunta, i) => (
          <fieldset
            key={i}
            className="space-y-3 rounded-rel-card border border-rel-border p-4"
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
                Opciones · marca la correcta
              </p>
              {pregunta.opciones.map((opcion, k) => (
                <div key={k} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correcta-${i}`}
                    checked={pregunta.correcta === k}
                    onChange={() => cambiarPregunta(i, { correcta: k })}
                    className="h-4 w-4 shrink-0 accent-rel-primary"
                    aria-label={`Marcar la opción ${k + 1} como correcta`}
                  />
                  <Input
                    value={opcion}
                    maxLength={250}
                    placeholder={`Opción ${k + 1}`}
                    onChange={(e) =>
                      cambiarPregunta(i, {
                        opciones: pregunta.opciones.map((o, j) =>
                          j === k ? e.target.value : o
                        ),
                      })
                    }
                    aria-label={`Texto de la opción ${k + 1} de la pregunta ${i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="relGhost"
                    size="sm"
                    disabled={pregunta.opciones.length <= OPCIONES_MIN}
                    onClick={() => quitarOpcion(i, k)}
                  >
                    <Trash2 aria-hidden="true" />
                    <span className="sr-only">
                      Quitar la opción {k + 1} de la pregunta {i + 1}
                    </span>
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="relOutline"
                size="sm"
                disabled={pregunta.opciones.length >= OPCIONES_MAX}
                onClick={() =>
                  cambiarPregunta(i, { opciones: [...pregunta.opciones, ""] })
                }
              >
                <Plus aria-hidden="true" />
                Agregar opción
              </Button>
            </div>
          </fieldset>
        ))}

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
