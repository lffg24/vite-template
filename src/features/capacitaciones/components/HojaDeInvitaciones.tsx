// src/features/capacitaciones/components/HojaDeInvitaciones.tsx
//
// La hoja imprimible con los códigos personales.
//
// ## Por qué existe
//
// Una capacitación presencial son cuarenta personas en una sala. Si cada una
// necesita su enlace y no hay correo ni SMS —no los hay—, el administrador tiene
// que poder repartirlos en papel. Se imprime, se recorta y se entrega, que es lo
// que ya se hace con las planillas de asistencia.
//
// ## Por qué es la única oportunidad
//
// El servidor guarda solo el SHA-256 del token. **Esta pantalla es la única vez
// que los códigos existen en claro.** Cerrarla sin imprimir obliga a revocar y
// volver a generar, así que la pantalla lo dice antes, no después.
//
// ## El QR
//
// Sería mejor y espera a que se apruebe la librería. La ruta `/c/i/{token}` ya
// existe para cuando llegue; hasta entonces el enlace se teclea o se escanea del
// texto.

import { Printer, Scissors } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InvitacionesGeneradas } from "@/types/capacitaciones";

/** La URL que abrirá cada persona. Se construye con el origen actual. */
export function urlInvitacion(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/c/i/${token}`;
}

export function HojaDeInvitaciones({
  generadas,
  alCerrar,
}: {
  generadas: InvitacionesGeneradas;
  alCerrar: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* `print:hidden` en todo lo que no es la hoja: al imprimir solo deben
          salir los recortables, no la interfaz que los rodea. */}
      <div className="space-y-4 print:hidden">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-rel-dark">
            {generadas.emitidas.length}{" "}
            {generadas.emitidas.length === 1 ? "invitación" : "invitaciones"} para{" "}
            {generadas.curso}
          </h1>
          <p className="text-sm text-rel-muted">
            Imprime esta hoja y recorta un recuadro por persona.
          </p>
        </header>

        <div
          role="alert"
          className="rounded-rel-card border border-rel-warning/40 bg-rel-warning-subtle p-4 text-sm leading-relaxed"
        >
          <strong className="font-semibold">
            Esta es la única vez que verás los códigos.
          </strong>{" "}
          El servidor no los guarda: solo guarda una huella que sirve para
          comprobarlos, no para volver a mostrarlos. Si cierras sin imprimir,
          tendrás que revocar estas invitaciones y generar otras.
        </div>

        {generadas.omitidas.length > 0 ? (
          <div className="rounded-rel-card border border-rel-border bg-rel-surface p-4 text-sm">
            <p className="font-semibold text-rel-dark">
              {generadas.omitidas.length}{" "}
              {generadas.omitidas.length === 1 ? "persona" : "personas"} sin
              invitación nueva
            </p>
            <ul className="mt-2 space-y-1 text-rel-muted">
              {generadas.omitidas.map((o) => (
                <li key={o.participante_id}>
                  {o.nombre} — {o.motivo}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="rel" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Imprimir la hoja
          </Button>
          <Button variant="relOutline" onClick={alCerrar}>
            Ya la imprimí
          </Button>
        </div>
      </div>

      {/* La hoja. Dos columnas al imprimir: entran ocho recortables por página
          sin que el código quede pequeño para leerlo a mano. */}
      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
        {generadas.emitidas.map((inv) => (
          <article
            key={inv.invitacion_id}
            className="relative rounded-rel-card border border-dashed border-rel-border-strong bg-rel-surface p-4 print:break-inside-avoid print:border-black"
          >
            <Scissors
              className="absolute right-3 top-3 h-4 w-4 text-rel-muted print:text-black"
              aria-hidden="true"
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted print:text-black">
              {generadas.curso}
            </p>
            <p className="mt-1 font-rel-heading text-base font-bold text-rel-dark print:text-black">
              {inv.nombre}
            </p>
            <p className="text-sm tabular-nums text-rel-muted print:text-black">
              {inv.tipo_documento} {inv.numero_documento}
            </p>

            <p className="mt-3 text-xs text-rel-muted print:text-black">
              Entra desde tu teléfono:
            </p>
            {/* `break-all` porque el token es una cadena larga sin espacios: sin
                esto se sale del recuadro al imprimir. */}
            <p className="mt-0.5 break-all font-mono text-xs leading-snug text-rel-dark print:text-black">
              {urlInvitacion(inv.token)}
            </p>

            <p className="mt-3 border-t border-rel-border pt-2 text-xs text-rel-muted print:border-black print:text-black">
              Es personal y sirve una sola vez. No la compartas: la constancia
              quedará a nombre de quien la use.
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
