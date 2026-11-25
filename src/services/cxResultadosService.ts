import { api } from "@/lib/apiClient";
import type { FiltrosResultadoCx, ResumenResultadosCx } from "@/types/cxResultados";

export async function obtenerResultadosCx(filtros: FiltrosResultadoCx, signal?: AbortSignal): Promise<ResumenResultadosCx> {
  try {
    const { tipo_indicador: _tipoIndicador, ...parametros } = filtros;
    return (await api.get<ResumenResultadosCx>("/cx/resultados", { params: parametros, signal })).data;
  } catch (error) {
    const respuesta = error as { response?: { data?: { detail?: unknown }; status?: number } };
    const detalle = respuesta.response?.data?.detail;
    if (respuesta.response?.status === 403) throw new Error(typeof detalle === "string" ? detalle : "No tienes permiso para consultar estos resultados.");
    throw new Error(typeof detalle === "string" ? detalle : "No pudimos cargar los resultados CX. Intenta de nuevo.");
  }
}
