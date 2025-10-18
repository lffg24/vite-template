export type NivelClave = "sin_riesgo" | "bajo" | "medio" | "alto" | "muy_alto";

export interface ConteosNivel {
  sin_riesgo: number;
  bajo: number;
  medio: number;
  alto: number;
  muy_alto: number;
}

export interface FilaTablaDominios {
  evaluacion_id: number;
  nombre_evaluacion?: string;
  dominio: string; // code (p.ej. "demandas")
  nombre_dominio: string; // “Demandas del trabajo”
  dimension: string; // code
  nombre_dimension: string; // “Demandas emocionales”
  puntaje_t: number; // 0..100
  nivel: string; // etiqueta de nivel
  n: number; // n personas en la dimensión (si backend lo manda)
  conteos: ConteosNivel; // distribución por nivel para la dimensión
}

export interface GrupoDimension {
  codigo: string;
  nombre: string;
  puntajeT: number;
  conteos: ConteosNivel;
}

export interface GrupoDominio {
  codigo: string;
  nombre: string;
  promedioT: number; // promedio del dominio (si no viene, lo calculamos)
  totales: ConteosNivel; // suma de conteos de sus dimensiones
  dimensiones: GrupoDimension[];
}

export interface BloqueEvaluacion {
  evaluacion_id: number;
  nombre_evaluacion?: string;
  dominios: GrupoDominio[];
}
