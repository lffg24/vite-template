import { api } from "@/lib/apiClient";
import type { CampanaCx, EstadoCampanaCx, NuevaCampanaCx, PaginaCampanasCx } from "@/types/cxCampanas";

const base = "/cx/campanas";
function mensaje(error: unknown): Error {
  const detalle = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return new Error(typeof detalle === "string" ? detalle : "No pudimos completar la operación.");
}

export async function listarCampanasCx(cursor?: string | null): Promise<PaginaCampanasCx> {
  try { return (await api.get<PaginaCampanasCx>(base, { params: { cursor: cursor || undefined } })).data; }
  catch (error) { throw mensaje(error); }
}
export async function crearCampanaCx(datos: NuevaCampanaCx): Promise<CampanaCx> {
  try { return (await api.post<CampanaCx>(base, datos)).data; }
  catch (error) { throw mensaje(error); }
}
export async function cambiarVersionCampanaCx(id: string, version_id: string): Promise<CampanaCx> {
  try { return (await api.put<CampanaCx>(`${base}/${id}/version`, { version_id })).data; }
  catch (error) { throw mensaje(error); }
}
export async function cambiarEstadoCampanaCx(id: string, estado: EstadoCampanaCx): Promise<CampanaCx> {
  try { return (await api.put<CampanaCx>(`${base}/${id}/estado`, { estado })).data; }
  catch (error) { throw mensaje(error); }
}
export async function revocarCampanaCx(id: string): Promise<CampanaCx> {
  try { return (await api.post<CampanaCx>(`${base}/${id}/revocar`)).data; }
  catch (error) { throw mensaje(error); }
}
