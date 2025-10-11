export type EstadoProgresoEnum = "pendiente" | "en_progreso" | "completada";

export interface TipoEvaluacion {
  id: number;
  nombre: string;
  permite_autoevaluacion: boolean;
  permite_evaluadores: boolean;
  requiere_categoria: boolean;
  numero_niveles: number;
  metadata_configurable?: any;
}

export interface Evaluacion {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_id: number;
  estado: "Borrador" | "Activa" | "Finalizada";
  fecha_creacion: string;
  empresa_id: number;
}

export interface EvaluacionCreate {
  nombre: string;
  descripcion?: string;
  tipo_id: number;
  estado?: "Borrador" | "Activa" | "Finalizada";
  empresa_id: number;
}

export interface UsuarioAsignado {
  id: number;
  nombre: string;
  email: string;
  usuario_id: number;
  evaluacion_id: number;
}

export type EvaluacionConProgreso = {
  usuario_id: number;
  evaluacion_id: number;
  estado: EstadoProgresoEnum;
  progreso: number; // 0..100
  fecha_ultima_interaccion: string; // ISO
  empresa_id: string; // UUID
  // Campos opcionales cuando “enriquecemos” en el front:
  nombre?: string | null;
  descripcion?: string | null;
};
