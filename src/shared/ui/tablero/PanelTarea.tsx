// src/shared/ui/tablero/PanelTarea.tsx
//
// El detalle de una tarea, en un panel lateral: se abre SIN sacar a la persona
// del tablero. Es la vista de Jira al abrir una incidencia, con la misma
// anatomía:
//
//   cabecera   clave + título + estado (que también mueve la tarea)
//   pestañas   Detalle · Actividad
//   detalle    descripción + rejilla de campos (responsables, prioridad, fechas…)
//   actividad  quién hizo qué y cuándo, lo más reciente arriba
//
// El panel NO sabe qué campos tiene tu dominio: los recibe como pares
// etiqueta/valor, ya formateados. Licitaciones pasa entidad, valor y modalidad;
// un gestor de tareas pasará otros. Lo que sí es común —estado, prioridad,
// responsables, vencimiento— sale del modelo normalizado.

import { useState, type ReactNode } from "react";

import { Desplegable } from "@/shared/ui/Desplegable";
import { PanelLateral } from "@/shared/ui/PanelLateral";
import { Pestanas } from "@/shared/ui/Pestanas";
import { GrupoAvatares } from "./AvatarPersona";
import { IndicadorPrioridad } from "./IndicadorPrioridad";
import {
  estaVencida,
  formatearVence,
  type ColumnaTablero,
  type SolicitudMovimiento,
  type TareaVista,
} from "./modelo";

export interface CampoDetalle {
  etiqueta: string;
  valor: ReactNode;
}

export interface EventoActividad {
  id: string;
  autor: string;
  /** Lo que pasó, en una frase: «movió la tarea a Descartada». */
  texto: string;
  /** Ya formateada: «hace 2 h», «12 nov». */
  cuando: string;
}

export function PanelTarea<T>({
  tarea,
  columnas,
  alCerrar,
  alSolicitarMovimiento,
  descripcion,
  campos,
  actividad,
  acciones,
}: {
  /** `null` = cerrado. */
  tarea: TareaVista<T> | null;
  columnas: ColumnaTablero[];
  alCerrar: () => void;
  alSolicitarMovimiento?: SolicitudMovimiento<T>;
  descripcion?: ReactNode;
  campos?: CampoDetalle[];
  actividad?: EventoActividad[];
  /** Botones del pie del panel (Editar, Archivar…). */
  acciones?: ReactNode;
}) {
  const [vista, setVista] = useState<string>("detalle");
  const columnaActual = tarea ? columnas.find((c) => c.id === tarea.columna) : undefined;

  return (
    <PanelLateral
      abierto={tarea !== null}
      alCerrar={() => {
        setVista("detalle");
        alCerrar();
      }}
      antetitulo={tarea?.clave}
      titulo={tarea?.titulo ?? "Tarea"}
      ancho="xl"
      acciones={acciones}
    >
      {tarea ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-48 flex-1">
              <label htmlFor="panel-tarea-estado" className="text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">
                Estado
              </label>
              <Desplegable
                id="panel-tarea-estado"
                value={tarea.columna}
                disabled={!alSolicitarMovimiento}
                onChange={(e) => {
                  const destino = columnas.find((c) => c.id === e.target.value);
                  // El valor del select vuelve al real: el cambio solo «se
                  // queda» si quien consume lo acepta y actualiza la tarea.
                  if (destino && alSolicitarMovimiento) alSolicitarMovimiento(tarea, destino);
                }}
                className="mt-1"
              >
                {columnas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </Desplegable>
              {columnaActual?.descripcion ? (
                <p className="mt-1 text-xs text-rel-muted">{columnaActual.descripcion}</p>
              ) : null}
            </div>
            {tarea.prioridad ? <IndicadorPrioridad prioridad={tarea.prioridad} conTexto /> : null}
          </div>

          {tarea.bloqueada ? (
            <p role="note" className="rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm">
              <strong className="font-semibold">Bloqueada:</strong> {tarea.bloqueada}
            </p>
          ) : null}

          <Pestanas
            etiqueta="Secciones de la tarea"
            valor={vista}
            alCambiar={setVista}
            pestanas={[
              { id: "detalle", nombre: "Detalle" },
              { id: "actividad", nombre: "Actividad", cuenta: actividad?.length },
            ]}
          >
            {vista === "detalle" ? (
              <div className="space-y-6 pt-5">
                {descripcion ? (
                  <section aria-label="Descripción">
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">Descripción</h3>
                    <div className="mt-2 text-sm leading-relaxed text-rel-dark">{descripcion}</div>
                  </section>
                ) : null}

                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">Responsables</dt>
                    <dd className="mt-1.5 text-sm">
                      {tarea.responsables && tarea.responsables.length > 0 ? (
                        <span className="flex items-center gap-2">
                          <GrupoAvatares personas={tarea.responsables} tamano="md" max={4} />
                          <span>{tarea.responsables.map((p) => p.nombre).join(", ")}</span>
                        </span>
                      ) : (
                        <span className="text-rel-muted">Sin asignar</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">Vence</dt>
                    <dd className="mt-1.5 text-sm">
                      {tarea.vence ? (
                        <span className={estaVencida(tarea.vence) ? "font-semibold text-rel-danger" : undefined}>
                          {formatearVence(tarea.vence)}
                          {estaVencida(tarea.vence) ? " · vencida" : ""}
                        </span>
                      ) : (
                        <span className="text-rel-muted">Sin fecha</span>
                      )}
                    </dd>
                  </div>
                  {(campos ?? []).map((c) => (
                    <div key={c.etiqueta}>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">{c.etiqueta}</dt>
                      <dd className="mt-1.5 text-sm text-rel-dark">{c.valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <div className="pt-5">
                {actividad && actividad.length > 0 ? (
                  <ol className="space-y-4">
                    {actividad.map((e) => (
                      <li key={e.id} className="flex gap-3">
                        <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rel-primary" />
                        <p className="min-w-0 flex-1 text-sm leading-relaxed">
                          <strong className="font-semibold">{e.autor}</strong> {e.texto}
                          <span className="block text-xs text-rel-muted">{e.cuando}</span>
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-rel-muted">Todavía no hay actividad en esta tarea.</p>
                )}
              </div>
            )}
          </Pestanas>
        </div>
      ) : null}
    </PanelLateral>
  );
}
