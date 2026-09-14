// src/types/evaluaciones.ts
//
// El banco de cuestionarios. Módulo de PLATAFORMA: no hay empresa por ningún
// lado, igual que en el catálogo de cursos.
//
// Las preguntas reutilizan `PreguntaLeccion` de Capacitaciones — que es en
// realidad el tipo del núcleo `core.cuestionarios` — en vez de declarar uno
// paralelo. Dos tipos idénticos en dos archivos es la forma segura de que
// acaben divergiendo cuando alguien añada un campo a uno solo.

import type { PreguntaLeccion } from "@/types/capacitaciones";

export const AMBITOS = [
  "SST",
  "PESV",
  "PSICOSOCIAL",
  "AMBIENTAL",
  "DESARROLLO",
  "GENERAL",
] as const;
export type Ambito = (typeof AMBITOS)[number];

export const ETIQUETA_AMBITO: Record<Ambito, string> = {
  SST: "SST",
  PESV: "PESV",
  PSICOSOCIAL: "Riesgo psicosocial",
  AMBIENTAL: "Ambiental",
  DESARROLLO: "Desarrollo",
  GENERAL: "General",
};

export type EstadoCuestionario = "BORRADOR" | "PUBLICADO" | "ARCHIVADO";

export interface CuestionarioResumen {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  ambito: Ambito;
  estado: EstadoCuestionario;
  version_actual: number;
  nota_minima: number;
  intentos_max: number;
  /** Cuántas preguntas tiene el BORRADOR. */
  preguntas: number;
  /** Se calcula desde las lecciones que usan alguna de sus versiones. */
  cursos_vinculados: number;
  creado_en: string;
  actualizado_en: string;
}

export interface CuestionarioVersion {
  id: string;
  numero: number;
  publicado_en: string;
  titulo: string;
  codigo: string;
}

export interface CuestionarioDetalle {
  cuestionario: Omit<CuestionarioResumen, "preguntas" | "cursos_vinculados"> & {
    preguntas: PreguntaLeccion[];
  };
  versiones: CuestionarioVersion[];
  /** Qué falta para publicar. Vacío significa que se puede. */
  faltantes: string[];
}

export interface CuestionarioCrear {
  titulo: string;
  ambito: Ambito;
  descripcion?: string | null;
  nota_minima?: number;
  intentos_max?: number;
  preguntas?: PreguntaLeccion[] | null;
}

export type CuestionarioEditar = Partial<CuestionarioCrear>;

/** Lo que una lección puede elegir: la versión vigente de cada cuestionario. */
export interface VersionElegible {
  version_id: string;
  numero: number;
  cuestionario_id: string;
  codigo: string;
  titulo: string;
  ambito: Ambito;
  nota_minima: number;
  intentos_max: number;
  preguntas: number;
  /**
   * Si sigue siendo la versión actual de su cuestionario.
   *
   * Llega en `false` solo para la que una lección ya tenía elegida y fue
   * sustituida. Se sigue ofreciendo porque lo que la lección apunta es un
   * hecho: esconderlo dejaba la pantalla en blanco afirmando que no había nada
   * elegido.
   */
  vigente: boolean;
}
