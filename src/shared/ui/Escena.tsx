// src/shared/ui/Escena.tsx
//
// Las ilustraciones **con personajes**: los momentos grandes del producto —un
// modal de confirmación, una portada, un estado que hay que explicar—.
//
// Son otra cosa que `Ilustracion`, y por eso son otro componente. Aquélla son
// dibujos vectoriales de decenas de bytes que leen los tokens `rel-*` y cambian
// de color con el tema; éstas son mapas de bits producidos por un ilustrador,
// con su propia paleta, que no se pueden retintar. Un componente con un
// parámetro para las dos acabaría ramificando en cada línea.
//
// ── LA REGLA DE LOS ARCHIVOS, que es lo que evita una caída en producción ──
//
// Se IMPORTAN, nunca se escriben como ruta. Un `src="/ilustraciones/x.png"` o,
// peor, una ruta del disco de alguien, funciona en el portátil donde se escribió
// y da 404 en producción — y no falla hasta que un usuario abre esa pantalla.
// Importándolas, Vite las resuelve al compilar: si el archivo no está, **falla
// el build**, que es el momento correcto para enterarse. Además las emite con
// el hash en el nombre, así que se pueden cachear para siempre y un cambio se
// propaga solo.
//
// ── Y LA REGLA DEL PESO ──
//
// Los originales son PNG de ~1,1 MB a 1448 px de ancho, para pintarse a 300.
// Aquí entran ya convertidos a WebP de ~45 KB con
// `scripts/optimizar-ilustraciones.py`. No es optimización prematura: un binario
// que entra al repositorio se queda en el historial para siempre, aunque se
// reemplace después.

import acceso_restringido from "@/assets/ilustraciones/acceso-restringido.webp";
import publicar from "@/assets/ilustraciones/publicar.webp";
import curso from "@/assets/ilustraciones/curso.webp";
import ilustracion02 from "@/assets/ilustraciones/ilustracion-02.webp";
import ilustracion03 from "@/assets/ilustraciones/ilustracion-03.webp";
import ilustracion04 from "@/assets/ilustraciones/ilustracion-04.webp";
import ilustracion05 from "@/assets/ilustraciones/ilustracion-05.webp";
import ilustracion07 from "@/assets/ilustraciones/ilustracion-07.webp";
import ilustracion08 from "@/assets/ilustraciones/ilustracion-08.webp";
import ilustracion09 from "@/assets/ilustraciones/ilustracion-09.webp";

import { cn } from "@/lib/utils";

/**
 * Nombre de escena → archivo.
 *
 * La indirección es el punto: las pantallas piden «publicar» y no un archivo,
 * así que cambiar la ilustración —o renombrarla cuando se le encuentre su
 * sitio— no toca ninguna pantalla. Las que todavía no tienen nombre propio lo
 * llevan por índice, y eso es honesto: decir `ilustracion-03` es mejor que
 * bautizarla «éxito» y descubrir luego que dibuja otra cosa.
 */
export const ESCENAS = {
  publicar,
  "acceso-restringido": acceso_restringido,
  curso,
  "ilustracion-02": ilustracion02,
  "ilustracion-03": ilustracion03,
  "ilustracion-04": ilustracion04,
  "ilustracion-05": ilustracion05,
  "ilustracion-07": ilustracion07,
  "ilustracion-08": ilustracion08,
  "ilustracion-09": ilustracion09,
} as const;

export type NombreEscena = keyof typeof ESCENAS;

const ANCHOS = {
  sm: "w-32",
  md: "w-48",
  lg: "w-64",
  xl: "w-80",
} as const;

export function Escena({
  nombre,
  tamano = "md",
  titulo,
  className,
}: {
  nombre: NombreEscena;
  tamano?: keyof typeof ANCHOS;
  /** Solo si la escena dice algo que el texto de al lado NO dice. */
  titulo?: string;
  className?: string;
}) {
  return (
    <img
      src={ESCENAS[nombre]}
      // Decorativa por defecto: acompaña a un titular que ya dice lo mismo, y
      // anunciarla sería leer el mensaje dos veces. `alt=""` es lo que la
      // esconde del lector de pantalla; omitir el atributo haría que leyera el
      // nombre del archivo.
      alt={titulo ?? ""}
      // Las escenas viven en modales y pantallas de estado, que casi nunca se
      // abren: cargarlas al entrar costaría ancho de banda por algo que quizá
      // no se vea.
      loading="lazy"
      decoding="async"
      className={cn(ANCHOS[tamano], "h-auto max-w-full select-none", className)}
      draggable={false}
    />
  );
}
