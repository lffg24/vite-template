import { API_URL } from "@/lib/config";
import { emitSessionExpired } from "@/lib/sessionEvents";

export interface Capacidad { clave: string; nombre: string; descripcion: string; modulo: string; superficie: string; configurable: boolean; requiere_contrato: boolean }
export interface Rol { id: number; codigo: string; nombre: string; version: number | null; permisos: string[] }
export interface Persona { id: number; nombre: string; email: string | null; estado_cuenta: "ACTIVA" | "PENDIENTE"; estado_entrega: "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "DESCARTADO" | null }
export interface Empresa { id: string; nombre: string }
export interface CambioRol { rol_id: number | null; version: number; nombre: string; permisos: string[]; huella?: string }
export interface CambioAsignacion { rol_id: number; usuario_id: number; empresa_id: string; activo: boolean; valido_desde: string | null; valido_hasta: string | null; huella?: string }
export interface VistaRol { huella: string; antes: { nombre: string; permisos: string[]; version: number } | null; despues: { nombre: string; permisos: string[]; version: number }; afectados: { id: number }[]; agregados: string[]; retirados: string[] }
export interface VistaAsignacion { huella: string; antes: { activo: boolean; valido_desde: string | null; valido_hasta: string | null } | null; despues: CambioAsignacion }
export interface Asignacion { id: number; role_id: number; nombre: string; modulo: string; activo: boolean; vigente: boolean; valido_desde: string | null; valido_hasta: string | null }
export interface Explicacion { decisiones: (Capacidad & { permitido: boolean; motivo: string })[]; asignaciones: Asignacion[]; roles_globales: { codigo: string; nombre: string }[]; evaluado_en: string }
export interface Evento { id: number; evento: string; actor_ref: string; creado_en: string; correlation_id: string; payload: Record<string, unknown> }
export interface Pagina<T> { items: T[]; hay_mas: boolean }
export interface InvitacionCreada {
  id: number;
  estado: string;
  entrega: "EN_COLA" | "LOCAL";
  enlace_activacion_local?: string;
}

async function consultar<T>(ruta: string, datos?: unknown): Promise<T> {
  const respuesta = await fetch(`${API_URL}/acceso${ruta}`, {
    method: datos ? "POST" : "GET", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: datos ? JSON.stringify(datos) : undefined,
  });
  if (respuesta.status === 401) emitSessionExpired();
  const contenido = await respuesta.json();
  if (!respuesta.ok) throw new Error(typeof contenido.detail === "string" ? contenido.detail : "Revisa los datos e inténtalo de nuevo.");
  return contenido as T;
}
export const accesoService = {
  catalogo: () => consultar<{ version: number; capacidades: Capacidad[] }>("/catalogo"),
  roles: (q = "", pagina = 1) => consultar<Pagina<Rol>>(`/roles?q=${encodeURIComponent(q)}&pagina=${pagina}`),
  usuarios: (q = "", pagina = 1) => consultar<Pagina<Persona>>(`/usuarios?q=${encodeURIComponent(q)}&pagina=${pagina}`),
  todasEmpresas: (q = "", pagina = 1) => consultar<Pagina<Empresa>>(`/empresas?q=${encodeURIComponent(q)}&pagina=${pagina}`),
  invitar: (datos: { nombre: string; email: string; empresa_id: string }) => consultar<InvitacionCreada>("/usuarios/invitar", datos),
  reenviarInvitacion: (id: number) => consultar<{ entrega: string }>(`/usuarios/${id}/reenviar-invitacion`, {}),
  crearMembresia: (id: number, empresa_id: string) => consultar<{ usuario_id: number; empresa_id: string }>(`/usuarios/${id}/membresias`, { empresa_id }),
  empresas: (id: number) => consultar<{ items: Empresa[] }>(`/usuarios/${id}/empresas`),
  explicacion: (id: number, empresa: string) => consultar<Explicacion>(`/explicacion?usuario_id=${id}&empresa_id=${encodeURIComponent(empresa)}`),
  previewRol: (datos: CambioRol) => consultar<VistaRol>("/roles/vista-previa", datos),
  guardarRol: (datos: CambioRol) => consultar<{ id: number; version: number }>("/roles/guardar", datos),
  previewAsignacion: (datos: CambioAsignacion) => consultar<VistaAsignacion>("/asignaciones/vista-previa", datos),
  guardarAsignacion: (datos: CambioAsignacion) => consultar<{ ok: boolean }>("/asignaciones/guardar", datos),
  historial: (pagina = 1) => consultar<Pagina<Evento>>(`/historial?pagina=${pagina}`),
};
