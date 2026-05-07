import { api } from "@/lib/apiClient";
import type { TipoReportePsicoOficial } from "@/types/psicoReportesOficiales";
import type { PsicoAplicacionItem } from "@/types/psicoDashboard";

function pathFor(tipo: TipoReportePsicoOficial) {
  return tipo === "resultados" ? "informe-resultados" : "informe-sociodemografico";
}

export async function listarAplicacionesReportesOficiales(): Promise<PsicoAplicacionItem[]> {
  const { data } = await api.get("/reportes/psico/oficial/aplicaciones");
  return data?.items ?? [];
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
