// src/shared/ui/tablero/ListaTareas.tsx
//
// La misma colección que el tablero, como lista. Es `TablaDatos` con las
// columnas de una tarea ya resueltas: quien consume no define columnas, y la
// lista queda ordenable, paginable y con su versión de tarjetas en móvil, igual
// que cualquier otra tabla del producto.
//
// Lo que NO hace: ordenar por orden de columna del flujo ni agrupar. Ordena por
// clave o por fecha; el orden del flujo es cosa del tablero.

import { CircleSlash } from "lucide-react";

import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import { Pill } from "@/shared/ui/Pill";
import { GrupoAvatares } from "./AvatarPersona";
import { IndicadorPrioridad } from "./IndicadorPrioridad";
import {
  ETIQUETA_PRIORIDAD,
  estaVencida,
  formatearVence,
  type ColumnaTablero,
  type TareaVista,
} from "./modelo";

const ORDEN_PRIORIDAD = { critica: 0, alta: 1, media: 2, baja: 3 } as const;

export function ListaTareas<T>({
  tareas,
  columnas,
  alAbrir,
  etiquetaTabla = "Lista de tareas",
  etiquetaElemento = "tareas",
  cargando = false,
}: {
  tareas: TareaVista<T>[];
  columnas: ColumnaTablero[];
  alAbrir?: (tarea: TareaVista<T>) => void;
  etiquetaTabla?: string;
  etiquetaElemento?: string;
  cargando?: boolean;
}) {
  const columna = (id: string) => columnas.find((c) => c.id === id);

  const definicion: ColumnaTabla<TareaVista<T>>[] = [
    {
      clave: "clave",
      titulo: "Clave",
      ordenable: true,
      celda: (t) => <span className="text-xs font-semibold tabular-nums text-rel-muted">{t.clave ?? "—"}</span>,
      valor: (t) => t.clave,
      movil: "pie",
    },
    {
      clave: "titulo",
      titulo: "Tarea",
      ordenable: true,
      celda: (t) => (
        <div className="min-w-0">
          <CeldaPrincipal
            titulo={t.titulo}
            alAbrir={alAbrir ? () => alAbrir(t) : undefined}
            apoyo={t.bloqueada ? `Bloqueada: ${t.bloqueada}` : undefined}
          />
          {t.etiquetas && t.etiquetas.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {t.etiquetas.map((e) => (
                <Pill key={e.texto} tono={e.tono ?? "neutro"} punto={false}>
                  {e.texto}
                </Pill>
              ))}
            </span>
          ) : null}
        </div>
      ),
      valor: (t) => t.titulo,
      movil: "titular",
    },
    {
      clave: "estado",
      titulo: "Estado",
      ordenable: true,
      celda: (t) => {
        const c = columna(t.columna);
        return <Pill tono={c?.tono ?? "neutro"}>{c?.titulo ?? t.columna}</Pill>;
      },
      valor: (t) => columnas.findIndex((c) => c.id === t.columna),
      movil: "pie",
    },
    {
      clave: "prioridad",
      titulo: "Prioridad",
      ordenable: true,
      celda: (t) => (t.prioridad ? <IndicadorPrioridad prioridad={t.prioridad} conTexto /> : <span className="text-rel-muted">—</span>),
      valor: (t) => (t.prioridad ? ORDEN_PRIORIDAD[t.prioridad] : 99),
      movil: "pie",
    },
    {
      clave: "responsables",
      titulo: "Responsables",
      celda: (t) =>
        t.responsables && t.responsables.length > 0 ? (
          <span className="flex items-center gap-2">
            <GrupoAvatares personas={t.responsables} />
            <span className="sr-only">{t.responsables.map((p) => p.nombre).join(", ")}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-rel-muted">
            <CircleSlash className="h-3.5 w-3.5" aria-hidden="true" />
            Sin asignar
          </span>
        ),
      movil: "oculta",
    },
    {
      clave: "vence",
      titulo: "Vence",
      ordenable: true,
      alineacion: "derecha",
      celda: (t) =>
        t.vence ? (
          <span className={estaVencida(t.vence) ? "whitespace-nowrap font-semibold text-rel-danger" : "whitespace-nowrap"}>
            {formatearVence(t.vence)}
            {estaVencida(t.vence) ? <span className="sr-only"> (vencida)</span> : null}
          </span>
        ) : (
          <span className="text-rel-muted">—</span>
        ),
      valor: (t) => t.vence,
      movil: "pie",
    },
  ];

  return (
    <TablaDatos
      filas={tareas}
      columnas={definicion}
      claveFila={(t) => t.id}
      etiquetaTabla={etiquetaTabla}
      etiquetaElemento={etiquetaElemento}
      ordenInicial={{ clave: "clave" }}
      cargando={cargando}
    />
  );
}

export { ETIQUETA_PRIORIDAD };
