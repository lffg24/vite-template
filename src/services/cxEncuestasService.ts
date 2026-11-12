import { api } from "@/lib/apiClient";
import type { EncuestaCx, ItemCx, PaginaEncuestasCx } from "@/types/cxEncuestas";

const base = "/cx/encuestas";

function mensaje(error: unknown, defecto: string): Error {
  const detalle = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return new Error(typeof detalle === "string" ? detalle : defecto);
}

export async function listarEncuestasCx(cursor?: string | null): Promise<PaginaEncuestasCx> {
  try { return (await api.get<PaginaEncuestasCx>(base, { params: { cursor: cursor || undefined } })).data; }
  catch (error) { throw mensaje(error, "No pudimos cargar las encuestas."); }
}

export async function obtenerEncuestaCx(id: string): Promise<EncuestaCx> {
  try { return (await api.get<EncuestaCx>(`${base}/${id}`)).data; }
  catch (error) { throw mensaje(error, "No pudimos cargar la encuesta."); }
}

export async function crearEncuestaCx(datos: { codigo: string; titulo: string; items: ItemCx[] }): Promise<EncuestaCx> {
  try { return (await api.post<EncuestaCx>(base, datos)).data; }
  catch (error) { throw mensaje(error, "No pudimos crear la encuesta."); }
}

export async function editarEncuestaCx(id: string, datos: { titulo: string; items: ItemCx[] }): Promise<EncuestaCx> {
  try { return (await api.put<EncuestaCx>(`${base}/${id}`, datos)).data; }
  catch (error) { throw mensaje(error, "No pudimos guardar el borrador."); }
}

export async function clonarVersionCx(id: string): Promise<EncuestaCx> {
  try { return (await api.post<EncuestaCx>(`${base}/${id}/clonar-ultima`)).data; }
  catch (error) { throw mensaje(error, "No pudimos crear un borrador desde la última versión."); }
}

export async function publicarEncuestaCx(id: string): Promise<EncuestaCx> {
  try { return (await api.post<EncuestaCx>(`${base}/${id}/publicar`)).data; }
  catch (error) { throw mensaje(error, "No pudimos publicar la encuesta."); }
}
