// src/components/feedback/ConfirmDialog.tsx
//
// La confirmación del producto, ahora sobre `DialogoCasa`.
//
// ## Lo que había
//
// Un modal escrito a mano que no cumplía ninguna de las cuatro promesas que
// hace un modal:
//
//   - **Sin `role="dialog"` ni `aria-modal`.** Para un lector de pantalla no
//     había nada tapando la página: seguía leyendo la de detrás como si la
//     confirmación no existiera.
//   - **Sin `Escape`.** La única salida era acertar con el ratón.
//   - **Sin mover el foco al abrirse.** El teclado seguía recorriendo los
//     campos de la pantalla tapada, invisibles bajo el velo.
//   - **Sin cierre por el velo**, que en el resto del producto sí cierra.
//
// Y es justo el control donde alguien decide algo con consecuencias: cerrar y
// calcular una aplicación, reabrirla registrando un crédito de reproceso,
// finalizar un instrumento que queda bloqueado para edición.
//
// ## Lo que cambia y lo que no
//
// La FIRMA no cambia —`tone: "violet" | "amber"` incluido— porque sus dos
// consumidores son pantallas de Psicosocial y aquí no se tocan. Los colores
// son los mismos tokens de antes, por el mismo motivo: lo que se arregla es la
// estructura, no la paleta.
//
// El nombre `violet` ya mentía antes de esto: `bg-primary` es el turquesa de
// la casa, así que ese tono se pintaba turquesa con nombre de violeta. Se
// mantiene el nombre para no tocar a quien llama, y se traduce al tono
// semántico de la casa.
//
// También baja de capa. Estaba en la capa 130, por encima de los avisos: un
// mensaje lanzado mientras alguien confirmaba no se veía nunca. Ahora vive en
// la capa de modales, debajo de la de avisos.

import { AlertTriangle, ShieldCheck } from "lucide-react";

import { DialogoCasa } from "@/shared/ui/DialogoCasa";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "violet",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "violet" | "amber";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const aviso = tone === "amber";
  const Icono = aviso ? AlertTriangle : ShieldCheck;

  return (
    <DialogoCasa
      abierto={open}
      // El velo y `Escape` cancelan. Es lo correcto en una confirmación: salir
      // sin decidir deja las cosas como estaban, y el botón de confirmar sigue
      // siendo la única forma de avanzar.
      alCerrar={onCancel}
      antetitulo={aviso ? "Atención" : "Confirmación"}
      titulo={title}
      descripcion={description}
      tono={aviso ? "aviso" : "neutro"}
      visual={
        <span
          className={
            aviso
              ? "grid h-12 w-12 place-items-center rounded-rel-panel bg-warning/15 text-warning ring-1 ring-warning/20"
              : "grid h-12 w-12 place-items-center rounded-rel-panel bg-accent text-brand-primary ring-1 ring-brand-primary/10"
          }
        >
          <Icono className="h-5 w-5" aria-hidden="true" />
        </span>
      }
      acciones={
        <>
          <Button type="button" variant="relOutline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {/* El aviso no tiene variante propia porque no es una familia: es
              ESTE dialogo cuando lo que confirma no se puede deshacer. El
              ambar sale de los tokens, no de un color escrito a mano. */}
          <Button
            type="button"
            onClick={onConfirm}
            className={
              aviso
                ? "bg-warning text-warning-foreground shadow-rel-card hover:brightness-95 focus-visible:ring-warning"
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
