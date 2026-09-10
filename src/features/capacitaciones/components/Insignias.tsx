// src/features/capacitaciones/components/Insignias.tsx
//
// Estados como insignia. Regla que gobierna este archivo (constitución §5 y
// §21): **el color nunca es la única señal**. Cada insignia lleva su texto, y
// las que dependen de una fecha llevan además el motivo.

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CategoriaCurso,
  EstadoAsignacion,
  EstadoCurso,
  EnlaceResumen,
  ModoIdentidad,
  TipoLeccion,
} from "@/types/capacitaciones";
import { ETIQUETA_CATEGORIA, ETIQUETA_TIPO_LECCION } from "@/types/capacitaciones";
import { diasHasta } from "../formato";

export function EstadoCursoBadge({ estado }: { estado: EstadoCurso }) {
  if (estado === "PUBLICADO") {
    return <Badge variant="relSuccess">Publicado</Badge>;
  }
  if (estado === "ARCHIVADO") {
    return <Badge variant="relNeutral">Archivado</Badge>;
  }
  return <Badge variant="relWarning">Borrador</Badge>;
}

export function EstadoAsignacionBadge({ estado }: { estado: EstadoAsignacion }) {
  return estado === "ACTIVA" ? (
    <Badge variant="relSuccess">Activa</Badge>
  ) : (
    <Badge variant="relNeutral">Cerrada</Badge>
  );
}

/**
 * Estado de un enlace, con el motivo cuando no sirve.
 *
 * «Revocado» y «caducado» se ven distintos porque se arreglan distinto: uno lo
 * decidió alguien, el otro lo decidió el calendario. `utilizable` lo calcula la
 * base con su propio reloj — nunca se recalcula aquí.
 */
export function EstadoEnlaceBadge({ enlace }: { enlace: EnlaceResumen }) {
  if (enlace.estado === "REVOCADO") {
    return <Badge variant="relDanger">Revocado</Badge>;
  }
  if (!enlace.utilizable) {
    return <Badge variant="relNeutral">Caducado</Badge>;
  }

  const dias = diasHasta(enlace.expira_en);
  if (dias !== null && dias <= 3) {
    return <Badge variant="relWarning">Caduca en {dias === 1 ? "1 día" : `${dias} días`}</Badge>;
  }
  if (enlace.cupo_max != null && enlace.usos >= enlace.cupo_max) {
    return <Badge variant="relWarning">Cupo lleno</Badge>;
  }
  return <Badge variant="relSuccess">Activo</Badge>;
}

export function CategoriaBadge({
  categoria,
  restringida,
}: {
  categoria: CategoriaCurso;
  restringida?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="relBrand" title={ETIQUETA_CATEGORIA[categoria]}>
        {categoria}
      </Badge>
      {restringida ? (
        <Badge
          variant="relInfo"
          title="Solo puede dictarlo un proveedor autorizado. La restricción viaja congelada en la versión publicada."
        >
          Restringida
        </Badge>
      ) : null}
    </span>
  );
}

/**
 * Tipo de lección. Los no implementados se ven atenuados **y lo dicen**.
 *
 * El backend rechaza publicar una versión con un tipo que nadie sabe
 * reproducir. Que aquí se lea el motivo evita que alguien redacte una lección
 * de video entera para descubrirlo al pulsar «Publicar».
 */
export function TipoLeccionBadge({
  tipo,
  implementado,
}: {
  tipo: TipoLeccion;
  implementado: boolean;
}) {
  return (
    <Badge
      variant={implementado ? "relInfo" : "relNeutral"}
      className={cn(!implementado && "opacity-70")}
      title={
        implementado
          ? undefined
          : "Declarado en el modelo, todavía sin reproductor. No se puede publicar una versión que lo use."
      }
    >
      {ETIQUETA_TIPO_LECCION[tipo]}
      {implementado ? "" : " · sin reproductor"}
    </Badge>
  );
}

/**
 * Qué se reparte en esta asignación.
 *
 * No es decoración: dos asignaciones del mismo curso pueden tener modos
 * distintos, y de eso depende si el enlace de grupo sirve para inscribirse o si
 * hay que emitir invitaciones. Antes esta información no salía del backend y
 * quien organizaba tenía que acordarse.
 */
export function ModoIdentidadBadge({ modo }: { modo: ModoIdentidad }) {
  if (modo === "INVITACION_INDIVIDUAL") {
    return (
      <Badge
        variant="relBrand"
        title="Solo entra quien esté en la nómina, por su enlace personal. El enlace de grupo solo sirve para mirar."
      >
        Invitación personal
      </Badge>
    );
  }
  if (modo === "AUTODECLARADA") {
    return (
      <Badge
        variant="relInfo"
        title="Cualquiera con el enlace puede inscribirse escribiendo sus datos. Nadie los verifica."
      >
        Enlace abierto
      </Badge>
    );
  }

  // Ni `else` ni valor por defecto, y es deliberado: si la respuesta no trae el
  // modo —un `undefined` de un contrato desactualizado— el `else` habría dicho
  // «enlace abierto», que es justo la afirmación peligrosa. Un modo que no se
  // reconoce se muestra como lo que es.
  return (
    <Badge variant="relNeutral" title="La respuesta del servidor no trae el modo de esta asignación.">
      Modo sin determinar
    </Badge>
  );
}
