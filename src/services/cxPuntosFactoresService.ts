import { api } from "@/lib/apiClient";
import type { PaginaCx, PuntoCx, FactorCx, SubfactorCx, AplicabilidadCx } from "@/types/cxPuntosFactores";

type Tipo = "puntos" | "factores" | "subfactores";
type Filtros = { buscar?: string; activo?: boolean | null; cursor?: string | null; limite?: number };
const BASE = "/cx/catalogos";

function error(e: unknown, defecto: string): Error {
  const respuesta = e as { response?: { data?: { detail?: unknown }; status?: number } };
  const detalle = respuesta?.response?.data?.detail;
  return Object.assign(new Error(typeof detalle === "string" ? detalle : defecto), { status: respuesta?.response?.status });
}

export async function listarCatalogoCx<T extends PuntoCx | FactorCx | SubfactorCx>(tipo: Tipo, filtros: Filtros = {}, factorId?: string): Promise<PaginaCx<T>> {
  const ruta = tipo === "subfactores" ? `${BASE}/factores/${factorId}/subfactores` : `${BASE}/${tipo}`;
  try {
    return (await api.get<PaginaCx<T>>(ruta, { params: {
      buscar: filtros.buscar || undefined, activo: filtros.activo ?? undefined,
      cursor: filtros.cursor || undefined, limite: filtros.limite ?? 20,
    } })).data;
  } catch (e) { throw error(e, `No pudimos cargar ${tipo}.`); }
}

export async function crearCatalogoCx<T>(tipo: Tipo, datos: Record<string, unknown>): Promise<T> {
  try { return (await api.post<T>(`${BASE}/${tipo}`, datos)).data; }
  catch (e) { throw error(e, "No pudimos crear el registro."); }
}

export async function editarCatalogoCx<T>(tipo: Tipo, id: string, datos: Record<string, unknown>): Promise<T> {
  try { return (await api.put<T>(`${BASE}/${tipo}/${id}`, datos)).data; }
  catch (e) { throw error(e, "No pudimos guardar los cambios."); }
}

export async function cambiarEstadoCatalogoCx<T>(tipo: Tipo, id: string, activo: boolean): Promise<T> {
  try { return (await api.patch<T>(`${BASE}/${tipo}/${id}/estado`, { activo })).data; }
  catch (e) { throw error(e, "No pudimos cambiar el estado."); }
}

export async function obtenerAplicabilidad(factorId: string): Promise<AplicabilidadCx> {
  try { return (await api.get<AplicabilidadCx>(`${BASE}/factores/${factorId}/aplicabilidad`)).data; }
  catch (e) { throw error(e, "No pudimos cargar la aplicabilidad."); }
}

export async function guardarAplicabilidad(factorId: string, datos: Pick<AplicabilidadCx, "sede_ids" | "servicio_ids">): Promise<AplicabilidadCx> {
  try { return (await api.put<AplicabilidadCx>(`${BASE}/factores/${factorId}/aplicabilidad`, datos)).data; }
  catch (e) { throw error(e, "No pudimos guardar la aplicabilidad."); }
}
