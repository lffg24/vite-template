// src/features/capacitaciones/components/EnlaceGeneradoDialog.tsx
//
// La única pantalla del producto donde existe el token de un enlace.
//
// El servidor guarda solo su SHA-256. No hay endpoint que lo devuelva, no
// porque falte implementarlo, sino porque de un hash no se recupera el
// original. La consecuencia para la interfaz es esta ventana: se muestra una
// vez, se avisa de que es una vez, y quien lo necesite otra vez genera uno
// nuevo.
//
// Por eso el botón de cerrar dice «Ya lo copié» y no «Cerrar»: obliga a leer lo
// que se está afirmando.

import { useEffect, useRef, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EnlaceCreado } from "@/types/capacitaciones";
import { formatearFechaHora } from "../formato";

/**
 * La URL pública que recibirá el participante (pantalla D-01).
 *
 * `/c/:token` es la forma acordada aquí; no estaba fijada en ningún contrato
 * previo. La ruta **ya existe** desde la vertical B: abre el recorrido del
 * participante (D-01) sin pedir cuenta, así que este enlace se puede repartir.
 */
export function urlParticipante(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/c/${token}`;
}

export function EnlaceGeneradoDialog({
  enlace,
  alCerrar,
}: {
  enlace: EnlaceCreado | null;
  alCerrar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enlace) setCopiado(false);
  }, [enlace]);

  if (!enlace) return null;

  const url = urlParticipante(enlace.token);

  async function copiar() {
    try {
      // `navigator.clipboard` no existe fuera de contextos seguros. La
      // alternativa selecciona el texto para que se pueda copiar a mano: dejar
      // el botón sin efecto sería peor que no tenerlo, porque el token no se
      // puede volver a pedir.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        campoRef.current?.select();
        document.execCommand("copy");
      }
      setCopiado(true);
    } catch {
      campoRef.current?.select();
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && alCerrar()}>
      <DialogContent className="rel-scope bg-rel-surface font-rel-body sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-rel-heading text-rel-dark">
            <KeyRound className="h-5 w-5 text-rel-primary" aria-hidden="true" />
            Enlace generado
          </DialogTitle>
          <DialogDescription className="text-rel-muted">
            Para «{enlace.curso}». Vence el {formatearFechaHora(enlace.expira_en)}
            {enlace.cupo_max != null ? ` · cupo de ${enlace.cupo_max}` : " · sin límite de cupo"}.
          </DialogDescription>
        </DialogHeader>

        <div
          role="alert"
          className="rounded-rel-card border border-rel-warning/30 bg-rel-warning-subtle p-4 text-sm text-rel-dark"
        >
          <p className="font-semibold">Cópialo ahora: no se puede volver a ver.</p>
          <p className="mt-1">
            El sistema solo guarda una huella del enlace, no el enlace. Si se
            pierde, se genera uno nuevo — el anterior seguirá funcionando hasta
            que lo revoques.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="enlace-url" className="text-sm font-semibold text-rel-dark">
            Enlace para compartir
          </label>
          <div className="flex gap-2">
            <input
              id="enlace-url"
              ref={campoRef}
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-rel-control border border-rel-border bg-rel-surface-subtle px-3 py-2 font-mono text-sm text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
            />
            <Button type="button" variant="rel" onClick={copiar}>
              {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p role="status" aria-live="polite" className="text-sm text-rel-success">
            {copiado ? "Enlace copiado al portapapeles." : " "}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="relOutline" onClick={alCerrar}>
            Ya lo copié
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
