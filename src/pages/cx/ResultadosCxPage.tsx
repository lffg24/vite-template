import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ContactRound, RefreshCw, Users, BarChart3, Info } from "lucide-react";
import { DatePicker } from "@/shared/ui/DatePicker";
import { FiltroChips } from "@/shared/ui/FiltroChips";
import { GraficaBarrasFactores, GraficaComposicionNps, GraficaEvolucionMensual, GraficaHistogramaNps, GraficaPalancasFactores } from "@/shared/ui/GraficasCx";
import { IndicadorKpi } from "@/shared/ui/IndicadorKpi";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel, TablaPanel } from "@/shared/ui/Panel";
import { Pill } from "@/shared/ui/Pill";
import { Desplegable } from "@/shared/ui/Desplegable";
import { EstadoVacio } from "@/shared/ui/EstadoVacio";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import { obtenerResultadosCx } from "@/services/cxResultadosService";
import type { FiltrosResultadoCx, IndicadorCx, ResumenResultadosCx } from "@/types/cxResultados";

const filtrosVacios: FiltrosResultadoCx = { n_minimo: 5 };
function formatear(indicador: IndicadorCx | null) {
  if (!indicador || indicador.valor === null) return "Sin datos";
  const signo = indicador.valor > 0 && indicador.tipo.startsWith("NPS") ? "+" : "";
  return `${signo}${indicador.valor.toFixed(2)}${indicador.tipo === "CSAT" ? "%" : ""}`;
}

function SelectFiltro({ id, etiqueta, valor, opciones, alCambiar }: {
  id: string; etiqueta: string; valor?: string; opciones: [string, string][]; alCambiar: (valor: string) => void;
}) {
  return <label className="block min-w-0 space-y-1 text-xs font-semibold text-rel-muted" htmlFor={id}>{etiqueta}
    <Desplegable id={id} value={valor ?? ""} onChange={(evento) => alCambiar(evento.target.value)}>
      <option value="">Todas</option>{opciones.map(([idOpcion, nombre]) => <option key={idOpcion} value={idOpcion}>{nombre}</option>)}
    </Desplegable>
  </label>;
}

export default function ResultadosCxPage() {
  const [filtros, setFiltros] = useState<FiltrosResultadoCx>(filtrosVacios);
  const [datos, setDatos] = useState<ResumenResultadosCx | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setCargando(true); setError("");
    try { setDatos(await obtenerResultadosCx(filtros, signal)); }
    catch (fallo) { if (!signal?.aborted) setError(fallo instanceof Error ? fallo.message : "No pudimos cargar los resultados CX."); }
    finally { if (!signal?.aborted) setCargando(false); }
  }, [filtros]);

  useEffect(() => { const control = new AbortController(); void cargar(control.signal); return () => control.abort(); }, [cargar]);
  const cambiar = (clave: keyof FiltrosResultadoCx, valor: string) => setFiltros((actual) => ({ ...actual, [clave]: valor || undefined }));
  const principal = datos?.indicadores.find((i) => i.tipo === filtros.tipo_indicador) ?? datos?.indicador_principal ?? null;
  const distribucion = principal?.distribucion ?? {};
  const filasComposicion = ["promotores", "pasivos", "detractores"].map((nombre) => ({ id: nombre, nombre, respuestas: distribucion[nombre] ?? 0 }));
  const columnasComposicion: ColumnaTabla<(typeof filasComposicion)[number]>[] = [
    { clave: "nombre", titulo: "Grupo", celda: (f) => f.nombre, valor: (f) => f.nombre },
    { clave: "respuestas", titulo: "Respuestas", celda: (f) => f.respuestas, alineacion: "derecha", valor: (f) => f.respuestas },
  ];
  const filasHistograma = Array.from({ length: 11 }, (_, indice) => ({ puntuacion: indice, respuestas: principal?.histograma?.[String(indice)] ?? 0 }));
  const columnasHistograma: ColumnaTabla<(typeof filasHistograma)[number]>[] = [
    { clave: "puntuacion", titulo: "Puntuación", celda: (f) => f.puntuacion, valor: (f) => f.puntuacion },
    { clave: "respuestas", titulo: "Respuestas", celda: (f) => f.respuestas, alineacion: "derecha", valor: (f) => f.respuestas },
  ];
  const filasMensuales = (datos?.mensual ?? []).map((m) => ({ mes: m.mes, valor: m.indicador.valor, n: m.indicador.n }));
  const columnasMensuales: ColumnaTabla<(typeof filasMensuales)[number]>[] = [
    { clave: "mes", titulo: "Mes", celda: (f) => f.mes, valor: (f) => f.mes },
    { clave: "valor", titulo: "Valor", celda: (f) => f.valor === null ? "Sin datos" : f.valor.toFixed(2), alineacion: "derecha", valor: (f) => f.valor },
    { clave: "n", titulo: "Muestra", celda: (f) => f.n, alineacion: "derecha", valor: (f) => f.n },
  ];
  const columnasFactores = useMemo<ColumnaTabla<{ id: string; nombre: string; media: number | null; n: number }>[]>(() => [
    { clave: "nombre", titulo: "Factor", celda: (f) => f.nombre, valor: (f) => f.nombre },
    { clave: "media", titulo: "Media · 1–5", celda: (f) => f.media ?? "Sin datos", alineacion: "derecha", valor: (f) => f.media },
    { clave: "n", titulo: "Muestra", celda: (f) => f.n, alineacion: "derecha", valor: (f) => f.n },
  ], []);
  const columnasPalancas: ColumnaTabla<NonNullable<ResumenResultadosCx>["palancas"][number]>[] = [
    { clave: "nombre", titulo: "Factor", celda: (f) => f.nombre, valor: (f) => f.nombre },
    { clave: "promotores", titulo: "Promotores", celda: (f) => `${f.promotores.media ?? "Sin datos"} · n=${f.promotores.n}`, valor: (f) => f.promotores.media },
    { clave: "detractores", titulo: "Detractores", celda: (f) => `${f.detractores.media ?? "Sin datos"} · n=${f.detractores.n}`, valor: (f) => f.detractores.media },
    { clave: "brecha", titulo: "Brecha", celda: (f) => f.brecha === null ? "Sin datos" : f.brecha.toFixed(2), alineacion: "derecha", valor: (f) => f.brecha },
  ];
  const columnasDimensiones: ColumnaTabla<ResumenResultadosCx["desglose"]["sede"][number]>[] = [
    { clave: "nombre", titulo: "Dimensión", celda: (f) => f.nombre, valor: (f) => f.nombre },
    { clave: "indicador", titulo: "Indicador", celda: (f) => formatear(f.indicador), valor: (f) => f.indicador?.valor },
    { clave: "n", titulo: "Muestra", celda: (f) => f.n_envios, alineacion: "derecha", valor: (f) => f.n_envios },
  ];
  const columnasTrazas: ColumnaTabla<ResumenResultadosCx["trazas"][number]>[] = [
    { clave: "campana", titulo: "Campaña", celda: (f) => f.campana, valor: (f) => f.campana },
    { clave: "estado", titulo: "Estado", celda: (f) => <Pill tono={f.estado === "ACTIVA" ? "exito" : "neutro"}>{f.estado}</Pill>, valor: (f) => f.estado },
    { clave: "encuesta", titulo: "Encuesta · versión", celda: (f) => `${f.encuesta} · v${f.version}`, valor: (f) => f.encuesta },
    { clave: "n", titulo: "Respuestas", celda: (f) => f.n, alineacion: "derecha", valor: (f) => f.n },
    { clave: "contactos", titulo: "Contactos", celda: (f) => f.contactos, alineacion: "derecha", valor: (f) => f.contactos },
    { clave: "periodo", titulo: "Primera · última", celda: (f) => `${new Date(f.primera_fecha).toLocaleDateString("es-CO")} · ${new Date(f.ultima_fecha).toLocaleDateString("es-CO")}` },
  ];

  return <div className="mx-auto grid w-full max-w-[1440px] min-w-0 grid-cols-1 gap-5">
    <PageHeader antetitulo="Experiencia del cliente" titulo="Resultados CX" icono={BarChart3} descripcion="Indicadores agregados calculados desde las respuestas recibidas." />
    <Panel titulo="Filtros del análisis" className="min-w-0">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectFiltro id="f-encuesta" etiqueta="Encuesta" valor={filtros.encuesta_id} opciones={datos?.opciones.encuesta ?? []} alCambiar={(v) => cambiar("encuesta_id", v)} />
        <SelectFiltro id="f-sede" etiqueta="Sede" valor={filtros.sede_id} opciones={datos?.opciones.sede ?? []} alCambiar={(v) => cambiar("sede_id", v)} />
        <SelectFiltro id="f-servicio" etiqueta="Servicio" valor={filtros.servicio_id} opciones={datos?.opciones.servicio ?? []} alCambiar={(v) => cambiar("servicio_id", v)} />
        <SelectFiltro id="f-punto" etiqueta="Punto" valor={filtros.punto_id} opciones={datos?.opciones.punto ?? []} alCambiar={(v) => cambiar("punto_id", v)} />
        <SelectFiltro id="f-campana" etiqueta="Campaña" valor={filtros.campana_id} opciones={datos?.opciones.campana ?? []} alCambiar={(v) => cambiar("campana_id", v)} />
        <DatePicker label="Desde" value={filtros.desde} onChange={(v) => cambiar("desde", v)} />
        <DatePicker label="Hasta" value={filtros.hasta} onChange={(v) => cambiar("hasta", v)} />
        <label htmlFor="f-n" className="space-y-1 text-xs font-semibold text-rel-muted">Muestra mínima
          <Input id="f-n" type="number" min={1} max={1000} value={filtros.n_minimo ?? 5} onChange={(e) => setFiltros((a) => ({ ...a, n_minimo: Math.min(1000, Math.max(1, Number(e.target.value) || 1)) }))} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <FiltroChips etiqueta="Indicador principal" valor={filtros.tipo_indicador ?? "TODOS"} alCambiar={(tipo) => setFiltros((f) => ({ ...f, tipo_indicador: tipo === "TODOS" ? undefined : tipo }))} opciones={[
          { valor: "TODOS", etiqueta: "Todos" }, { valor: "NPS_RELACIONAL", etiqueta: "NPS relacional" }, { valor: "NPS_EXPERIENCIA", etiqueta: "NPS experiencia" }, { valor: "CSAT", etiqueta: "CSAT" }, { valor: "CES", etiqueta: "CES" },
        ]} />
        <Button type="button" variant="relGhost" onClick={() => setFiltros(filtrosVacios)}><RefreshCw aria-hidden="true" className="h-4 w-4" />Quitar filtros</Button>
      </div>
    </Panel>
    {error ? <div role="alert" className="rounded-rel-card border border-rel-danger/30 bg-rel-danger/5 p-4 text-rel-dark"><p className="font-semibold">{error.includes("permiso") || error.includes("contratado") || error.includes("habilitada") ? "Sin permiso para ver resultados" : "No se pudieron cargar los resultados"}</p><p className="mt-1 text-sm">{error}</p><Button type="button" variant="relOutline" className="mt-3" onClick={() => void cargar()}>Reintentar</Button></div> : null}
    {cargando && !datos ? <Panel><p role="status" className="animate-pulse text-sm text-rel-muted">Cargando resultados CX…</p></Panel> : null}
    {!cargando && !error && datos && datos.total_envios === 0 ? <EstadoVacio escena="ninguna" titulo="Aún no hay respuestas" descripcion="Prueba con otro periodo o revisa las campañas que capturan información." /> : null}
    {datos && !error ? <>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <IndicadorKpi etiqueta={principal?.tipo.replaceAll("_", " ") ?? "Indicador principal"} valor={formatear(principal)} contexto={`n=${principal?.n ?? 0} · mínimo ${datos.n_minimo}`} icono={Activity} />
        <IndicadorKpi etiqueta="Respuestas" valor={datos.total_envios} contexto={`${datos.periodo.desde ?? "Sin fecha"} a ${datos.periodo.hasta ?? "Sin fecha"}`} icono={Users} tono="info" />
        <IndicadorKpi etiqueta="Promotores" valor={principal?.n ? `${((principal.distribucion.promotores ?? 0) / principal.n * 100).toFixed(2)}%` : "Sin datos"} contexto="Proporción de respuestas NPS" tono="exito" />
        <IndicadorKpi etiqueta="Detractores" valor={principal?.n ? `${((principal.distribucion.detractores ?? 0) / principal.n * 100).toFixed(2)}%` : "Sin datos"} contexto="Proporción de respuestas NPS" tono="peligro" />
        <IndicadorKpi etiqueta="Media de factores" valor={datos.factores.some((f) => f.media !== null) ? (datos.factores.reduce((s, f) => s + (f.media ?? 0), 0) / datos.factores.filter((f) => f.media !== null).length).toFixed(2) : "Sin datos"} contexto="Escala de 1 a 5" icono={BarChart3} />
        <IndicadorKpi etiqueta="Contactos" valor={datos.contactos} contexto="Solo se cuenta la existencia del dato" icono={ContactRound} tono="neutro" />
      </div>
      <Panel titulo="Composición de respuestas">
        {principal?.histograma ? <><GraficaComposicionNps distribucion={principal.distribucion} /><TablaDatos filas={filasComposicion} columnas={columnasComposicion} claveFila={(f) => f.id} etiquetaTabla="Composición NPS" /></> : <p className="text-sm text-rel-muted">Este indicador no usa grupos NPS.</p>}
      </Panel>
      {principal?.histograma ? <Panel titulo="Distribución NPS · 0 a 10"><GraficaHistogramaNps valores={principal.histograma} /><TablaDatos filas={filasHistograma} columnas={columnasHistograma} claveFila={(f) => String(f.puntuacion)} etiquetaTabla="Respuestas por puntuación NPS" /></Panel> : null}
      <Panel titulo="Evolución mensual"><GraficaEvolucionMensual minimo={principal?.tipo.startsWith("NPS") ? -100 : principal?.tipo === "CES" ? 1 : 0} maximo={principal?.tipo.startsWith("NPS") ? 100 : principal?.tipo === "CES" ? 7 : 100} puntos={filasMensuales.map((f) => ({ mes: f.mes, valor: f.valor }))} /><TablaDatos filas={filasMensuales} columnas={columnasMensuales} claveFila={(f) => f.mes} etiquetaTabla="Indicador mensual recalculado" /></Panel>
      <Panel titulo="Factores · escala de 1 a 5"><GraficaBarrasFactores filas={datos.factores} /><TablaDatos filas={datos.factores} columnas={columnasFactores} claveFila={(f) => f.id} etiquetaTabla="Medias por factor" /></Panel>
      <Panel titulo="Palancas · promotores y detractores"><GraficaPalancasFactores filas={datos.palancas} /><TablaDatos filas={datos.palancas} columnas={columnasPalancas} claveFila={(f) => f.id} etiquetaTabla="Comparación de factores por grupo NPS" /></Panel>
      <Panel titulo="Desglose por dimensión"><p className="mb-4 text-sm text-rel-muted">La sede, el servicio y el punto los fija la campaña dueña del QR, no quien responde. Con tres campañas hay como máximo tres celdas por dimensión; para comparar dos puntos se necesita una campaña por punto. Que los cortes devuelvan las mismas filas es esperado.</p><div className="grid min-w-0 gap-4 xl:grid-cols-2">{(["sede", "servicio", "punto", "campana", "encuesta"] as const).map((dimension) => <section key={dimension} className="min-w-0"><h3 className="mb-2 font-semibold capitalize">{dimension}</h3><TablaDatos filas={datos.desglose[dimension]} columnas={columnasDimensiones} claveFila={(f) => f.id} etiquetaTabla={`Resultados por ${dimension}`} /></section>)}</div></Panel>
      <Panel titulo="Trazabilidad de campañas"><TablaDatos filas={datos.trazas} columnas={columnasTrazas} claveFila={(f) => f.campana_id} etiquetaTabla="Trazabilidad por campaña" /></Panel>
      <Panel titulo="Método y límites"><ul className="list-disc space-y-2 pl-5 text-sm text-rel-muted"><li>NPS: porcentaje de promotores (9–10) menos detractores (0–6); convención de mercado, no norma ISO.</li><li>CSAT: porcentaje de respuestas 4 y 5 en escala 1–5. CES: media en escala 1–7. FACTOR: media en escala 1–5.</li><li>Cada corte y cada mes se recalcula desde calificaciones crudas; no se promedian indicadores de grupos.</li><li>Con menos de n={datos.n_minimo}, se muestra la muestra y el indicador aparece como «Sin datos».</li><li>Marco de medición: ISO 10004. Los contactos se cuentan; nombre, correo y teléfono no se consultan aquí.</li></ul><p className="mt-4 flex items-start gap-2 rounded-rel-control bg-rel-info/5 p-3 text-sm text-rel-dark"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rel-info" />Los resultados se calculan al consultar y pueden tardar más en periodos con muchas respuestas.</p></Panel>
    </> : null}
  </div>;
}
