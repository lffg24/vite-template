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
import { DialogoCasa } from "@/shared/ui/DialogoCasa";
import { Ilustracion } from "@/shared/ui/ilustraciones";
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
    <DialogoCasa
      abierto
      alCerrar={alCerrar}
      // Sin equis, sin velo y sin `Escape`: al cerrar, el enlace se pierde.
      // Salir tiene que ser un acto deliberado, y el pie lo dice.
      cierreRapido={false}
      antetitulo="Enlace de grupo"
      titulo="Ya puedes repartirlo"
      tono="aviso"
      visual={<Ilustracion nombre="enlace" tamano="lg" />}
      descripcion={
        <>
          Para <strong className="text-rel-dark">{enlace.curso}</strong>. Vence el{" "}
          {formatearFechaHora(enlace.expira_en)}
          {enlace.cupo_max != null
            ? ` y admite ${enlace.cupo_max} personas.`
            : ", sin límite de personas."}
        </>
      }
      acciones={
        <Button type="button" variant="relOutline" onClick={alCerrar}>
          Ya lo copié
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            id="enlace-url"
            aria-label="Enlace para compartir"
            ref={campoRef}
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-rel-control border border-rel-border bg-rel-surface-subtle px-3 py-3 font-mono text-sm text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
          />
          <Button type="button" variant="rel" size="lg" onClick={copiar}>
            {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>

        <p role="status" aria-live="polite" className="text-sm font-semibold text-rel-success">
          {copiado ? "Enlace copiado al portapapeles." : " "}
        </p>

        {/* El aviso va AQUÍ y no en un recuadro amarillo aparte.
            El recuadro de alerta se lee como un error del sistema y se ignora
            por costumbre; dicho junto al campo que hay que copiar, se lee
            cuando importa — que es antes de cerrar. */}
        <p className="border-t border-rel-border pt-3 text-sm text-rel-muted">
          <KeyRound
            className="mr-1.5 inline h-4 w-4 align-text-bottom text-rel-warning"
            aria-hidden="true"
          />
          El sistema guarda solo una huella, no el enlace:{" "}
          <strong className="text-rel-dark">al cerrar esta ventana no se puede volver a ver</strong>.
          Si se pierde, se genera otro y el anterior sigue sirviendo hasta que lo
          revoques.
        </p>
      </div>
    </DialogoCasa>
  );
}
