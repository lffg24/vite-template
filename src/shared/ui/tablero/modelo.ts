// src/shared/ui/tablero/modelo.ts
//
// El idioma común de las vistas de tareas: lista, tablero y detalle hablan de
// UNA forma de tarea, no cada una de la suya.
//
// ## Por qué hay un modelo normalizado
//
// Licitaciones tiene «oportunidades», un gestor de tareas tendrá «tareas», y
// mañana habrá hallazgos de auditoría o acciones correctivas. Son cosas
// distintas con la misma anatomía: algo con título, un estado, alguien a cargo,
// una fecha y una prioridad. Si el tablero conociera el dominio, habría un
// tablero por dominio —el defecto que el kit existe para evitar—.
//
// Quien consume **adapta una vez** (`oportunidad → TareaVista`) y recibe lista,
// tablero y detalle sin escribir más. `origen` lleva el objeto original para
// que, al abrir el detalle o mover la tarjeta, el consumidor recupere lo suyo
// sin tener que buscarlo por id.

import type { TonoPill } from "@/shared/ui/Pill";

export type PrioridadTarea = "critica" | "alta" | "media" | "baja";

export const ETIQUETA_PRIORIDAD: Record<PrioridadTarea, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export interface PersonaTarea {
  id: string;
  nombre: string;
}

export interface EtiquetaTarea {
  texto: string;
  tono?: TonoPill;
}

/** Una columna del tablero = un estado del flujo. */
export interface ColumnaTablero {
  id: string;
  titulo: string;
  /** El color del punto de la columna y de la píldora de estado en la lista. */
  tono?: TonoPill;
  /** Límite de trabajo en curso. Se avisa al superarlo; no se impide. */
  limite?: number;
  /** Una línea que dice para qué sirve el estado. */
  descripcion?: string;
}

export interface TareaVista<T = unknown> {
  id: string;
  /** La clave corta, estilo `LIC-142`. Es lo que la gente nombra al hablar. */
  clave?: string;
  titulo: string;
  /** `id` de la columna donde está hoy. */
  columna: string;
  prioridad?: PrioridadTarea;
  etiquetas?: EtiquetaTarea[];
  responsables?: PersonaTarea[];
  /** Fecha ISO (`2026-11-30`). Vencida = antes de hoy. */
  vence?: string;
  comentarios?: number;
  adjuntos?: number;
  /** Si hay texto, la tarea está bloqueada y esto dice por qué. */
  bloqueada?: string;
  origen?: T;
}

/** Quién pide mover una tarea y adónde. El consumidor decide si se puede. */
export type SolicitudMovimiento<T = unknown> = (
  tarea: TareaVista<T>,
  destino: ColumnaTablero
) => void;

/** `true` si la fecha ISO ya pasó (comparada por día, sin horas). */
export function estaVencida(vence: string | undefined, hoy: Date = new Date()): boolean {
  if (!vence) return false;
  const [a, m, d] = vence.split("-").map(Number);
  if (!a || !m || !d) return false;
  const limite = new Date(a, m - 1, d);
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return limite < hoySinHora;
}

/** «30 nov» a partir de `2026-11-30`. Sin año: dentro de un tablero sobra. */
export function formatearVence(vence: string): string {
  const [a, m, d] = vence.split("-").map(Number);
  if (!a || !m || !d) return vence;
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", "");
}
