// src/features/capacitaciones/components/SeleccionDeAsignacion.tsx
//
// La entrada por el menú a Invitaciones y a Enlaces de grupo.
//
// Las dos pantallas necesitan una asignación para existir —una invitación es
// siempre a *algo*— y hasta ahora eso se resolvía obligando a entrar por la fila
// correcta de la tabla de Asignaciones. Funcionaba y era inencontrable: había
// que saber de antemano que la pantalla existía.
//
// Aquí el orden se invierte: se entra por lo que se quiere hacer («voy a
// invitar») y se elige a qué. La ruta profunda sigue existiendo y sigue siendo
// la que se comparte; esto solo añade la puerta que faltaba.

import { useNavigate } from "react-router-dom";
import { ChevronRight, Link2, Send } from "lucide-react";

import { listarAsignaciones } from "@/services/capacitacionesService";
import type { AsignacionResumen } from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import { formatearFecha } from "@/features/capacitaciones/formato";
import {
  EstadoAsignacionBadge,
  ModoIdentidadBadge,
} from "@/features/capacitaciones/components/Insignias";
import {
  ErrorConsulta,
  SinDatos,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import type { NombreEscena } from "@/shared/ui/Escena";

type Destino = "invitaciones" | "enlaces";

const COPIA: Record<
  Destino,
  {
    titulo: string;
    descripcion: string;
    accion: string;
    vacio: string;
    Icono: typeof Send;
    escena: NombreEscena;
  }
> = {
  invitaciones: {
    titulo: "Invitaciones",
    descripcion:
      "Cada persona recibe un enlace propio, ligado a su ficha. Es lo que hay que repartir cuando la asignación exige invitación individual.",
    accion: "Ver invitaciones",
    vacio:
      "Las invitaciones se emiten sobre una asignación. Asigna primero una versión publicada a la empresa y vuelve aquí.",
    Icono: Send,
    escena: "notificacion",
  },
  enlaces: {
    titulo: "Enlaces de grupo",
    descripcion:
      "Un enlace que circula y sirve para que cualquiera vea de qué va el curso. Con invitación individual NO sirve para inscribirse: para eso está la invitación personal.",
    accion: "Ver enlaces",
    vacio:
      "Los enlaces se generan sobre una asignación. Asigna primero una versión publicada a la empresa y vuelve aquí.",
    Icono: Link2,
    escena: "notificacion",
  },
};

/** Activa y sin nada repartido = trabajo detenido. Esas van primero. */
function urgencia(a: AsignacionResumen): number {
  if (a.estado === "ACTIVA" && a.enlaces_activos === 0) return 0;
  if (a.estado === "ACTIVA") return 1;
  return 2;
}

/**
 * Columnas de la asignacion a elegir.
 *
 * La accion sigue siendo un boton y no un enlace en el nombre porque aqui la
 * fila no se abre: se elige. El destino depende de por donde se entro
 * —invitaciones o enlaces—, asi que el nombre de la fila no tiene una ruta
 * unica que pudiera copiarse o compartirse.
 */
function columnasAsignacion(
  accion: string,
  elegir: (a: AsignacionResumen) => void,
): ColumnaTabla<AsignacionResumen>[] {
  return [
    {
      clave: "curso",
      titulo: "Curso",
      celda: (a) => (
        <CeldaPrincipal titulo={a.curso_titulo} apoyo={`Versi\u00f3n ${a.numero_version}`} />
      ),
      valor: (a) => a.curso_titulo,
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (a) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <EstadoAsignacionBadge estado={a.estado} />
          {/* Aqui es donde mas falta hace: elegir «enlaces» sobre una
              asignacion con invitacion personal lleva a generar algo que no
              sirve para inscribir a nadie. */}
          <ModoIdentidadBadge modo={a.modo_identidad} />
        </div>
      ),
      valor: (a) => a.estado,
    },
    {
      clave: "fecha",
      titulo: "Fecha objetivo",
      celda: (a) => (
        <span className="text-muted-foreground">{formatearFecha(a.fecha_objetivo)}</span>
      ),
      valor: (a) => a.fecha_objetivo || "",
    },
    {
      clave: "accion",
      titulo: "Acciones",
      soloAcciones: true,
      alineacion: "derecha",
      celda: (a) => (
        <Button variant="relOutline" size="sm" onClick={() => elegir(a)}>
          {accion}
          <ChevronRight aria-hidden="true" />
        </Button>
      ),
    },
  ];
}

export default function SeleccionDeAsignacion({ destino }: { destino: Destino }) {
  const navegar = useNavigate();
  const consulta = useConsulta<AsignacionResumen[]>(() => listarAsignaciones(), []);
  const { titulo, descripcion, accion, vacio, Icono, escena } = COPIA[destino];

  const lista = [...(consulta.datos ?? [])].sort(
    (a, b) => urgencia(a) - urgencia(b) || a.curso_titulo.localeCompare(b.curso_titulo, "es")
  );

  return (
    <div className="space-y-6">
      <PageHeader titulo={titulo} icono={Icono} descripcion={descripcion} />

      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase !== "error" ? (
        <TablaDatos
          filas={lista}
          columnas={columnasAsignacion(accion, (a) =>
            navegar(`/capacitaciones/asignaciones/${a.id}/${destino}`)
          )}
          claveFila={(a) => String(a.id)}
          etiquetaTabla="Asignaciones disponibles"
          etiquetaElemento="asignaciones"
          cargando={consulta.fase === "cargando"}
          /* El vacio sigue siendo `SinDatos`, con su escena y su salida: aqui
             no basta con decir que no hay nada, hay que llevar a crear la
             primera asignacion. `vacio` acepta nodos justamente para esto. */
          vacio={
            <SinDatos
              escena={escena}
              titulo="Todavía no hay ninguna asignación"
              descripcion={vacio}
              accion={
                <Button variant="rel" onClick={() => navegar("/capacitaciones/asignaciones")}>
                  Ir a Asignaciones
                </Button>
              }
            />
          }
        />
      ) : null}
    </div>
  );
}
