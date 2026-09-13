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

import agenda from "@/assets/ilustraciones/agenda.webp";
import avanceCurso from "@/assets/ilustraciones/avance-curso.webp";
import avanzaCapacitacion from "@/assets/ilustraciones/avanza-capacitacion.webp";
import avanzaEnCapacitaciones from "@/assets/ilustraciones/avanza-en-capacitaciones.webp";
import cambioContrasena from "@/assets/ilustraciones/cambio-contrasena.webp";
import cambioPassword from "@/assets/ilustraciones/cambio-password.webp";
import capacitaciones from "@/assets/ilustraciones/capacitaciones.webp";
import certificadoCapacitacionHombre from "@/assets/ilustraciones/certificado-capacitacion-hombre.webp";
import certificadoMujer from "@/assets/ilustraciones/certificado-mujer.webp";
import cursoProfesional from "@/assets/ilustraciones/curso-profesional.webp";
import cursos from "@/assets/ilustraciones/cursos.webp";
import errorLink from "@/assets/ilustraciones/error-link.webp";
import estudioMujer from "@/assets/ilustraciones/estudio-mujer.webp";
import linkFallido from "@/assets/ilustraciones/link-fallido.webp";
import planificacion from "@/assets/ilustraciones/planificacion.webp";
import terminaCapacitacionMujer from "@/assets/ilustraciones/termina-capacitacion-mujer.webp";
import terminasteCapacitacion from "@/assets/ilustraciones/terminaste-capacitacion.webp";

import { cn } from "@/lib/utils";

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
export const ESCENAS = {
  "agenda": agenda,
  "avance-curso": avanceCurso,
  "avanza-capacitacion": avanzaCapacitacion,
  "avanza-en-capacitaciones": avanzaEnCapacitaciones,
  "cambio-contrasena": cambioContrasena,
  "cambio-password": cambioPassword,
  "capacitaciones": capacitaciones,
  "certificado-capacitacion-hombre": certificadoCapacitacionHombre,
  "certificado-mujer": certificadoMujer,
  "curso-profesional": cursoProfesional,
  "cursos": cursos,
  "error-link": errorLink,
  "estudio-mujer": estudioMujer,
  "link-fallido": linkFallido,
  "planificacion": planificacion,
  "termina-capacitacion-mujer": terminaCapacitacionMujer,
  "terminaste-capacitacion": terminasteCapacitacion,
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
