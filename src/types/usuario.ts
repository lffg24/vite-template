// src/types/usuario.ts
export interface Usuario {
  id: string;
  nombre: string;
  /** Campo oficial en el frontend/backend reestructurado */
  correo: string;

  /** Compatibilidad legacy: si en algún punto llega 'email', no lo uses en UI nueva */
  email?: string;

  // opcionales, por si el backend los envía
  cargo_id?: string | null;
  empresa_id?: string;
  activo?: boolean;
  created_at?: string;
}

export interface UsuarioCreate {
  nombre: string;
  correo: string;
  cargo_id?: string | null;
}
