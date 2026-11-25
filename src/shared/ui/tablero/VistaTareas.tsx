// src/shared/ui/tablero/VistaTareas.tsx
//
// La pieza que se enchufa: barra de herramientas + lista o tablero + detalle.
// Quien consume (Licitaciones hoy, el gestor de tareas mañana) escribe:
//
//   <VistaTareas
//     columnas={...}  tareas={oportunidades.map(aTarea)}
//     alSolicitarMovimiento={...}  detalle={(t) => ({ campos, descripcion })}
//   />
//
// y recibe buscador, filtro por prioridad, conmutador Lista/Tablero (que
// recuerda la elección), tablero con arrastre, lista ordenable y el panel de
// detalle. Todo lo demás —permisos, qué exige cada movimiento, de dónde salen
// los datos— sigue siendo del consumidor.
//
// ## Lista y tablero son la MISMA colección
//
// El filtro y la búsqueda se aplican antes de repartir, así que cambiar de vista
// no cambia lo que se ve, solo cómo se ve. Una vista que «pierde» filas al
// cambiar es de las cosas que más desconfianza generan.

import { LayoutList, Columns3, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Desplegable } from "@/shared/ui/Desplegable";
import { EstadoVacio } from "@/shared/ui/EstadoVacio";
import { FiltroChips } from "@/shared/ui/FiltroChips";
import { ListaTareas } from "./ListaTareas";
import { PanelTarea, type CampoDetalle, type EventoActividad } from "./PanelTarea";
import { Tablero } from "./Tablero";
import {
  ETIQUETA_PRIORIDAD,
  type ColumnaTablero,
  type PrioridadTarea,
  type SolicitudMovimiento,
  type TareaVista,
} from "./modelo";

type Vista = "tablero" | "lista";

export interface DetalleDeTarea {
  descripcion?: ReactNode;
  campos?: CampoDetalle[];
  actividad?: EventoActividad[];
  acciones?: ReactNode;
}

function leerVista(clave: string | undefined, porDefecto: Vista): Vista {
  if (!clave) return porDefecto;
  try {
    const v = window.localStorage.getItem(clave);
    return v === "lista" || v === "tablero" ? v : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function VistaTareas<T>({
  columnas,
  tareas,
  alSolicitarMovimiento,
  detalle,
  alAbrirTarea,
  acciones,
  enVuelo,
  cargando = false,
  vistaInicial = "tablero",
  claveMemoria,
  nombreElemento = "tareas",
}: {
  columnas: ColumnaTablero[];
  tareas: TareaVista<T>[];
  alSolicitarMovimiento?: SolicitudMovimiento<T>;
  /** Lo que el panel muestra de cada tarea. Sin esto ni `alAbrirTarea`, las tarjetas no abren. */
  detalle?: (tarea: TareaVista<T>) => DetalleDeTarea;
  /**
   * Para quien ya tiene SU propio detalle (carga asíncrona, formularios): se
   * llama al abrir una tarea y el panel genérico no se dibuja.
   */
  alAbrirTarea?: (tarea: TareaVista<T>) => void;
  /** Botones a la derecha de la barra (Nueva tarea, Exportar…). */
  acciones?: ReactNode;
  enVuelo?: ReadonlySet<string>;
  cargando?: boolean;
  vistaInicial?: Vista;
  /** Si se da, recuerda Lista/Tablero entre visitas (localStorage). */
  claveMemoria?: string;
  nombreElemento?: string;
}) {
  const [vista, setVista] = useState<Vista>(() => leerVista(claveMemoria, vistaInicial));
  const [busqueda, setBusqueda] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadTarea | "todas">("todas");
  const [abiertaId, setAbiertaId] = useState<string | null>(null);

  useEffect(() => {
    if (!claveMemoria) return;
    try {
      window.localStorage.setItem(claveMemoria, vista);
    } catch {
      /* sin almacenamiento: la vista simplemente no se recuerda */
    }
  }, [claveMemoria, vista]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tareas.filter((t) => {
      if (prioridad !== "todas" && t.prioridad !== prioridad) return false;
      if (!q) return true;
      return (
        t.titulo.toLowerCase().includes(q) ||
        (t.clave ?? "").toLowerCase().includes(q) ||
        (t.etiquetas ?? []).some((e) => e.texto.toLowerCase().includes(q)) ||
        (t.responsables ?? []).some((p) => p.nombre.toLowerCase().includes(q))
      );
    });
  }, [tareas, busqueda, prioridad]);

  // Se busca la tarea abierta en la lista VIVA, no se guarda una copia: si el
  // consumidor la mueve, el panel muestra el estado nuevo sin pedirlo.
  const abierta = abiertaId ? (tareas.find((t) => t.id === abiertaId) ?? null) : null;
  const abrir = alAbrirTarea ?? (detalle ? (t: TareaVista<T>) => setAbiertaId(t.id) : undefined);
  const extra = abierta && detalle ? detalle(abierta) : undefined;
  const hayFiltro = busqueda.trim() !== "" || prioridad !== "todas";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rel-muted" aria-hidden="true" />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar ${nombreElemento}`}
            aria-label={`Buscar ${nombreElemento}`}
            className="pl-9"
          />
        </div>
        {/* El filtro solo aparece si alguna tarea trae prioridad: Licitaciones no la tiene. */}
        {tareas.some((t) => t.prioridad) ? (
        <Desplegable
          aria-label="Filtrar por prioridad"
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value as PrioridadTarea | "todas")}
          className="w-44"
        >
          <option value="todas">Toda prioridad</option>
          {(Object.keys(ETIQUETA_PRIORIDAD) as PrioridadTarea[]).map((p) => (
            <option key={p} value={p}>
              {ETIQUETA_PRIORIDAD[p]}
            </option>
          ))}
        </Desplegable>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <FiltroChips<Vista>
            etiqueta="Forma de ver"
            valor={vista}
            alCambiar={setVista}
            opciones={[
              { valor: "tablero", etiqueta: "Tablero" },
              { valor: "lista", etiqueta: "Lista" },
            ]}
          />
          {acciones}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-rel-muted" aria-live="polite">
        {vista === "tablero" ? (
          <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {visibles.length} de {tareas.length} {nombreElemento}
        {hayFiltro ? " con el filtro" : ""}
      </p>

      {!cargando && visibles.length === 0 ? (
        <EstadoVacio
          titulo={hayFiltro ? "Nada coincide con tu búsqueda" : `Aún no hay ${nombreElemento}`}
          descripcion={hayFiltro ? "Quita el filtro o prueba con otra palabra." : undefined}
          escena="buscar"
        />
      ) : vista === "tablero" ? (
        <Tablero
          columnas={columnas}
          tareas={visibles}
          alSolicitarMovimiento={alSolicitarMovimiento ?? (() => {})}
          alAbrir={abrir}
          enVuelo={enVuelo}
          cargando={cargando}
        />
      ) : (
        <ListaTareas tareas={visibles} columnas={columnas} alAbrir={abrir} cargando={cargando} etiquetaElemento={nombreElemento} />
      )}

      {detalle && !alAbrirTarea ? (
        <PanelTarea
          tarea={abierta}
          columnas={columnas}
          alCerrar={() => setAbiertaId(null)}
          alSolicitarMovimiento={alSolicitarMovimiento}
          descripcion={extra?.descripcion}
          campos={extra?.campos}
          actividad={extra?.actividad}
          acciones={extra?.acciones}
        />
      ) : null}
    </div>
  );
}
