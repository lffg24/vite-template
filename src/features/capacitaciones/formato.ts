// src/features/capacitaciones/formato.ts
//
// Formateo para las pantallas de Capacitaciones. Vive aquí y no en
// `lib/utils.ts` porque es vocabulario del módulo: «intensidad horaria» y
// «vigencia» no significan lo mismo fuera de una constancia.

export const PERMISOS_CAPACITACIONES = {
  editar: "hseq.capacitacion.catalogo.editar",
  publicar: "hseq.capacitacion.catalogo.publicar",
  asignar: "hseq.capacitacion.asignar",
} as const;

export const PERMISOS_CAPACITACIONES_TODOS: string[] = Object.values(
  PERMISOS_CAPACITACIONES
);

/**
 * Minutos a la forma en que se leen en una constancia.
 *
 * La intensidad horaria se declara en minutos porque es lo que el validador
 * normativo exige, pero «90» no se lee: «1 h 30 min» sí.
 */
export function formatearIntensidad(minutos: number | null | undefined): string {
  if (minutos == null) return "Sin declarar";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

export function formatearVigenciaMeses(meses: number | null | undefined): string {
  if (meses == null) return "Sin vencimiento";
  if (meses === 12) return "1 año";
  if (meses % 12 === 0) return `${meses / 12} años`;
  return `${meses} ${meses === 1 ? "mes" : "meses"}`;
}

const FECHA_LARGA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const FECHA_HORA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : FECHA_LARGA.format(d);
}

export function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : FECHA_HORA.format(d);
}

/**
 * Días que faltan para una fecha, para avisar antes de que el enlace caduque.
 *
 * Se calcula sobre el reloj del navegador solo para ORDENAR y AVISAR. Nunca
 * para decidir si un enlace sirve: eso lo dice `utilizable`, que la base
 * calcula con su propio `NOW()`.
 */
export function diasHasta(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

/** Texto del cupo. `null` no es «cero»: es «sin límite». */
export function formatearCupo(usos: number, cupoMax: number | null): string {
  return cupoMax == null ? `${usos} usos · sin límite` : `${usos} de ${cupoMax}`;
}
