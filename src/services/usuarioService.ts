// src/services/usuarioService.ts
import { api } from "@/lib/apiClient";
import type { Usuario } from "@/types/usuario";

/** Helper de error compartido */
function safeError(e: any, fallback = "Error de red o del servidor.") {
  const msg =
    e?.response?.data?.detail ??
    e?.response?.data?.message ??
    e?.message ??
    fallback;
  const err = new Error(typeof msg === "string" ? msg : fallback);
  (err as any).status = e?.response?.status;
  return err;
}

const BASE = "/usuarios";

/** Listar usuarios (scoped por empresa vía JWT) */
export async function obtenerUsuarios(): Promise<Usuario[]> {
  try {
    const { data } = await api.get<Usuario[]>(`${BASE}/`);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos obtener los usuarios.");
  }
}

/** Crear usuario */
export async function crearUsuario(usuario: {
  nombre: string;
  email: string;
}): Promise<Usuario> {
  try {
    const { data } = await api.post<Usuario>(`${BASE}/`, usuario);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos crear el usuario.");
  }
}

/** Obtener un usuario */
export async function obtenerUsuario(id: number | string): Promise<Usuario> {
  try {
    const { data } = await api.get<Usuario>(`${BASE}/${id}`);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos obtener el usuario.");
  }
}

/** Actualizar un usuario */
export async function actualizarUsuario(
  id: number | string,
  payload: Partial<{ nombre: string; email: string }>
): Promise<Usuario> {
  try {
    const { data } = await api.put<Usuario>(`${BASE}/${id}`, payload);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos actualizar el usuario.");
  }
}

/** Eliminar un usuario */
export async function eliminarUsuario(id: number | string): Promise<void> {
  try {
    await api.delete(`${BASE}/${id}`);
  } catch (e) {
    throw safeError(e, "No pudimos eliminar el usuario.");
  }
}
