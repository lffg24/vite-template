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

import { cn } from "@/lib/utils";
import {
  Illustration,
  illustrationRegistry,
  type IllustrationName,
} from "./illustration";

/**
 * Nombre de escena → archivo.
 *
 * El nombre es el del archivo de origen, que ya viene descrito por función
 * (`certificado-mujer`, `error-link`). Antes se numeraban por orden alfabético
 * y eso tenía un defecto que no se ve hasta que muerde: al cambiar una imagen de
 * la carpeta, **cada escena pasaba a apuntar a un dibujo distinto** sin que
 * nadie tocara una línea. Una pantalla que decía «publicar» habría acabado
 * enseñando un candado.
 *
 * Añadir un archivo a la carpeta no basta: hay que importarlo aquí. Si falta,
 * falla el build — que es donde debe fallar.
 */
export const ESCENAS = illustrationRegistry;

export type NombreEscena = Exclude<IllustrationName, "courseLessonBuilder" | "evaluationBuilder">;

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
    <Illustration
      name={nombre}
      size="full"
      decorative={titulo == null}
      alt={titulo ?? ""}
      className={cn(ANCHOS[tamano], className)}
    />
  );
}
