// src/shared/ui/DialogoConfirmacion.tsx
//
// La confirmación de una acción que cambia algo: cerrar, revocar, anular,
// desactivar, publicar.
//
// ## Por qué existe
//
// Cada pantalla armaba su propio `AlertDialog` de shadcn: una caja blanca con un
// título, un párrafo y dos botones pegados, igual para «publicar» que para
// «borrar para siempre». No decía de qué gravedad era lo que se iba a hacer ni
// se veía como el resto de la casa. Esta pieza lo resuelve una vez:
//
//   - un icono con el tono de la gravedad (peligro, atención, neutro) para que el
//     ojo sepa si es reversible antes de leer;
//   - en móvil sube desde abajo como una hoja, con los botones apilados y el
//     principal arriba, al alcance del pulgar; en escritorio es una tarjeta
//     centrada con los botones en fila;
//   - entra con la curva de la casa y sale con la misma, sin saltos.
//
// ## Qué NO hace
//
// No es para formularios (`PanelLateral`) ni para mostrar algo que se pierde al
// cerrar (`DialogoCasa`). Solo pregunta «¿seguro?» y espera.
//
// ## Mientras se espera al servidor
//
// Con `ocupado` ambos botones se bloquean, el principal muestra `etiquetaOcupado`
// y el diálogo NO se cierra con Escape ni con el velo: cerrarlo a medias haría
// creer que la acción no ocurrió cuando sí.
//
// ## Accesibilidad
//
// Es un `alertdialog` de Radix: atrapa el foco, lo devuelve al abrir el control
// que lo disparó y el foco inicial cae en «Cancelar», el botón seguro.

import { useRef, type ReactNode } from "react";
import * as Dialogo from "@radix-ui/react-alert-dialog";
import { AlertTriangle, HelpCircle, Trash2, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TonoConfirmacion = "peligro" | "atencion" | "neutro";

const TONO: Record<TonoConfirmacion, { ficha: string; icono: LucideIcon; boton: "relDanger" | "rel" }> = {
  peligro: { ficha: "bg-danger-subtle text-danger ring-danger/25", icono: Trash2, boton: "relDanger" },
  atencion: { ficha: "bg-warning-subtle text-warning ring-warning/30", icono: AlertTriangle, boton: "rel" },
  neutro: { ficha: "bg-accent text-rel-primary ring-rel-primary/20", icono: HelpCircle, boton: "rel" },
};

export function DialogoConfirmacion({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  tono = "atencion",
  icono,
  etiquetaConfirmar = "Confirmar",
  etiquetaOcupado,
  etiquetaCancelar = "Cancelar",
  alConfirmar,
  ocupado = false,
  confirmarDeshabilitado = false,
  children,
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  tono?: TonoConfirmacion;
  /** Para sustituir el icono del tono por uno que diga qué se hace. */
  icono?: LucideIcon;
  etiquetaConfirmar?: string;
  /** Qué dice el botón mientras espera: «Cerrando…». */
  etiquetaOcupado?: string;
  etiquetaCancelar?: string;
  alConfirmar: () => void;
  ocupado?: boolean;
  /** Falta algo por rellenar en `children` (un motivo) antes de poder confirmar. */
  confirmarDeshabilitado?: boolean;
  /** Un dato extra bajo la descripción (qué se va a afectar). */
  children?: ReactNode;
}) {
  const cancelar = useRef<HTMLButtonElement>(null);
  const { ficha, icono: IconoTono, boton } = TONO[tono];
  const Icono = icono ?? IconoTono;

  return (
    <Dialogo.Root
      open={abierto}
      onOpenChange={(v) => {
        if (!v && !ocupado) alCerrar();
      }}
    >
      <Dialogo.Portal>
        <Dialogo.Overlay
          className={cn(
            "fixed inset-0 z-rel-modal bg-rel-dark/45 backdrop-blur-xs",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "duration-enter motion-reduce:animate-none"
          )}
        />
        <Dialogo.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            cancelar.current?.focus();
          }}
          className={cn(
            "rel-scope fixed z-rel-modal bg-rel-surface font-rel-body shadow-rel-floating outline-hidden",
            // Móvil: hoja anclada abajo. Escritorio: tarjeta centrada.
            "inset-x-0 bottom-0 rounded-t-rel-panel border-t border-rel-border px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-rel-panel sm:border sm:p-6",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8",
            "sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8",
            "sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:slide-out-to-bottom-2",
            "duration-context ease-rel-out motion-reduce:animate-none"
          )}
        >
          {/* El asa solo dice «esto es una hoja» en móvil. */}
          <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-rel-border sm:hidden" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span
              aria-hidden="true"
              className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full ring-1", ficha)}
            >
              <Icono className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <Dialogo.Title className="font-rel-heading text-lg font-bold leading-snug text-rel-dark">
                {titulo}
              </Dialogo.Title>
              {descripcion ? (
                <Dialogo.Description className="mt-1.5 text-sm leading-relaxed text-rel-muted">
                  {descripcion}
                </Dialogo.Description>
              ) : null}
              {children ? <div className="mt-3 text-sm">{children}</div> : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialogo.Cancel asChild>
              <Button ref={cancelar} type="button" variant="relOutline" disabled={ocupado} className="w-full sm:w-auto">
                {etiquetaCancelar}
              </Button>
            </Dialogo.Cancel>
            <Button
              type="button"
              variant={boton}
              disabled={ocupado || confirmarDeshabilitado}
              onClick={alConfirmar}
              className="w-full sm:w-auto"
            >
              {ocupado && etiquetaOcupado ? etiquetaOcupado : etiquetaConfirmar}
            </Button>
          </div>
        </Dialogo.Content>
      </Dialogo.Portal>
    </Dialogo.Root>
  );
}
