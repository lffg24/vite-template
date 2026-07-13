import { api } from "@/lib/apiClient";
import type { TipoReportePsicoOficial } from "@/types/psicoReportesOficiales";
import type { PsicoAplicacionItem } from "@/types/psicoDashboard";
import { isReportablePsicoApplicationState } from "@/utils/psicoApplicationState";

export function pathFor(tipo: TipoReportePsicoOficial) {
  if (tipo === "resultados") return "informe-resultados";
  if (tipo === "resultados_areas") return "informe-resultados-areas";
  if (tipo === "base_forma_a") return "informe-base-forma-a";
  if (tipo === "base_forma_b") return "informe-base-forma-b";
  if (tipo === "base_general") return "informe-base-general";
  return "informe-sociodemografico";
}

export async function listarAplicacionesReportesOficiales(): Promise<PsicoAplicacionItem[]> {
  const { data } = await api.get("/reportes/psico/oficial/aplicaciones");
  return (data?.items ?? []).filter((app: PsicoAplicacionItem) => isReportablePsicoApplicationState(app.estado));
}

export async function obtenerHtmlReporteOficial(
  aplicacionId: number,
  tipo: TipoReportePsicoOficial
): Promise<string> {
  const { data } = await api.get(`/reportes/psico/oficial/aplicacion/${aplicacionId}/${pathFor(tipo)}/html`, {
    responseType: "text",
  });
  return String(data ?? "");
}

export async function obtenerDataReporteOficial(aplicacionId: number, tipo: TipoReportePsicoOficial): Promise<any> {
  const { data } = await api.get(`/reportes/psico/oficial/aplicacion/${aplicacionId}/${pathFor(tipo)}/data`);
  return data;
}

export async function descargarDocReporteOficial(aplicacionId: number, tipo: TipoReportePsicoOficial): Promise<Blob> {
  const { data } = await api.get(`/reportes/psico/oficial/aplicacion/${aplicacionId}/${pathFor(tipo)}/doc`, {
    responseType: "blob",
  });
  return data as Blob;
}


export async function descargarPdfReporteOficial(aplicacionId: number, tipo: TipoReportePsicoOficial): Promise<Blob> {
  const { data } = await api.get(`/reportes/psico/oficial/aplicacion/${aplicacionId}/${pathFor(tipo)}/pdf`, {
    responseType: "blob",
  });
  return data as Blob;
}
