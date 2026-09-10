// src/shared/ui/ilustraciones/Ilustracion.tsx
//
// La única forma de pintar una ilustración en ABRIL-360.
//
// Existe para que ninguna pantalla vuelva a llevar un `<svg>` suelto dentro.
// Un SVG pegado en una página es, en la práctica, una ilustración privada: no
// se reutiliza, no sigue la paleta cuando cambia y nadie sabe que está ahí. Se
// pide por nombre, y el dibujo se puede rehacer entero sin tocar la pantalla.
//
// Accesibilidad, que es donde casi siempre se falla con las ilustraciones:
// por defecto son DECORATIVAS (`aria-hidden`), porque el texto que acompañan ya
// dice lo mismo y anunciarlas duplica. Solo si la ilustración aporta
// información que no está escrita al lado se le pasa `titulo`, y entonces pasa
// a ser `role="img"` con nombre accesible.

import { CATALOGO, type NombreIlustracion } from "./catalogo";

/**
 * Anchos fijos, escritos completos para que Tailwind los conserve al compilar.
 *
 * La altura no se fija: el `viewBox` es 200×150 en todas, así que la
 * proporción la resuelve el propio SVG y ninguna sale aplastada.
 */
const ANCHOS = {
  sm: "w-24",
  md: "w-40",
  lg: "w-56",
  xl: "w-72",
} as const;

export type TamanoIlustracion = keyof typeof ANCHOS;

export function Ilustracion({
  nombre,
  tamano = "md",
  titulo,
  className = "",
}: {
  nombre: NombreIlustracion;
  tamano?: TamanoIlustracion;
  /** Solo si el dibujo dice algo que el texto de al lado NO dice. */
  titulo?: string;
  className?: string;
}) {
  const Dibujo = CATALOGO[nombre];
  const decorativa = !titulo;

  return (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${ANCHOS[tamano]} h-auto max-w-full ${className}`}
      role={decorativa ? undefined : "img"}
      aria-hidden={decorativa ? true : undefined}
      aria-label={titulo}
    >
      <Dibujo />
    </svg>
  );
}

export { type NombreIlustracion };
