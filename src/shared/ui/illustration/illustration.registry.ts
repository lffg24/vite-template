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
import lecciones from "@/assets/ilustraciones/lecciones.webp";
import linkFallido from "@/assets/ilustraciones/link-fallido.webp";
import planificacion from "@/assets/ilustraciones/planificacion.webp";
import preguntaEvaluacion from "@/assets/ilustraciones/pregunta-evaluacion.webp";
import terminaCapacitacionMujer from "@/assets/ilustraciones/termina-capacitacion-mujer.webp";
import terminasteCapacitacion from "@/assets/ilustraciones/terminaste-capacitacion.webp";
// Ilustraciones GENERALES (2026-09-14): estados, archivos y acceso.
import agendado from "@/assets/ilustraciones/agendado.webp";
import alerta from "@/assets/ilustraciones/alerta.webp";
import aprobado from "@/assets/ilustraciones/aprobado.webp";
import archivoCargando from "@/assets/ilustraciones/archivo-cargando.webp";
import archivosInformacion from "@/assets/ilustraciones/archivos-informacion.webp";
import buscar from "@/assets/ilustraciones/buscar.webp";
import cargarArchivo from "@/assets/ilustraciones/cargar-archivo.webp";
import certificado from "@/assets/ilustraciones/certificado.webp";
import checklist from "@/assets/ilustraciones/checklist.webp";
import configuracion from "@/assets/ilustraciones/configuracion.webp";
import descargarArchivo from "@/assets/ilustraciones/descargar-archivo.webp";
import error from "@/assets/ilustraciones/error.webp";
import evaluacionPregunta from "@/assets/ilustraciones/evaluacion-pregunta.webp";
import firma from "@/assets/ilustraciones/firma.webp";
import mantenimiento from "@/assets/ilustraciones/mantenimiento.webp";
import notificacion from "@/assets/ilustraciones/notificacion.webp";
import pdf from "@/assets/ilustraciones/pdf.webp";
import satisfactorio from "@/assets/ilustraciones/satisfactorio.webp";
import seguridadBloqueo from "@/assets/ilustraciones/seguridad-bloqueo.webp";
import seguridadUsuario from "@/assets/ilustraciones/seguridad-usuario.webp";

import type { IllustrationAsset } from "./illustration.types";

/**
 * Registro único de escenas raster aprobadas.
 *
 * Las claves nuevas describen intención (`courseLessonBuilder`), no la figura
 * dibujada. Las claves con guion conservan la API anterior de `Escena` mientras
 * sus consumidores migran de forma gradual; siguen resolviendo aquí y no en
 * rutas privadas de cada pantalla.
 */
export const illustrationRegistry = {
  courseLessonBuilder: {
    src: lecciones,
    variant: "product",
    aspectRatio: "4 / 3",
  },
  evaluationBuilder: {
    src: preguntaEvaluacion,
    variant: "product",
    aspectRatio: "1 / 1",
  },
  publicCourseWelcome: {
    src: capacitaciones,
    variant: "editorial",
    aspectRatio: "4 / 3",
  },
  agenda: { src: agenda, variant: "editorial" },
  "avance-curso": { src: avanceCurso, variant: "editorial" },
  "avanza-capacitacion": { src: avanzaCapacitacion, variant: "editorial" },
  "avanza-en-capacitaciones": { src: avanzaEnCapacitaciones, variant: "editorial" },
  "cambio-contrasena": { src: cambioContrasena, variant: "spot" },
  "cambio-password": { src: cambioPassword, variant: "spot" },
  capacitaciones: { src: capacitaciones, variant: "hero" },
  "certificado-capacitacion-hombre": {
    src: certificadoCapacitacionHombre,
    variant: "editorial",
  },
  "certificado-mujer": { src: certificadoMujer, variant: "editorial" },
  "curso-profesional": { src: cursoProfesional, variant: "editorial" },
  cursos: { src: cursos, variant: "editorial" },
  "error-link": { src: errorLink, variant: "spot" },
  "estudio-mujer": { src: estudioMujer, variant: "editorial" },
  "link-fallido": { src: linkFallido, variant: "spot" },
  planificacion: { src: planificacion, variant: "product" },
  "termina-capacitacion-mujer": {
    src: terminaCapacitacionMujer,
    variant: "editorial",
  },
  "terminaste-capacitacion": { src: terminasteCapacitacion, variant: "spot" },
  // --- GENERALES -----------------------------------------------------------
  agendado: { src: agendado, variant: "editorial" },
  alerta: { src: alerta, variant: "spot" },
  aprobado: { src: aprobado, variant: "spot" },
  "archivo-cargando": { src: archivoCargando, variant: "spot" },
  "archivos-informacion": { src: archivosInformacion, variant: "editorial" },
  buscar: { src: buscar, variant: "spot" },
  "cargar-archivo": { src: cargarArchivo, variant: "spot" },
  certificado: { src: certificado, variant: "spot" },
  checklist: { src: checklist, variant: "spot" },
  configuracion: { src: configuracion, variant: "spot" },
  "descargar-archivo": { src: descargarArchivo, variant: "spot" },
  error: { src: error, variant: "spot" },
  "evaluacion-pregunta": { src: evaluacionPregunta, variant: "editorial" },
  firma: { src: firma, variant: "spot" },
  mantenimiento: { src: mantenimiento, variant: "spot" },
  notificacion: { src: notificacion, variant: "editorial" },
  pdf: { src: pdf, variant: "spot" },
  satisfactorio: { src: satisfactorio, variant: "spot" },
  "seguridad-bloqueo": { src: seguridadBloqueo, variant: "spot" },
  "seguridad-usuario": { src: seguridadUsuario, variant: "editorial" },
} as const satisfies Record<string, IllustrationAsset>;

export type IllustrationName = keyof typeof illustrationRegistry;
