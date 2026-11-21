// src/shared/ui/tablero/DialogoTransicion.tsx
//
// El diálogo que se abre cuando mover una tarea EXIGE algo: un motivo, una
// justificación, un responsable. La «pantalla de transición» de Jira.
//
// Es `DialogoCasa` con tres decisiones ya tomadas, para que cada flujo no las
// reinvente:
//
//   1. **El título dice el movimiento**, no «Confirmar»: «Mover a Descartada».
//   2. **Confirmar espera al servidor.** El botón queda en «Guardando…» y el
//      diálogo no se cierra hasta que la promesa resuelve. Si falla, el error
//      se muestra DENTRO, con lo escrito intacto: perder una justificación de
//      tres párrafos por un corte de red es lo que hace odiar un formulario.
//   3. **No se cierra por accidente mientras guarda.**
//
// Los campos son `children`: este diálogo no sabe qué pide cada flujo.

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Aviso } from "@/shared/ui/Aviso";
import { DialogoCasa } from "@/shared/ui/DialogoCasa";

export function DialogoTransicion({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  textoConfirmar = "Confirmar",
  valido = true,
  alConfirmar,
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: ReactNode;
  /** Los campos que el flujo pide. */
  children?: ReactNode;
  textoConfirmar?: string;
  /** `false` deshabilita Confirmar mientras falte algo obligatorio. */
  valido?: boolean;
  /** Si lanza, el diálogo sigue abierto y muestra el mensaje del error. */
  alConfirmar: () => Promise<void> | void;
}) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setGuardando(true);
    setError(null);
    try {
      await alConfirmar();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "No pudimos guardar el cambio. Inténtalo otra vez.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <DialogoCasa
      abierto={abierto}
      alCerrar={() => {
        if (!guardando) {
          setError(null);
          alCerrar();
        }
      }}
      titulo={titulo}
      descripcion={descripcion}
      acciones={
        <>
          <Button type="button" variant="relOutline" disabled={guardando} onClick={alCerrar}>
            Cancelar
          </Button>
          <Button type="button" variant="rel" disabled={!valido || guardando} onClick={() => void confirmar()}>
            {guardando ? "Guardando…" : textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {children}
        {error ? <Aviso tono="peligro" titulo="No se guardó">{error}</Aviso> : null}
      </div>
    </DialogoCasa>
  );
}
