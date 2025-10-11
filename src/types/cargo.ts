// src/types/cargo.ts
export interface Cargo {
  id: number;
  nombre: string;
  nivel?: string | null;
  reporta_a_id: number | null;
  area_id: number | null; // ← el backend ya lo soporta (nullable)
}

export interface CargoCreate {
  nombre: string;
  nivel?: string | null;
  reporta_a_id?: number | null; // opcional al crear/editar
  area_id?: number | null; // opcional al crear/editar
}
