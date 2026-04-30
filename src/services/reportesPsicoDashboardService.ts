import { api } from "@/lib/apiClient";
import type { PsicoAplicacionItem, PsicoDashboardResponse } from "@/types/psicoDashboard";

export async function listarAplicacionesPsicoDashboard(): Promise<PsicoAplicacionItem[]> {
  const { data } = await api.get("/reportes/psico/oficial/aplicaciones");
  return data?.items ?? [];
}

export async function obtenerDashboardPsicoAplicacion(aplicacionId: number): Promise<PsicoDashboardResponse> {
  const { data } = await api.get(`/reportes/psico/oficial/aplicacion/${aplicacionId}/dashboard`);
  return data as PsicoDashboardResponse;
}
