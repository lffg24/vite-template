// src/services/reportes.ts
import { api } from "@/lib/apiClient";

/** ========= Tipos: Niveles por dimensión ========= */
export interface NivelDimItem {
  dimension: string; // <- backend devuelve 'dimension'
  n: number;
  avg_0_100: number;
  nivel: string;
}
export interface NivelesDimResp {
  items: NivelDimItem[];
  total_avg_0_100: number;
  total_n: number;
  total_nivel: string;
}

/** ========= Tipos: Tabla por dominio→dimensiones ========= */
export type NivelClave = "Muy bajo" | "Bajo" | "Medio" | "Alto" | "Muy alto";

export interface ConteosNivel {
  [nivel: string]: number; // p.ej. { "Bajo": 12, "Medio": 30, ... }
}

export interface DimDeDominio {
  dimension: string;
  puntaje_t: number; // promedio 0-100 (estilo T)
  n: number; // cantidad de personas (promedio por persona)
  niveles: ConteosNivel;
}

export interface DominioTabla {
  dominio: string;
  puntaje_t: number;
  n_personas: number;
  niveles: ConteosNivel;
  dimensiones: DimDeDominio[];
}

export interface TablaDominiosResp {
  dominios: DominioTabla[];
}

/** ========= Tipos: Niveles por dominio (agregado) ========= */
export interface NivelDominioItem {
  dominio: string;
  n: number;
  avg_0_100: number;
  nivel: string;
}
export interface NivelesDomResp {
  items: NivelDominioItem[];
  total_avg_0_100: number;
  total_n: number;
  total_nivel: string;
}

/** ========= Evaluaciones (selector) ========= */
export interface EvalItem {
  id: number;
  nombre: string;
}

/* ----------------- Servicios ----------------- */

/** Servicio estable: compatible con la versión base del backend */
export async function listEvaluaciones(): Promise<EvalItem[]> {
  try {
    const res = await api.get("/evaluaciones/");
    const body = res.data;

    // Corrige el tipo de respuesta (puede venir como { data: [...] } o [...] directo)
    const raw = Array.isArray(body) ? body : body?.data || [];

    if (!Array.isArray(raw)) {
      console.warn("Formato inesperado en /evaluaciones/:", body);
      return [];
    }

    return raw.map((e: any) => ({
      id: e.id || e.evaluacion_id,
      nombre: e.nombre || e.titulo || e.descripcion || `Evaluación ${e.id}`,
      fecha: e.fecha || e.created_at || e.inicio,
    }));
  } catch (error) {
    console.error("Error al listar evaluaciones:", error);
    return [];
  }
}

export async function getNivelesDimensiones(
  evaluacionIds: number[]
): Promise<NivelesDimResp> {
  const res = await api.post("/reportes/psico/niveles-dimensiones", {
    evaluacion_ids: evaluacionIds, // snake_case como en backend
  });
  return res.data as NivelesDimResp;
}

export async function downloadNivelesDimensionesCSV(evaluacionIds: number[]) {
  const res = await api.post(
    "/reportes/psico/niveles-dimensiones.csv",
    { evaluacion_ids: evaluacionIds },
    { responseType: "blob" }
  );

  const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "niveles_dimensiones.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// POST /reportes/psico/tabla-dominios
export async function getTablaDominios(evaluacionIds: number[]) {
  const { data } = await api.post("/reportes/psico/tabla-dominios", {
    evaluacion_ids: evaluacionIds,
  });
  return data;
}

export async function getNivelesDominios(
  evaluacionIds: number[]
): Promise<NivelesDomResp> {
  const res = await api.post("/reportes/psico/niveles-dominios", {
    evaluacion_ids: evaluacionIds,
  });
  return res.data as NivelesDomResp;
}
