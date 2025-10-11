// src/services/competenciaService.ts
export type Competencia = { id: number; nombre: string };

const BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

// Construye headers válidos para HeadersInit (sin valores undefined)
const buildHeaders = (): HeadersInit => {
  const token = localStorage.getItem("jwt");
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

/**
 * Intenta primero /evaluaciones/:id/competencias
 * y si no existe, cae a /competencias?evaluacion_id=:id
 */
export async function listarCompetenciasPorEvaluacion(
  evaluacionId: number
): Promise<Competencia[]> {
  // Ruta anidada
  let res = await fetch(`${BASE}/evaluaciones/${evaluacionId}/competencias`, {
    headers: buildHeaders(),
  });

  // Fallback: query param
  if (!res.ok) {
    res = await fetch(`${BASE}/competencias?evaluacion_id=${evaluacionId}`, {
      headers: buildHeaders(),
    });
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No fue posible cargar las competencias");
  }

  const data = (await res.json()) as Competencia[];
  return [...data].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// TODAS las competencias de la empresa (para este usuario)
export async function listarCompetenciasEmpresa() {
  const res = await fetch(`${BASE}/competencias/`, { headers: buildHeaders() }); // 👈 barra final
  if (!res.ok) throw new Error("No fue posible cargar las competencias");
  const data = (await res.json()) as Competencia[];
  return data.sort((a, b) => a.nombre.localeCompare(b.nombre));
}
