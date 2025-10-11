// src/types/pregunta.ts

// Tipos de respuesta permitidos por el backend
export type TipoRespuesta =
  | "likert"
  | "abierta"
  | "ranking"
  | "dicotomica"
  | "semaforo"
  | "situacional"
  | "escala_visual"
  | "seleccion_multiple"
  | "frecuencia_temporal";

// Modelo alineado al backend (usa `metadata`, NO `parametros`)
export interface Pregunta {
  id: number;
  evaluacion_id: number;
  texto: string;
  tipo_respuesta: TipoRespuesta;
  es_obligatoria: boolean;
  /** Campo flexible según el tipo de respuesta (opciones, rangos, etc.) */
  metadata?: Record<string, unknown> | null;
}

// Payloads convenientes para crear/actualizar
export type PreguntaCreate = Omit<Pregunta, "id">;
export type PreguntaUpdate = Partial<PreguntaCreate>;
