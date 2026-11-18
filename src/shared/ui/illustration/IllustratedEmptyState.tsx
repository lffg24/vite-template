// src/shared/ui/illustration/IllustratedEmptyState.tsx
//
// Nombre documentado en `docs/design/ABRIL360_ILLUSTRATION_SYSTEM.md`, que
// ahora DELEGA en la pieza de la casa.
//
// Era la segunda definición del vacío ilustrado, y la que no usaba nadie: el
// producto entero llamaba a la de Capacitaciones. Dos vacíos, uno bueno en el
// sitio equivocado y otro en el sitio correcto sin usar. Se quedó la
// implementación que las pantallas ya mostraban y este nombre sigue existiendo
// para no romper la API documentada.

import type { ReactNode } from "react";

import { EstadoVacio } from "@/shared/ui/EstadoVacio";

import type { IllustrationName } from "./illustration.registry";

export function IllustratedEmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration: IllustrationName;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <EstadoVacio
      escena={illustration}
      titulo={title}
      descripcion={description}
      accion={action}
      className={className}
    />
  );
}
