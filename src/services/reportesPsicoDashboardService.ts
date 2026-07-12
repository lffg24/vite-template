import { api } from "@/lib/apiClient";
import type { PsicoAplicacionItem, PsicoDashboardResponse, DimensionDetalleResponse } from "@/types/psicoDashboard";
import { isReportablePsicoApplicationState } from "@/utils/psicoApplicationState";

export async function listarAplicacionesPsicoDashboard(): Promise<PsicoAplicacionItem[]> {
  const { data } = await api.get("/reportes/psico/oficial/aplicaciones");
  return (data?.items ?? []).filter((app: PsicoAplicacionItem) => isReportablePsicoApplicationState(app.estado));
}

export async function obtenerDashboardPsicoAplicacion(aplicacionId: number): Promise<PsicoDashboardResponse> {
  const { data } = await api.get(`/reportes/psico/oficial/aplicacion/${aplicacionId}/dashboard`);
  return data as PsicoDashboardResponse;
}


export async function obtenerDetalleDimensionPsicoAplicacion(
  aplicacionId: number,
  dimensionCode: string,
  evaluacionId?: number
): Promise<DimensionDetalleResponse> {
  const params = evaluacionId ? { evaluacion_id: evaluacionId } : undefined;
  const { data } = await api.get(
    `/reportes/psico/oficial/aplicacion/${aplicacionId}/dimension/${encodeURIComponent(dimensionCode)}/detalle`,
    { params }
  );
  return data as DimensionDetalleResponse;
}
