import alerta from "@/assets/ilustraciones/alerta.webp";
import archivosInformacion from "@/assets/ilustraciones/archivos-informacion.webp";
import buscar from "@/assets/ilustraciones/buscar.webp";
import psicoWebBienvenida from "@/assets/ilustraciones/psico-web/bienvenida.webp";
import psicoWebCapacitacion from "@/assets/ilustraciones/psico-web/capacitacion.webp";
import psicoWebConsentimiento from "@/assets/ilustraciones/psico-web/consentimiento.webp";
import psicoWebDatosGenerales from "@/assets/ilustraciones/psico-web/datos-generales.webp";
import psicoWebDeclaracion from "@/assets/ilustraciones/psico-web/declaracion.webp";
import psicoWebEnvioCompletado from "@/assets/ilustraciones/psico-web/envio-completado.webp";
import psicoWebIdentificacion from "@/assets/ilustraciones/psico-web/identificacion.webp";
import psicoWebInstrumento from "@/assets/ilustraciones/psico-web/instrumento.webp";
import psicoWebInstrumentoCompletado from "@/assets/ilustraciones/psico-web/instrumento-completado.webp";
import psicoWebInstructivo from "@/assets/ilustraciones/psico-web/instructivo.webp";
import psicoWebRecorrido from "@/assets/ilustraciones/psico-web/recorrido.webp";
import psicoWebResumen from "@/assets/ilustraciones/psico-web/resumen.webp";
import recuperacionAcceso from "@/assets/password-recovery-sent.png";

import type { IllustrationAsset } from "./illustration.types";

// Registro compartido: cada escena se carga con su componente de destino.
// Las pantallas de Psicosocial elegirán la escena según su estado y contexto.
export const illustrationRegistry = {
  alerta: { src: alerta, variant: "spot", aspectRatio: "1 / 1" },
  "archivos-informacion": { src: archivosInformacion, variant: "editorial", aspectRatio: "4 / 3" },
  buscar: { src: buscar, variant: "spot", aspectRatio: "4 / 3" },
  psicoWebBienvenida: { src: psicoWebBienvenida, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebCapacitacion: { src: psicoWebCapacitacion, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebConsentimiento: { src: psicoWebConsentimiento, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebDatosGenerales: { src: psicoWebDatosGenerales, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebDeclaracion: { src: psicoWebDeclaracion, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebEnvioCompletado: { src: psicoWebEnvioCompletado, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebIdentificacion: { src: psicoWebIdentificacion, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebInstrumento: { src: psicoWebInstrumento, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebInstrumentoCompletado: { src: psicoWebInstrumentoCompletado, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebInstructivo: { src: psicoWebInstructivo, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebRecorrido: { src: psicoWebRecorrido, variant: "hero", aspectRatio: "4 / 3" },
  psicoWebResumen: { src: psicoWebResumen, variant: "hero", aspectRatio: "4 / 3" },
  recuperacionAcceso: { src: recuperacionAcceso, variant: "spot", aspectRatio: "4 / 3" },
} as const satisfies Record<string, IllustrationAsset>;

export type IllustrationName = keyof typeof illustrationRegistry;
