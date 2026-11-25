import { api } from "@/lib/apiClient";
import type { AreaCx, PaginaAreasCx, ServicioAreasCx } from "@/types/cxAreas";

const BASE = "/cx/catalogos";

function error(e: unknown, defecto: string): Error {
  const respuesta = e as { response?: { data?: { detail?: unknown }; status?: number } };
  const detalle = respuesta?.response?.data?.detail;
  return Object.assign(new Error(typeof detalle === "string" ? detalle : defecto), { status: respuesta?.response?.status });
}

export async function listarAreasCx(filtros: { buscar?: string; activo?: boolean | null; cursor?: number | null; limite?: number } = {}): Promise<PaginaAreasCx> {
  try {
    return (await api.get<PaginaAreasCx>(`${BASE}/areas`, { params: {
      buscar: filtros.buscar || undefined, activo: filtros.activo ?? undefined,
      cursor: filtros.cursor ?? undefined, limite: filtros.limite ?? 20,
    } })).data;
  } catch (e) { throw error(e, "No pudimos cargar las áreas."); }
}

export async function crearAreaCx(datos: { nombre: string; descripcion: string | null }): Promise<AreaCx> {
  try { return (await api.post<AreaCx>(`${BASE}/areas`, datos)).data; }
  catch (e) { throw error(e, "No pudimos crear el área."); }
}

export async function editarAreaCx(id: number, datos: { nombre: string; descripcion: string | null }): Promise<AreaCx> {
  try { return (await api.put<AreaCx>(`${BASE}/areas/${id}`, datos)).data; }
  catch (e) { throw error(e, "No pudimos editar el área."); }
}

export async function cambiarEstadoAreaCx(id: number, activo: boolean): Promise<AreaCx> {
  try { return (await api.patch<AreaCx>(`${BASE}/areas/${id}/estado`, { activo })).data; }
  catch (e) { throw error(e, "No pudimos cambiar el estado del área."); }
}

export async function obtenerAreasServicioCx(servicioId: string): Promise<ServicioAreasCx> {
  try { return (await api.get<ServicioAreasCx>(`${BASE}/servicios/${servicioId}/areas`)).data; }
  catch (e) { throw error(e, "No pudimos cargar las áreas del servicio."); }
}

export async function guardarAreasServicioCx(servicioId: string, datos: Pick<ServicioAreasCx, "principal_area_id" | "colaboradora_area_ids">): Promise<ServicioAreasCx> {
  try { return (await api.put<ServicioAreasCx>(`${BASE}/servicios/${servicioId}/areas`, datos)).data; }
  catch (e) { throw error(e, "No pudimos guardar las áreas del servicio."); }
}
