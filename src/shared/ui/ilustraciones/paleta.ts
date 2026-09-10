// src/shared/ui/ilustraciones/paleta.ts
//
// Los colores que pueden usar las ilustraciones. Son EXACTAMENTE los tokens
// `rel-*`, no una copia de sus valores.
//
// Por qué importa: una ilustración con `#7C3AED` escrito dentro queda fuera del
// sistema — cuando se retoca la paleta, todas las pantallas cambian y los
// dibujos se quedan con el color viejo. Referenciando la variable CSS, el
// dibujo se mueve desde el mismo punto que el resto del producto y funciona
// igual en Psicosocial, en Capacitaciones y en lo que venga.
//
// Consecuencia deliberada: esta paleta es CERRADA. Si una ilustración necesita
// un color que no está aquí, lo que falta es un token, no una excepción.

export const PALETA = {
  /** Trazo y texto. */
  tinta: "hsl(var(--rel-dark))",
  /** Masa principal del dibujo. */
  primario: "hsl(var(--rel-primary))",
  /** Segundo plano de la masa principal. */
  acento: "hsl(var(--rel-accent))",
  /** Fondo suave: blobs, sombras de apoyo, rellenos amplios. */
  suave: "hsl(var(--rel-accent-subtle))",
  /** Papel: tarjetas, hojas, pantallas. */
  superficie: "hsl(var(--rel-surface))",
  /** Papel de segundo orden. */
  superficieSuave: "hsl(var(--rel-surface-subtle))",
  /** Contornos. */
  borde: "hsl(var(--rel-border-strong))",
  /** Detalle apagado: líneas de texto simulado. */
  neutro: "hsl(var(--rel-muted-foreground))",

  // --- semánticos: solo cuando el dibujo AFIRMA un estado ------------------
  exito: "hsl(var(--rel-success))",
  exitoSuave: "hsl(var(--rel-success-subtle))",
  alerta: "hsl(var(--rel-warning))",
  alertaSuave: "hsl(var(--rel-warning-subtle))",
  peligro: "hsl(var(--rel-danger))",
  peligroSuave: "hsl(var(--rel-danger-subtle))",
} as const;

export type ColorIlustracion = keyof typeof PALETA;
