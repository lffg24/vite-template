// src/features/capacitaciones/components/SelectorCuestionarioBanco.tsx
//
// Elegir del banco la evaluación que responde una lección.
//
// El banco existía en el servidor desde antes que esta pantalla: una lección
// podía guardar `cuestionario_version_id` y nadie tenía por dónde ponerlo. El
// efecto práctico era que el banco no servía para nada — cada curso volvía a
// escribir sus preguntas, y corregir una errata obligaba a repetirla curso por
// curso.
//
// Dos cosas que este componente deja claras a propósito:
//
//   - **Solo ofrece la versión VIGENTE de cada cuestionario.** El historial no
//     se elige a mano: una lección que apuntara a la versión de hace dos
//     revisiones seguiría preguntando lo de entonces sin que nadie lo note. La
//     única excepción es la que esta lección YA tiene elegida: si la
//     sustituyeron, sigue apareciendo marcada como anterior, porque esconderla
//     no cambia a dónde apunta la lección — solo deja la pantalla en blanco
//     afirmando que no hay nada elegido.
//   - **Enseña cuántas preguntas, la nota mínima y los intentos.** Son los
//     números que decide el banco y que la lección ya no puede cambiar; verlos
//     antes de elegir evita descubrirlo cuando alguien reprueba.

import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { listarVersionesElegibles } from "@/services/evaluacionesService";
import type { VersionElegible } from "@/types/evaluaciones";
import { cn } from "@/lib/utils";

export function SelectorCuestionarioBanco({
  valor,
  alCambiar,
  id = "leccion-banco",
  deshabilitado = false,
}: {
  /** `cuestionario_version_id`, o "" si todavía no se eligió ninguno. */
  valor: string;
  alCambiar: (versionId: string, version: VersionElegible | null) => void;
  id?: string;
  deshabilitado?: boolean;
}) {
  const [versiones, setVersiones] = useState<VersionElegible[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    listarVersionesElegibles(valor || null)
      .then((v) => {
        if (vigente) setVersiones(v);
      })
      .catch((e: { mensaje?: string }) => {
        if (vigente) setError(e.mensaje ?? "No pudimos cargar el banco de evaluaciones.");
      });
    return () => {
      vigente = false;
    };
    // Se relee al cambiar `valor` para que la elegida viaje siempre en la
    // petición. Sin eso, abrir una lección cuya versión fue sustituida pedía la
    // lista sin ella y el desplegable quedaba vacío.
  }, [valor]);

  const elegida = versiones?.find((v) => v.version_id === valor) ?? null;

  if (error) {
    return (
      <p role="alert" className="text-sm text-rel-danger">
        {error}
      </p>
    );
  }

  if (versiones === null) {
    return (
      <p role="status" className="text-sm text-rel-muted">
        Cargando el banco de evaluaciones…
      </p>
    );
  }

  // Un banco vacío no es un error: es que todavía nadie publicó nada. Decirlo
  // con el camino a seguir evita que parezca una pantalla rota.
  if (versiones.length === 0) {
    return (
      <p className="text-sm text-rel-muted">
        Todavía no hay ninguna evaluación publicada en el banco. Publica una en
        <span className="font-semibold text-rel-dark"> Evaluaciones</span> y volverá a
        aparecer aquí, o escribe el cuestionario dentro de esta lección.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-rel-dark">
        Evaluación del banco
      </Label>
      <select
        id={id}
        className={cn(
          "h-10 w-full rounded-rel-control border border-rel-border bg-rel-surface px-3",
          "font-rel-body text-sm text-rel-dark",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => {
          const seleccionada = versiones.find((v) => v.version_id === e.target.value) ?? null;
          alCambiar(e.target.value, seleccionada);
        }}
      >
        <option value="">Elige una evaluación…</option>
        {versiones.map((v) => (
          <option key={v.version_id} value={v.version_id}>
            {v.codigo} · {v.titulo} · v{v.numero}
            {v.vigente ? "" : " (versión anterior)"}
          </option>
        ))}
      </select>
      {elegida && !elegida.vigente ? (
        <p className="text-sm text-rel-warning">
          Esta lección apunta a la <strong>versión {elegida.numero}</strong>, y ya
          hay una más reciente publicada. Sigue siendo válida —quien la responda
          verá estas preguntas— pero si querías la última, elígela aquí.
        </p>
      ) : null}
      {elegida ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 font-rel-body text-sm sm:grid-cols-3">
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-rel-muted">Preguntas</dt>
            <dd className="tabular-nums text-rel-dark">{elegida.preguntas}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-rel-muted">Nota mínima</dt>
            <dd className="tabular-nums text-rel-dark">{elegida.nota_minima} %</dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-rel-muted">Intentos</dt>
            <dd className="tabular-nums text-rel-dark">{elegida.intentos_max}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
