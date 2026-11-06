// src/types/constancia.ts
//
// La constancia tal como la devuelve el servidor para imprimirla. La usan el
// participante (D-09, por sesión) y la administración (por id): es el mismo
// documento para las dos audiencias.

/** Lo que el servidor congela. Se pinta lo que venga, sin exigir una forma. */
export interface SnapshotConstancia {
  documento?: string;
  participante?: {
    nombres?: string;
    apellidos?: string;
    tipo_documento?: string;
    numero_documento?: string;
    cargo?: string | null;
  };
  empresa?: { nombre?: string; nit?: string | null };
  curso?: {
    titulo?: string;
    categoria?: string;
    version?: number;
    intensidad_horaria_min?: number | null;
    responsable_contenido?: string | null;
  };
  completada_en?: string | null;
  vence_el?: string | null;
  aviso?: string;
  identidad?: { modo?: string; aviso?: string | null };
}

export interface ConstanciaImprimible {
  folio: number;
  codigo_verificacion: string;
  estado: string;
  situacion?: string | null;
  emitida_en: string;
  vence_el: string | null;
  anulada_en?: string | null;
  snapshot: SnapshotConstancia;
}
