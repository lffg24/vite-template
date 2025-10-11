// frontend/src/services/reportes.ts
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Obtén el tenant desde donde lo tengas guardado (ajusta si usas otro key)
function getEmpresaId(): string {
  return (
    localStorage.getItem("empresa_id") || "3aef9491-b1e2-495f-a5de-153839e80ee8" // fallback para dev
  );
}

export type NivelDimItem = {
  dimension: string;
  n: number;
  avg_0_100: number;
  nivel: string;
};
export type NivelesDimResponse = {
  items: NivelDimItem[];
  total_avg_0_100: number;
  total_n: number;
  total_nivel: string;
};

export async function getNivelesDimensiones(
  evaluacionIds: number[]
): Promise<NivelesDimResponse> {
  const res = await fetch(`${API}/reportes/psico/niveles-dimensiones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Empresa-Id": getEmpresaId(),
    },
    body: JSON.stringify({ evaluacion_ids: evaluacionIds }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}

export async function downloadNivelesDimensionesCSV(evaluacionIds: number[]) {
  const res = await fetch(`${API}/reportes/psico/niveles-dimensiones.csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Empresa-Id": getEmpresaId(),
    },
    body: JSON.stringify({ evaluacion_ids: evaluacionIds }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `niveles-dimensiones.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Lista rápida de evaluaciones (ajusta la URL a tu API real si difiere)
export type EvalItem = { id: number; nombre?: string; titulo?: string };
export async function listEvaluaciones(): Promise<EvalItem[]> {
  const res = await fetch(`${API}/evaluaciones`, {
    headers: { "X-Empresa-Id": getEmpresaId() },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  // Normalizamos: intenta usar "nombre" o "titulo"
  return (Array.isArray(data) ? data : data.items || []).map((e: any) => ({
    id: e.id,
    nombre: e.nombre ?? e.titulo ?? `Evaluación ${e.id}`,
  }));
}

export type TablaDomResp = {
  dominios: Array<{
    dominio: string;
    puntaje_t: number;
    n_personas: number;
    niveles: Record<string, number>;
    dimensiones: Array<{
      dimension: string;
      puntaje_t: number;
      n: number;
      niveles: Record<string, number>;
    }>;
  }>;
};

export async function getTablaDominios(
  evaluacionIds: number[]
): Promise<TablaDomResp> {
  const res = await fetch(`${API}/reportes/psico/tabla-dominios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Empresa-Id": getEmpresaId(),
    },
    body: JSON.stringify({ evaluacion_ids: evaluacionIds }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}
