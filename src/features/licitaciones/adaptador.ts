// src/features/licitaciones/adaptador.ts
//
// Licitaciones sobre el kit de tareas: aquí se traduce una `Opportunity` del
// servicio a la forma común (`TareaVista`) y se dicen las reglas del flujo.
// Es la receta de «adaptar un dominio al kit»; la pantalla no sabe de columnas
// ni de qué mover adónde, solo llama a estas funciones.
//
// ## El flujo
//
//   NUEVA → EN_REVISION → { GO · GO_CON_ALIADO · NO_GO · DESCARTADA }
//
// **Solo las columnas de decisión se alcanzan arrastrando.** NUEVA y
// EN_REVISION no son una decisión de la persona: las pone el servicio al
// registrar revisiones. Dejar arrastrar hacia ellas prometería algo que el
// backend no hace, y una decisión cerrada no se reabre (el servicio lo impide
// con `row_version`); la pantalla lo dice antes de intentarlo.

import type { Opportunity } from "@/features/licitaciones/service";
import type { ColumnaTablero, TareaVista } from "@/shared/ui/tablero";

export const COLUMNAS_LICITACION: ColumnaTablero[] = [
  { id: "NUEVA", titulo: "Nuevas", tono: "info", descripcion: "Detectadas, sin revisión humana." },
  { id: "EN_REVISION", titulo: "En revisión", tono: "marca", descripcion: "Se están verificando requisitos y evidencia." },
  { id: "GO", titulo: "GO", tono: "exito", descripcion: "Se presenta la propuesta." },
  { id: "GO_CON_ALIADO", titulo: "GO con aliado", tono: "exito", descripcion: "Se presenta junto a un aliado." },
  { id: "NO_GO", titulo: "NO GO", tono: "atencion", descripcion: "No se presenta." },
  { id: "DESCARTADA", titulo: "Descartada", tono: "neutro", descripcion: "No aplica; se archiva." },
];

export const COLUMNAS_DE_DECISION = new Set(["GO", "GO_CON_ALIADO", "NO_GO", "DESCARTADA"]);

/** La columna de una oportunidad: su decisión si la tiene; si no, su estado. */
export function columnaDe(o: Pick<Opportunity, "decision" | "workflow_state">): string {
  if (o.decision && COLUMNAS_DE_DECISION.has(o.decision)) return o.decision;
  return o.workflow_state === "NUEVA" ? "NUEVA" : "EN_REVISION";
}

export function dinero(valor: Opportunity["budget_amount"], moneda?: string | null): string | null {
  if (valor == null) return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return String(valor);
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda || "COP", maximumFractionDigits: 0 }).format(n);
}

export function aTarea(o: Opportunity): TareaVista<Opportunity> {
  const presupuesto = dinero(o.budget_amount, o.budget_currency);
  return {
    id: o.id,
    clave: o.external_process_id,
    titulo: `${o.buyer_name}: ${o.object_original}`,
    columna: columnaDe(o),
    etiquetas: [
      ...(o.service_category ? [{ texto: o.service_category }] : []),
      ...(presupuesto ? [{ texto: presupuesto, tono: "info" as const }] : []),
    ],
    vence: o.next_deadline ? o.next_deadline.slice(0, 10) : undefined,
    origen: o,
  };
}

export type ReglaDeMovimiento =
  | { tipo: "decision" }
  | { tipo: "rechazo"; motivo: string };

/** ¿Se puede pedir este movimiento? Lo dice, no lo hace: mover es del servicio. */
export function reglaDeMovimiento(
  tarea: TareaVista<Opportunity>,
  destinoId: string,
  puedeDecidir: boolean
): ReglaDeMovimiento {
  if (!COLUMNAS_DE_DECISION.has(destinoId)) {
    return {
      tipo: "rechazo",
      motivo: "El estado cambia solo al registrar revisiones. Abre la oportunidad para revisarla.",
    };
  }
  if (tarea.origen?.decision) {
    return { tipo: "rechazo", motivo: "Esta oportunidad ya tiene una decisión cerrada." };
  }
  if (!puedeDecidir) {
    return { tipo: "rechazo", motivo: "No tienes permiso para cerrar decisiones." };
  }
  return { tipo: "decision" };
}
