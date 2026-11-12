// Cliente HTTP de los catálogos CX. La empresa la resuelve la sesión en backend.
import { api } from "@/lib/apiClient";
import type {
  DatosSede, DatosServicio, ErrorCx, PaginaContextos,
  SedeCx, ServicioCx, ServicioDeSede, TipoContexto,
} from "@/types/cxContextos";

const BASE = "/cx/catalogos";

function errorCx(error: unknown, fallback: string): ErrorCx {
  const respuesta = error as { response?: { status?: number; data?: { detail?: unknown } } };
  const detalle = respuesta?.response?.data?.detail;
  const mensaje = typeof detalle === "string" ? detalle : fallback;
  return Object.assign(new Error(mensaje), { status: respuesta?.response?.status });
}

export async function listarContextos<T extends SedeCx | ServicioCx>(
  tipo: TipoContexto,
  filtros: { buscar?: string; activo?: boolean | null; cursor?: string | null; limite?: number } = {},
): Promise<PaginaContextos<T>> {
  try {
    const { data } = await api.get<PaginaContextos<T>>(`${BASE}/${tipo}`, {
      params: {
        buscar: filtros.buscar || undefined,
        activo: filtros.activo ?? undefined,
        cursor: filtros.cursor || undefined,
        limite: filtros.limite ?? 20,
      },
    });
    return data;
  } catch (e) {
    throw errorCx(e, `No pudimos cargar ${tipo}.`);
  }
}

export async function crearSede(datos: DatosSede): Promise<SedeCx> {
  try {
    return (await api.post<SedeCx>(`${BASE}/sedes`, datos)).data;
  } catch (e) {
    throw errorCx(e, "No pudimos crear la sede.");
  }
}

export async function crearServicio(datos: DatosServicio): Promise<ServicioCx> {
  try {
    return (await api.post<ServicioCx>(`${BASE}/servicios`, datos)).data;
  } catch (e) {
    throw errorCx(e, "No pudimos crear el servicio.");
  }
}

export async function editarSede(id: string, datos: Omit<DatosSede, "codigo">): Promise<SedeCx> {
  try {
    return (await api.put<SedeCx>(`${BASE}/sedes/${id}`, datos)).data;
  } catch (e) {
    throw errorCx(e, "No pudimos actualizar la sede.");
  }
}

export async function editarServicio(id: string, datos: Omit<DatosServicio, "codigo">): Promise<ServicioCx> {
  try {
    return (await api.put<ServicioCx>(`${BASE}/servicios/${id}`, datos)).data;
  } catch (e) {
    throw errorCx(e, "No pudimos actualizar el servicio.");
  }
}

export async function cambiarEstadoContexto(tipo: TipoContexto, id: string, activo: boolean): Promise<SedeCx | ServicioCx> {
  try {
    return (await api.patch<SedeCx | ServicioCx>(`${BASE}/${tipo}/${id}/estado`, { activo })).data;
  } catch (e) {
    throw errorCx(e, "No pudimos cambiar el estado.");
  }
}

export async function listarServiciosDeSede(sedeId: string): Promise<ServicioDeSede[]> {
  try {
    return (await api.get<ServicioDeSede[]>(`${BASE}/sedes/${sedeId}/servicios`)).data;
  } catch (e) {
    throw errorCx(e, "No pudimos cargar los servicios de esta sede.");
  }
}

export async function obtenerSede(id: string): Promise<SedeCx> {
  try { return (await api.get<SedeCx>(`${BASE}/sedes/${id}`)).data; }
  catch (e) { throw errorCx(e, "No pudimos cargar la sede."); }
}

export async function vincularServicio(sedeId: string, servicioId: string): Promise<ServicioDeSede> {
  try {
    return (await api.put<ServicioDeSede>(`${BASE}/sedes/${sedeId}/servicios/${servicioId}`)).data;
  } catch (e) {
    throw errorCx(e, "No pudimos vincular el servicio.");
  }
}

export async function desvincularServicio(sedeId: string, servicioId: string): Promise<void> {
  try {
    await api.delete(`${BASE}/sedes/${sedeId}/servicios/${servicioId}`);
  } catch (e) {
    throw errorCx(e, "No pudimos desvincular el servicio.");
  }
}
