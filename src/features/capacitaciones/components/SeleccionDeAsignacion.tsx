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
import { EstadoAsignacionBadge } from "@/features/capacitaciones/components/Insignias";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel, TablaBody, TablaHead, TablaPanel } from "@/shared/ui/Panel";

type Destino = "invitaciones" | "enlaces";

const COPIA: Record<
  Destino,
  { titulo: string; descripcion: string; accion: string; vacio: string; Icono: typeof Send }
> = {
  invitaciones: {
    titulo: "Invitaciones",
    descripcion:
      "Cada persona recibe un enlace propio, ligado a su ficha. Es lo que hay que repartir cuando la asignación exige invitación individual.",
    accion: "Ver invitaciones",
    vacio:
      "Las invitaciones se emiten sobre una asignación. Asigna primero una versión publicada a la empresa y vuelve aquí.",
    Icono: Send,
  },
  enlaces: {
    titulo: "Enlaces de grupo",
    descripcion:
      "Un enlace que circula y sirve para que cualquiera vea de qué va el curso. Con invitación individual NO sirve para inscribirse: para eso está la invitación personal.",
    accion: "Ver enlaces",
    vacio:
      "Los enlaces se generan sobre una asignación. Asigna primero una versión publicada a la empresa y vuelve aquí.",
    Icono: Link2,
  },
};

/** Activa y sin nada repartido = trabajo detenido. Esas van primero. */
function urgencia(a: AsignacionResumen): number {
  if (a.estado === "ACTIVA" && a.enlaces_activos === 0) return 0;
  if (a.estado === "ACTIVA") return 1;
  return 2;
}

export default function SeleccionDeAsignacion({ destino }: { destino: Destino }) {
  const navegar = useNavigate();
  const consulta = useConsulta<AsignacionResumen[]>(() => listarAsignaciones(), []);
  const { titulo, descripcion, accion, vacio, Icono } = COPIA[destino];

  const lista = [...(consulta.datos ?? [])].sort(
    (a, b) => urgencia(a) - urgencia(b) || a.curso_titulo.localeCompare(b.curso_titulo, "es")
  );

  return (
    <div className="space-y-6">
      <PageHeader titulo={titulo} icono={Icono} descripcion={descripcion} />

      <Panel titulo="Elige la asignación">
        {consulta.fase === "cargando" ? <CargandoTabla /> : null}

        {consulta.fase === "error" && consulta.error ? (
          <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
        ) : null}

        {consulta.fase === "listo" && lista.length === 0 ? (
          <SinDatos
            titulo="Todavía no hay ninguna asignación"
            descripcion={vacio}
            accion={
              <Button variant="rel" onClick={() => navegar("/capacitaciones/asignaciones")}>
                Ir a Asignaciones
              </Button>
            }
          />
        ) : null}

        {consulta.fase === "listo" && lista.length > 0 ? (
          <TablaPanel>
            <table className="min-w-full text-left text-sm">
              <TablaHead>
                <tr>
                  <th scope="col" className="px-4 py-3">Curso</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Fecha objetivo</th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </TablaHead>
              <TablaBody>
                {lista.map((a) => (
                  <tr key={a.id} className="hover:bg-rel-surface-subtle">
                    <td className="px-4 py-4">
                      <span className="font-black text-rel-dark">{a.curso_titulo}</span>
                      <p className="text-xs text-rel-muted">Versión {a.numero_version}</p>
                    </td>
                    <td className="px-4 py-4">
                      <EstadoAsignacionBadge estado={a.estado} />
                    </td>
                    <td className="px-4 py-4 text-rel-muted">
                      {formatearFecha(a.fecha_objetivo)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="relOutline"
                        size="sm"
                        onClick={() =>
                          navegar(`/capacitaciones/asignaciones/${a.id}/${destino}`)
                        }
                      >
                        {accion}
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </TablaBody>
            </table>
          </TablaPanel>
        ) : null}
      </Panel>
    </div>
  );
}
