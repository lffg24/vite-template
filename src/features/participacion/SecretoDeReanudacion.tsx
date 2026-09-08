// src/features/participacion/SecretoDeReanudacion.tsx
//
// El código que permite seguir el curso en **otro** teléfono.
//
// Se muestra una sola vez y no se guarda en el navegador. La sesión de este
// dispositivo ya viaja en la cookie `HttpOnly`; poner además el secreto en
// `localStorage` lo dejaría legible por cualquier script de la página, que es
// exactamente lo que la cookie evita.
//
// La pantalla existe porque la alternativa —reanudar con el número de
// documento— dejaba que quien tuviera el enlace del grupo y conociera el
// documento de un compañero continuara su curso y bajara su constancia.

import { useRef, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

import { BotonPrincipal, Panel } from "./ParticipanteLayout";

export function SecretoDeReanudacion({
  secreto,
  alContinuar,
}: {
  secreto: string;
  alContinuar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  async function copiar() {
    try {
      // `navigator.clipboard` no existe fuera de contextos seguros, y en un
      // teléfono viejo puede faltar. La alternativa selecciona el texto para
      // copiarlo a mano: un botón sin efecto sería peor que ninguno.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(secreto);
      } else {
        campo.current?.select();
        document.execCommand("copy");
      }
      setCopiado(true);
    } catch {
      campo.current?.select();
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
        Paso 2 de 3
      </p>
      <h1 className="mt-1 flex items-center gap-2 font-rel-heading text-2xl font-bold">
        <KeyRound className="h-6 w-6 text-rel-primary" aria-hidden="true" />
        Ya estás dentro
      </h1>

      <p className="mt-3 text-base leading-relaxed text-rel-muted">
        En este teléfono puedes seguir sin hacer nada más. Guarda este código
        solo si vas a continuar desde otro dispositivo.
      </p>

      <Panel className="mt-5">
        <label htmlFor="codigo" className="block text-sm font-semibold">
          Código de continuación
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="codigo"
            ref={campo}
            readOnly
            value={secreto}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-12 min-w-0 flex-1 rounded-rel-control border border-rel-border bg-rel-surface-subtle px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
          />
          <button
            type="button"
            onClick={copiar}
            className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-rel-control bg-rel-primary px-4 text-sm font-semibold text-rel-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
          >
            {copiado ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-rel-success">
          {copiado ? "Código copiado." : " "}
        </p>
      </Panel>

      <p className="mt-4 text-sm leading-relaxed text-rel-muted">
        No se puede volver a ver. Si lo pierdes y cambias de teléfono, pídele a
        quien te compartió el enlace que te ayude a entrar.
      </p>

      <div className="mt-auto pt-6">
        <BotonPrincipal onClick={alContinuar}>Empezar el curso</BotonPrincipal>
      </div>
    </div>
  );
}
