import alerta from "@/assets/ilustraciones/alerta.webp";
import archivosInformacion from "@/assets/ilustraciones/archivos-informacion.webp";
import buscar from "@/assets/ilustraciones/buscar.webp";
import recuperacionAcceso from "@/assets/password-recovery-sent.png";

import type { IllustrationAsset } from "./illustration.types";

// Registro compartido: cada escena se carga con su componente de destino.
// Las pantallas de Psicosocial elegirán la escena según su estado y contexto.
export const illustrationRegistry = {
  alerta: { src: alerta, variant: "spot", aspectRatio: "1 / 1" },
  "archivos-informacion": { src: archivosInformacion, variant: "editorial", aspectRatio: "4 / 3" },
  buscar: { src: buscar, variant: "spot", aspectRatio: "4 / 3" },
  recuperacionAcceso: { src: recuperacionAcceso, variant: "spot", aspectRatio: "4 / 3" },
} as const satisfies Record<string, IllustrationAsset>;

export type IllustrationName = keyof typeof illustrationRegistry;
