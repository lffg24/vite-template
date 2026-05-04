import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  LineChart,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Table2,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AbrilLoading } from "@/components/common/AbrilLoading";
import {
  listarAplicacionesPsicoDashboard,
  obtenerDashboardPsicoAplicacion,
  obtenerDetalleDimensionPsicoAplicacion,
} from "@/services/reportesPsicoDashboardService";
import type {
  DimensionDetalleResponse,
  DimensionPsico,
  DistribucionTotal,
  DominioPsico,
  PsicoAplicacionItem,
  PsicoDashboardResponse,
  ParticipantePsico,
  SegmentacionItem,
  SocioDistribucionItem,
  TotalPsico,
} from "@/types/psicoDashboard";

const NIVEL_COLORS: Record<string, string> = {
  MUY_BAJO: "#22c55e",
  SIN_RIESGO: "#22c55e",
  BAJO: "#84cc16",
  MEDIO: "#eab308",
  ALTO: "#f97316",
  MUY_ALTO: "#ef4444",
  SIN_NIVEL: "#94a3b8",
};

const TABS = [
  { key: "resumen", label: "Resumen ejecutivo", icon: LayoutDashboard },
  { key: "calidad", label: "Calidad de datos", icon: ShieldCheck },
  { key: "dominios", label: "Dominios y dimensiones", icon: BarChart3 },
  { key: "segmentacion", label: "Segmentación", icon: Users },
  { key: "sociodemografico", label: "Sociodemográfico", icon: Users },
  { key: "participantes", label: "Participantes", icon: Table2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function fmtPct(value?: number) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function fmtNum(value?: number) {
  return Number(value ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

function shortText(value?: string | null, max = 34) {
  const text = String(value ?? "—").trim() || "—";
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1)).trim()}…` : text;
}

function nivelLabel(nivel?: string | null) {
  const map: Record<string, string> = {
    MUY_BAJO: "Muy bajo",
    SIN_RIESGO: "Sin riesgo",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    MUY_ALTO: "Muy alto",
    SIN_NIVEL: "Sin nivel",
  };
  return map[String(nivel || "SIN_NIVEL")] ?? String(nivel || "Sin nivel");
}

function riesgoLabel(value?: number) {
  const v = Number(value ?? 0);
  if (v >= 35) return "Crítico";
  if (v >= 15) return "Prioritario";
  if (v > 0) return "Vigilancia";
  return "Controlado";
}

function riesgoTone(pct?: number) {
  const v = Number(pct ?? 0);
  if (v >= 35) return "text-red-600 bg-red-50 border-red-100";
  if (v >= 15) return "text-orange-600 bg-orange-50 border-orange-100";
  if (v > 0) return "text-amber-600 bg-amber-50 border-amber-100";
  return "text-emerald-700 bg-emerald-50 border-emerald-100";
}

function estadoBadge(estado?: string) {
  const ok = estado === "OK" || estado?.toLowerCase?.() === "calculada";
  return (
    <Badge className={cn("rounded-full border px-3 py-1", ok ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100")}>
      {estado ?? "Sin estado"}
    </Badge>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, tone = "violet", compact = false, valueTitle }: any) {
  const tones: Record<string, string> = {
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    red: "bg-red-50 text-red-700 border-red-100",
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <Card className={cn("h-full overflow-hidden border-slate-200 bg-white/90 shadow-sm", compact ? "min-h-[112px]" : "min-h-[124px]")}> 
      <CardContent className={cn("h-full", compact ? "p-4" : "p-5")}>
        <div className="flex h-full min-w-0 items-start gap-3">
          <div className={cn("shrink-0 rounded-2xl border", compact ? "p-2.5" : "p-3", tones[tone])}>
            <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500" title={title}>{title}</div>
            <div
              className={cn(
                "mt-1 font-bold leading-[1.12] tracking-tight text-slate-950 [overflow-wrap:anywhere]",
                compact ? "line-clamp-2 text-[clamp(1.15rem,1.25vw,1.55rem)]" : "line-clamp-2 text-[clamp(1.25rem,1.45vw,1.75rem)]"
              )}
              title={valueTitle ?? (typeof value === "string" ? value : undefined)}
            >
              {value}
            </div>
            {subtitle && <div className="mt-2 line-clamp-2 text-xs leading-snug text-slate-500" title={subtitle}>{subtitle}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text = "Sin datos disponibles." }) {
  return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">{text}</div>;
}

function DistributionBars({ data }: { data: DistribucionTotal[] }) {
  const rows = data.flatMap((d) =>
    d.niveles.map((n) => ({
      instrumento: d.instrument_label,
      total: d.total_label,
      name: `${d.instrument_label}`,
      nivel: n.label,
      nivelRaw: n.nivel,
      cantidad: n.cantidad,
      porcentaje: n.porcentaje,
    }))
  );

  const instruments = Array.from(new Set(rows.map((r) => r.name)));
  const chartData = instruments.map((inst) => {
    const item: Record<string, any> = { instrumento: inst };
    rows.filter((r) => r.name === inst).forEach((r) => {
      item[r.nivel] = r.porcentaje;
      item[`${r.nivel}_cantidad`] = r.cantidad;
      item[`${r.nivel}_raw`] = r.nivelRaw;
    });
    return item;
  });
  const labels = Array.from(new Set(rows.map((r) => r.nivel)));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 70, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="instrumento" width={150} />
        <Tooltip formatter={(value: any, name: any) => [`${Number(value).toFixed(1)}%`, name]} />
        <Legend />
        {labels.map((label) => {
          const anyRow = rows.find((r) => r.nivel === label);
          return <Bar key={label} dataKey={label} stackId="a" fill={NIVEL_COLORS[String(anyRow?.nivelRaw)] ?? "#64748b"} radius={[4, 4, 4, 4]} />;
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutGlobal({ data }: { data: DistribucionTotal[] }) {
  const merged = new Map<string, { nivel: string; label: string; cantidad: number }>();
  data.forEach((d) =>
    d.niveles.forEach((n) => {
      const key = String(n.nivel);
      const prev = merged.get(key) ?? { nivel: key, label: n.label, cantidad: 0 };
      prev.cantidad += n.cantidad;
      merged.set(key, prev);
    })
  );
  const chartData = Array.from(merged.values()).filter((x) => x.cantidad > 0);
  const total = chartData.reduce((acc, it) => acc + it.cantidad, 0);
  return (
    <div className="relative h-[270px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="cantidad" nameKey="label" innerRadius={72} outerRadius={112} paddingAngle={3}>
            {chartData.map((entry) => <Cell key={entry.nivel} fill={NIVEL_COLORS[entry.nivel] ?? "#64748b"} />)}
          </Pie>
          <Tooltip formatter={(value: any, name: any) => [`${value} registros`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-950">{total}</div>
          <div className="text-xs text-slate-500">scores total</div>
        </div>
      </div>
    </div>
  );
}


type InstrumentRiskBucket = { nivel: string; label: string; cantidad: number; porcentaje: number };
type InstrumentRiskSummary = { key?: string; label: string; grupo?: string; total: number; promedio_transformado?: number; pct_alto_muy_alto?: number; niveles: InstrumentRiskBucket[] };

function normalizeInstrumentSummaries(data: any): InstrumentRiskSummary[] {
  const explicit = Array.isArray(data?.graficas_resumen?.items) ? data.graficas_resumen.items : [];
  if (explicit.length) return explicit.map((x: any) => ({
    key: x.key ?? x.label,
    label: x.label ?? x.instrument_label ?? "Instrumento",
    grupo: x.grupo,
    total: Number(x.total ?? 0),
    promedio_transformado: Number(x.promedio_transformado ?? 0),
    pct_alto_muy_alto: Number(x.pct_alto_muy_alto ?? 0),
    niveles: Array.isArray(x.niveles) ? x.niveles : [],
  }));
  const fallback = Array.isArray(data?.distribucion_totales) ? data.distribucion_totales : [];
  return fallback.map((x: any) => ({
    key: `${x.evaluacion_id}-${x.total_code}`,
    label: x.instrument_label ?? x.total_label ?? "Instrumento",
    grupo: x.total_label,
    total: Number(x.total ?? 0),
    promedio_transformado: undefined,
    pct_alto_muy_alto: Number((x.niveles ?? []).filter((n: any) => ["ALTO", "MUY_ALTO"].includes(String(n.nivel))).reduce((acc: number, n: any) => acc + Number(n.porcentaje ?? 0), 0)),
    niveles: Array.isArray(x.niveles) ? x.niveles : [],
  }));
}

function InstrumentMiniDistribution({ item }: { item: InstrumentRiskSummary }) {
  const niveles = [...(item.niveles ?? [])].sort((a, b) => {
    const ao = NIVEL_ORDER_FRONT.indexOf(String(a.nivel));
    const bo = NIVEL_ORDER_FRONT.indexOf(String(b.nivel));
    return (ao === -1 ? 999 : ao) - (bo === -1 ? 999 : bo);
  });
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-bold text-slate-950" title={item.label}>{item.label}</div>
          <div className="mt-1 text-xs text-slate-500">{item.grupo || "Distribución por nivel"} · N {Number(item.total ?? 0).toLocaleString("es-CO")}</div>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2 py-1 text-xs font-semibold", riesgoTone(item.pct_alto_muy_alto))}>{fmtPct(item.pct_alto_muy_alto)}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {niveles.filter((n) => Number(n.porcentaje ?? 0) > 0).map((n) => (
          <div key={String(n.nivel)} title={`${n.label}: ${fmtPct(n.porcentaje)}`} style={{ width: `${Number(n.porcentaje ?? 0)}%`, backgroundColor: NIVEL_COLORS[String(n.nivel)] ?? "#94a3b8" }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        {niveles.filter((n) => Number(n.cantidad ?? 0) > 0).slice(0, 4).map((n) => (
          <div key={String(n.nivel)} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2 py-1.5">
            <span className="truncate">{n.label}</span>
            <b>{Number(n.cantidad ?? 0).toLocaleString("es-CO")}</b>
          </div>
        ))}
      </div>
      {typeof item.promedio_transformado === "number" && item.promedio_transformado > 0 && (
        <div className="text-xs text-slate-500">Puntaje promedio: <b className="text-slate-800">{fmtNum(item.promedio_transformado)}</b></div>
      )}
    </div>
  );
}

const NIVEL_ORDER_FRONT = ["MUY_BAJO", "SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO", "SIN_NIVEL"];

function InstrumentOverviewSection({ data }: { data: any }) {
  const items = normalizeInstrumentSummaries(data);
  if (!items.length) return <EmptyState text="No hay distribución por evaluación disponible. Recalcula la aplicación o verifica scores totales." />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <InstrumentMiniDistribution key={String(item.key ?? item.label)} item={item} />)}
      </div>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vista comparativa por evaluación</CardTitle>
          <CardDescription>Resumen visual por Intralaboral A/B, Extralaboral y Estrés. Cuando el backend entrega segmentación por forma, se separa A/B y global.</CardDescription>
        </CardHeader>
        <CardContent>
          <DistributionBars data={items.map((it: any, idx: number) => ({
            evaluacion_id: idx,
            instrument_code: it.key,
            instrument_label: it.label,
            total_code: it.grupo ?? it.label,
            total_label: it.grupo ?? it.label,
            total: it.total,
            niveles: it.niveles,
          })) as any} />
        </CardContent>
      </Card>
    </div>
  );
}

function RankingList({ items }: { items: DimensionPsico[] }) {
  if (!items.length) return <EmptyState />;
  const max = Math.max(...items.map((i) => i.pct_alto_muy_alto), 1);
  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((item) => (
        <div key={`${item.evaluacion_id}-${item.dimension_code}`} className="space-y-1.5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="line-clamp-2 min-w-0 font-medium leading-snug text-slate-700" title={item.dimension_label}>{item.dimension_label}</div>
            <div className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", riesgoTone(item.pct_alto_muy_alto))}>{fmtPct(item.pct_alto_muy_alto)}</div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" style={{ width: `${Math.max(4, (item.pct_alto_muy_alto / max) * 100)}%` }} />
          </div>
          <div className="text-xs text-slate-500">{item.instrument_label} · promedio {fmtNum(item.promedio_transformado)}</div>
        </div>
      ))}
    </div>
  );
}

function DominioCards({ dominios, onOpen }: { dominios: DominioPsico[]; onOpen?: (dom: DominioPsico) => void }) {
  if (!dominios.length) return <EmptyState />;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {dominios.slice(0, 8).map((dom) => (
        <button key={`${dom.evaluacion_id}-${dom.dominio_code}`} type="button" onClick={() => onOpen?.(dom)} className="w-full rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40 focus:outline-none focus:ring-2 focus:ring-violet-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900" title={dom.dominio_label}>{dom.dominio_label}</div>
              <div className="mt-1 text-xs text-slate-500">{dom.instrument_label}</div>
            </div>
            <Badge className={cn("rounded-full border", riesgoTone(dom.pct_alto_muy_alto))}>{fmtPct(dom.pct_alto_muy_alto)}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Promedio</div>
              <div className="text-xl font-bold text-slate-950">{fmtNum(dom.promedio_transformado)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Alto/Muy alto</div>
              <div className="text-xl font-bold text-slate-950">{dom.alto_muy_alto}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function TotalesTable({ items }: { items: TotalPsico[] }) {
  if (!items.length) return <EmptyState />;
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Instrumento</th>
            <th className="px-4 py-3 text-right">N</th>
            <th className="px-4 py-3 text-right">Promedio</th>
            <th className="px-4 py-3 text-right">Mín.</th>
            <th className="px-4 py-3 text-right">Máx.</th>
            <th className="px-4 py-3 text-right">% Alto/Muy alto</th>
            <th className="px-4 py-3 text-right">Calidad</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((it) => (
            <tr key={`${it.evaluacion_id}-${it.total_code}`}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{it.instrument_label}</div>
                <div className="text-xs text-slate-500">{it.total_label}</div>
              </td>
              <td className="px-4 py-3 text-right">{it.n}</td>
              <td className="px-4 py-3 text-right font-semibold">{fmtNum(it.promedio_transformado)}</td>
              <td className="px-4 py-3 text-right">{fmtNum(it.min_transformado)}</td>
              <td className="px-4 py-3 text-right">{fmtNum(it.max_transformado)}</td>
              <td className="px-4 py-3 text-right"><span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", riesgoTone(it.pct_alto_muy_alto))}>{fmtPct(it.pct_alto_muy_alto)}</span></td>
              <td className="px-4 py-3 text-right">{it.sin_nivel + it.sin_transformado + it.fuera_rango_0_100 === 0 ? <span className="text-emerald-700">OK</span> : <span className="text-red-600">Revisar</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


type NormativaRow = Record<string, any>;
type NormativaTable = Record<string, any>;

function normCell(row: NormativaRow, key: string) {
  return Number(row?.[key] ?? 0).toLocaleString("es-CO");
}

function NormativeRiskTable({ table, compact = false }: { table: NormativaTable; compact?: boolean }) {
  const columnas = Array.isArray(table?.columnas) ? table.columnas : [
    { key: "sin_riesgo", label: "Sin riesgo" },
    { key: "riesgo_bajo", label: "Riesgo bajo" },
    { key: "riesgo_medio", label: "Riesgo medio" },
    { key: "riesgo_alto", label: "Riesgo alto" },
    { key: "riesgo_muy_alto", label: "Riesgo muy alto" },
  ];
  const filas = Array.isArray(table?.filas) ? table.filas : [];
  if (!filas.length) return <EmptyState text="Sin tabla normativa disponible para este bloque." />;
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="border-b bg-slate-50 px-4 py-3">
        <div className="text-sm font-bold text-slate-900">{table?.dominio_label ?? table?.instrument_label ?? "Tabla normativa"}</div>
        <div className="text-xs text-slate-500">{table?.instrument_label ?? "Instrumento"} · Puntaje transformado y distribución por nivel de riesgo</div>
      </div>
      <div className="overflow-x-auto">
        <table className={cn("w-full text-sm", compact ? "min-w-[860px]" : "min-w-[1120px]")}> 
          <thead className="bg-white text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{table?.tipo_tabla === "INTRALABORAL" ? "Dominio / dimensión" : "Dimensión / total"}</th>
              <th className="px-4 py-3 text-right">Puntaje (T)</th>
              {columnas.map((c: any) => <th key={c.key} className="px-4 py-3 text-right">{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filas.map((row: NormativaRow, idx: number) => {
              const isTotal = row.tipo === "DOMINIO_TOTAL" || row.tipo === "TOTAL";
              return (
                <tr key={String(row.codigo ?? idx)} className={cn("hover:bg-slate-50/70", isTotal && "bg-violet-50/50 font-semibold")}> 
                  <td className="px-4 py-3">
                    <div className="break-words font-medium text-slate-900">{row.nombre ?? row.codigo ?? "Sin nombre"}</div>
                    {isTotal && <div className="mt-1 text-[11px] uppercase tracking-wide text-violet-600">Resultado consolidado</div>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtNum(row.puntaje_transformado)}</td>
                  {columnas.map((c: any) => <td key={c.key} className="px-4 py-3 text-right">{normCell(row, c.key)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NormativeNarrative({ narrativa }: { narrativa?: Record<string, any> | null }) {
  if (!narrativa) return null;
  const dims = Array.isArray(narrativa.dimensiones_relevantes) ? narrativa.dimensiones_relevantes.filter(Boolean) : [];
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-sm leading-relaxed text-slate-700">
      <div className="font-bold text-slate-950">Lectura normativa controlada</div>
      <p className="mt-2"><b>Riesgos identificados:</b> {narrativa.riesgos_identificados}</p>
      {!!dims.length && <p className="mt-2"><b>Dimensiones de mayor relevancia:</b> {dims.join(", ")}.</p>}
      <p className="mt-2"><b>Identificación general:</b> {narrativa.identificacion_general}</p>
      <p className="mt-2"><b>Recomendación:</b> {narrativa.recomendacion}</p>
    </div>
  );
}

function NormativeTablesSection({ data, limit }: { data?: any; limit?: number }) {
  const tables = Array.isArray(data?.normativa?.items) ? data.normativa.items : [];
  const visible = typeof limit === "number" ? tables.slice(0, limit) : tables;
  if (!visible.length) return <EmptyState text="No hay tablas normativas disponibles. Verifica que existan scores transformados y niveles de riesgo." />;
  return (
    <div className="space-y-4">
      {visible.map((table: NormativaTable) => (
        <div key={String(table.key)} className="space-y-3">
          <NormativeRiskTable table={table} />
          <NormativeNarrative narrativa={table.narrativa} />
        </div>
      ))}
      {typeof limit === "number" && tables.length > limit && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Mostrando {limit} de {tables.length} tablas normativas. Cambia a la pestaña Dominios y dimensiones para ver el detalle completo.</div>
      )}
    </div>
  );
}

function nivelBadge(nivel?: string | null) {
  const n = nivel || "SIN_NIVEL";
  const color = NIVEL_COLORS[n] || "#94a3b8";
  return (
    <span className="inline-flex rounded-full border px-2 py-1 text-xs font-semibold" style={{ color, borderColor: `${color}33`, backgroundColor: `${color}14` }}>
      {nivelLabel(n)}
    </span>
  );
}

function ParticipantesTable({ items = [] }: { items?: ParticipantePsico[] }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [riesgo, setRiesgo] = useState("ALL");
  const [estado, setEstado] = useState("ALL");
  const [sort, setSort] = useState<{ key: "nombre" | "area" | "intra" | "nivel_critico" | "estado"; dir: "asc" | "desc" }>({ key: "nivel_critico", dir: "desc" });
  const riskOrder: Record<string, number> = { MUY_ALTO: 5, ALTO: 4, MEDIO: 3, BAJO: 2, SIN_RIESGO: 1, MUY_BAJO: 1, SIN_NIVEL: 0 };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((it) => {
        const matchesQ = !query || [it.cedula, it.nombre, it.area, it.cargo, it.tipo_cargo, it.email].some((v) => String(v || "").toLowerCase().includes(query));
        const matchesRiesgo = riesgo === "ALL" || it.nivel_critico === riesgo;
        const matchesEstado = estado === "ALL" || (estado === "COMPLETA" ? it.bateria_completa : !it.bateria_completa);
        return matchesQ && matchesRiesgo && matchesEstado;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sort.key === "nivel_critico") cmp = (riskOrder[a.nivel_critico || "SIN_NIVEL"] ?? 0) - (riskOrder[b.nivel_critico || "SIN_NIVEL"] ?? 0);
        else if (sort.key === "estado") cmp = Number(a.bateria_completa) - Number(b.bateria_completa);
        else cmp = String((a as any)[sort.key] || "").localeCompare(String((b as any)[sort.key] || ""), "es");
        return sort.dir === "asc" ? cmp : -cmp;
      });
  }, [items, q, riesgo, estado, sort]);

  const setSortKey = (key: typeof sort.key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const SortButton = ({ label, sortKey, align = "left" }: { label: string; sortKey: typeof sort.key; align?: "left" | "center" }) => (
    <button
      type="button"
      onClick={() => setSortKey(sortKey)}
      className={cn("inline-flex items-center gap-1 font-semibold hover:text-violet-700", align === "center" && "justify-center")}
    >
      {label}<span className="text-[10px] text-slate-400">{sort.key === sortKey ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
    </button>
  );

  if (!items.length) return <EmptyState text="Aún no hay participantes con scoring para esta aplicación." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cédula, nombre, área, cargo..." />
        <Select value={riesgo} onValueChange={setRiesgo}>
          <SelectTrigger><SelectValue placeholder="Riesgo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los riesgos</SelectItem>
            {["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO", "SIN_NIVEL"].map((n) => <SelectItem key={n} value={n}>{nivelLabel(n)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="COMPLETA">Batería completa</SelectItem>
            <SelectItem value="INCOMPLETA">Incompleta</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[1120px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3"><SortButton label="Participante" sortKey="nombre" /></th>
              <th className="px-4 py-3"><SortButton label="Área / cargo" sortKey="area" /></th>
              <th className="px-4 py-3 text-center"><SortButton label="Intra" sortKey="intra" align="center" /></th>
              <th className="px-4 py-3 text-center">Intralaboral</th>
              <th className="px-4 py-3 text-center">Extra</th>
              <th className="px-4 py-3 text-center">Estrés</th>
              <th className="px-4 py-3 text-center"><SortButton label="Riesgo más alto" sortKey="nivel_critico" align="center" /></th>
              <th className="px-4 py-3 text-center"><SortButton label="Estado" sortKey="estado" align="center" /></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((it) => {
              const nivelIntra = it.intra === "A" ? it.niveles?.a : it.niveles?.b;
              const puntajeIntra = it.intra === "A" ? it.puntajes?.a : it.puntajes?.b;
              return (
                <tr key={String(it.empleado_id)} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate("/psicosocial/empleados/" + it.empleado_id)}
                      className="group block max-w-[260px] rounded text-left leading-snug text-slate-900 transition hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
                      title="Abrir perfil del colaborador"
                    >
                      <span className="font-semibold underline decoration-slate-300 underline-offset-4 group-hover:decoration-violet-500">
                        {it.nombre || "Colaborador " + String(it.cedula || "").slice(-4) + " Demo"}
                      </span>
                      <span className="mt-1 block text-[11px] font-normal text-slate-400 group-hover:text-violet-500">Ver perfil</span>
                    </button>
                    <div className="mt-1 text-xs text-slate-500">CC {it.cedula || "—"} · {it.sexo || "Sin dato"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{it.area || "Sin área"}</div>
                    <div className="text-xs text-slate-500">{it.cargo || "Sin cargo"}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{it.intra}</td>
                  <td className="px-4 py-3 text-center"><div>{nivelBadge(nivelIntra)}</div><div className="mt-1 text-xs text-slate-500">{fmtNum(puntajeIntra ?? undefined)}</div></td>
                  <td className="px-4 py-3 text-center"><div>{nivelBadge(it.niveles?.extra)}</div><div className="mt-1 text-xs text-slate-500">{fmtNum(it.puntajes?.extra ?? undefined)}</div></td>
                  <td className="px-4 py-3 text-center"><div>{nivelBadge(it.niveles?.estres)}</div><div className="mt-1 text-xs text-slate-500">{fmtNum(it.puntajes?.estres ?? undefined)}</div></td>
                  <td className="px-4 py-3 text-center">{nivelBadge(it.nivel_critico)}</td>
                  <td className="px-4 py-3 text-center">{it.bateria_completa ? <span className="text-emerald-700 font-semibold">Completa</span> : <span className="text-red-600 font-semibold">Revisar</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Mostrando {filtered.length} de {items.length} participantes. El riesgo más alto resume el nivel máximo observado entre Intralaboral, Extralaboral y Estrés.</p>
    </div>
  );
}



function DomainDetailPanel({
  open,
  dominio,
  dimensiones,
  onClose,
}: {
  open: boolean;
  dominio: DominioPsico | null;
  dimensiones: DimensionPsico[];
  onClose: () => void;
}) {
  if (!open || !dominio) return null;
  const dims = dimensiones
    .filter((d) => d.evaluacion_id === dominio.evaluacion_id && String(d.dominio_code ?? "") === String(dominio.dominio_code ?? ""))
    .sort((a, b) => Number(b.pct_alto_muy_alto ?? 0) - Number(a.pct_alto_muy_alto ?? 0));
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button aria-label="Cerrar detalle" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <section role="dialog" aria-modal="true" className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">Detalle estadístico de dominio</div>
              <h2 className="mt-1 line-clamp-2 text-2xl font-bold tracking-tight text-slate-950" title={dominio.dominio_label}>{dominio.dominio_label}</h2>
              <p className="mt-1 text-sm text-slate-500">{dominio.instrument_label} · dominio agregado</p>
            </div>
            <Button type="button" variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="N dominio" value={dominio.n} icon={Users} tone="violet" compact />
            <KpiCard title="Promedio transformado" value={fmtNum(dominio.promedio_transformado)} icon={Gauge} tone="blue" compact />
            <KpiCard title="% Alto/Muy alto" value={fmtPct(dominio.pct_alto_muy_alto)} icon={AlertTriangle} tone={dominio.pct_alto_muy_alto > 0 ? "orange" : "green"} compact />
            <KpiCard title="Calidad" value={Number((dominio as any).sin_nivel ?? 0) + Number((dominio as any).fuera_rango_0_100 ?? 0) === 0 ? "OK" : "Revisar"} icon={ShieldCheck} tone={Number((dominio as any).sin_nivel ?? 0) + Number((dominio as any).fuera_rango_0_100 ?? 0) === 0 ? "green" : "red"} compact />
          </div>
          <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm leading-relaxed text-sky-900">
            <b>Lectura técnica:</b> este dominio consolida las dimensiones asociadas y debe interpretarse con el puntaje transformado oficial. Las dimensiones con mayor porcentaje Alto/Muy alto orientan la priorización del plan de intervención.
          </div>
          <Card className="mt-5 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Dimensiones del dominio</CardTitle>
              <CardDescription>Ordenadas por criticidad para análisis y plan de acción.</CardDescription>
            </CardHeader>
            <CardContent>
              {!dims.length ? <EmptyState text="No hay dimensiones asociadas a este dominio." /> : (
                <div className="overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Dimensión</th>
                        <th className="px-4 py-3 text-right">N</th>
                        <th className="px-4 py-3 text-right">Promedio</th>
                        <th className="px-4 py-3 text-right">% Alto/Muy alto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dims.map((d) => (
                        <tr key={`${d.evaluacion_id}-${d.dimension_code}`}>
                          <td className="px-4 py-3 font-medium text-slate-900">{d.dimension_label}</td>
                          <td className="px-4 py-3 text-right">{d.n}</td>
                          <td className="px-4 py-3 text-right font-semibold">{fmtNum(d.promedio_transformado)}</td>
                          <td className="px-4 py-3 text-right"><span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", riesgoTone(d.pct_alto_muy_alto))}>{fmtPct(d.pct_alto_muy_alto)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function DimensionDetailPanel({
  open,
  loading,
  detail,
  error,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  detail: DimensionDetalleResponse | null;
  error: string | null;
  onClose: () => void;
}) {
  if (!open) return null;
  const dim = detail?.dimension;
  const responseCols = [
    ["Siempre", "respuesta_siempre", "pct_respuesta_siempre"],
    ["Casi siempre", "respuesta_casi_siempre", "pct_respuesta_casi_siempre"],
    ["Algunas veces", "respuesta_algunas_veces", "pct_respuesta_algunas_veces"],
    ["Casi nunca", "respuesta_casi_nunca", "pct_respuesta_casi_nunca"],
    ["Nunca", "respuesta_nunca", "pct_respuesta_nunca"],
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button aria-label="Cerrar detalle" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        className="relative flex h-[88vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">Detalle estadístico integrado</div>
              <h2 className="mt-1 line-clamp-2 text-2xl font-bold tracking-tight text-slate-950" title={dim?.dimension_label}>{dim?.dimension_label ?? "Cargando dimensión..."}</h2>
              {dim && <p className="mt-1 text-sm text-slate-500">{dim.dominio_label} · {dim.instrument_labels.join(" + ")}</p>}
            </div>
            <Button type="button" variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-72 w-full" /></div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-800"><AlertTriangle className="mb-2 h-5 w-5" />{error}</div>
          ) : !detail || !dim ? (
            <EmptyState />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <KpiCard title="N dimensión" value={dim.n} icon={Users} tone="violet" compact />
                <KpiCard title="Promedio transformado" value={fmtNum(dim.promedio_transformado)} subtitle="Escala oficial 0–100" icon={Gauge} tone="blue" compact />
                <KpiCard title="% Alto/Muy alto" value={fmtPct(dim.pct_alto_muy_alto)} icon={AlertTriangle} tone={dim.pct_alto_muy_alto > 0 ? "orange" : "green"} compact />
                <KpiCard title="Rango observado" value={String(fmtNum(dim.min_transformado)) + "–" + String(fmtNum(dim.max_transformado))} icon={LineChart} tone="yellow" compact />
                <KpiCard title="Calidad" value={dim.sin_nivel + dim.fuera_rango_0_100 === 0 ? "OK" : "Revisar"} subtitle={String(dim.sin_nivel) + " sin nivel · " + String(dim.fuera_rango_0_100) + " fuera de rango"} icon={ShieldCheck} tone={dim.sin_nivel + dim.fuera_rango_0_100 === 0 ? "green" : "red"} compact />
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.15fr]">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Distribución por nivel de riesgo</CardTitle>
                    <CardDescription>Clasificación normativa de la dimensión según baremos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detail.distribucion_niveles.map((n) => (
                      <div key={String(n.nivel)} className="grid grid-cols-[120px_1fr_70px] items-center gap-3 text-sm">
                        <div className="font-medium text-slate-700">{n.label}</div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: String(n.porcentaje) + "%", background: NIVEL_COLORS[String(n.nivel)] ?? "#64748b" }} /></div>
                        <div className="text-right text-xs text-slate-500">{n.cantidad} · {fmtPct(n.porcentaje)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-sm leading-relaxed text-slate-700">
                    <div className="font-bold text-slate-950">Lectura integrada</div>
                    {(detail as any).narrativa || (detail as any).normativa?.narrativa ? (
                      <NormativeNarrative narrativa={(detail as any).narrativa ?? (detail as any).normativa?.narrativa} />
                    ) : null}
                    <p className="mt-2"><b>Lectura psicométrica:</b> el nivel de riesgo se interpreta con el puntaje transformado y el baremo aplicable al instrumento. Los conteos por respuesta ayudan a identificar patrones de exposición por ítem, pero no reemplazan la clasificación normativa.</p>
                  </div>
                  {(detail as any).normativa && (
                    <div className="max-h-[340px] overflow-auto rounded-2xl border border-slate-200">
                      <NormativeRiskTable table={(detail as any).normativa} compact />
                    </div>
                  )}
                </div>
              </div>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Ítems que componen la dimensión</CardTitle>
                  <CardDescription>Conteo textual por pregunta y promedio numérico usado como trazabilidad descriptiva.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-2xl border">
                    <div className="max-h-[520px] overflow-auto">
                      <table className="min-w-[1180px] w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 shadow-sm">
                          <tr>
                            <th className="px-4 py-3">Pregunta</th>
                            <th className="px-4 py-3">Instrumento</th>
                            <th className="px-4 py-3 text-right">Prom. valor</th>
                            <th className="px-4 py-3 text-center">Invertida</th>
                            {responseCols.map(([label]) => <th key={label} className="px-4 py-3 text-right">{label}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {detail.items.map((item) => (
                            <tr key={String(item.evaluacion_id) + "-" + String(item.pregunta_id)} className="hover:bg-slate-50/70">
                              <td className="max-w-[420px] px-4 py-3">
                                <div className="font-semibold text-slate-900">P{item.pregunta_orden}</div>
                                <div className="mt-1 leading-snug text-slate-600">{item.texto}</div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.instrument_label}</td>
                              <td className="px-4 py-3 text-right font-semibold">{fmtNum(item.promedio_valor_num)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", item.invertida ? "border-amber-100 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600")}>{item.invertida ? "Sí" : "No"}</span>
                              </td>
                              {responseCols.map(([label, countKey, pctKey]) => (
                                <td key={label} className="px-4 py-3 text-right">
                                  <div className="font-semibold text-slate-900">{Number((item as any)[countKey] ?? 0).toLocaleString("es-CO")}</div>
                                  <div className="text-[11px] text-slate-400">{fmtPct(Number((item as any)[pctKey] ?? 0))}</div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


function DimensionsTable({ items, onOpenDetail }: { items: DimensionPsico[]; onOpenDetail: (item: DimensionPsico) => void }) {
  type SortKey =
    | "dimension_label"
    | "dominio_label"
    | "instrument_label"
    | "n"
    | "promedio_transformado"
    | "respuesta_siempre"
    | "respuesta_casi_siempre"
    | "respuesta_algunas_veces"
    | "respuesta_casi_nunca"
    | "respuesta_nunca"
    | "pct_alto_muy_alto";

  const [q, setQ] = useState("");
  const [instrumento, setInstrumento] = useState("__ALL__");
  const [dominio, setDominio] = useState("__ALL__");
  const [riesgo, setRiesgo] = useState("__ALL__");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "pct_alto_muy_alto", dir: "desc" });

  const instrumentos = useMemo(() => Array.from(new Set(items.map((it) => it.instrument_label).filter(Boolean))).sort(), [items]);
  const dominios = useMemo(() => Array.from(new Set(items.map((it) => it.dominio_label || "Sin dominio").filter(Boolean))).sort(), [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((it) => (instrumento === "__ALL__" ? true : it.instrument_label === instrumento))
      .filter((it) => (dominio === "__ALL__" ? true : (it.dominio_label || "Sin dominio") === dominio))
      .filter((it) => {
        if (riesgo === "__ALL__") return true;
        if (riesgo === "alto") return Number(it.pct_alto_muy_alto ?? 0) > 0;
        if (riesgo === "critico") return Number(it.pct_alto_muy_alto ?? 0) >= 50;
        if (riesgo === "sin_riesgo_alto") return Number(it.pct_alto_muy_alto ?? 0) === 0;
        return true;
      })
      .filter((it) => {
        if (!needle) return true;
        return `${it.dimension_label} ${it.dominio_label} ${it.instrument_label}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        const av = a[sort.key] ?? "";
        const bv = b[sort.key] ?? "";
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "es");
        return sort.dir === "asc" ? cmp : -cmp;
      });
  }, [items, q, instrumento, dominio, riesgo, sort]);

  const setSortKey = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };

  const Th = ({ label, sortKey, align = "left" }: { label: string; sortKey: SortKey; align?: "left" | "right" }) => (
    <th className={cn("whitespace-nowrap px-4 py-3", align === "right" && "text-right")}>
      <button type="button" onClick={() => setSortKey(sortKey)} className={cn("inline-flex items-center gap-1 font-semibold hover:text-violet-700", align === "right" && "justify-end")}> 
        {label}
        <span className="text-[10px] text-slate-400">{sort.key === sortKey ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );

  const ResponseCell = ({ count, pct }: { count?: number; pct?: number }) => (
    <div className="text-right">
      <div className="font-semibold text-slate-900">{Number(count ?? 0).toLocaleString("es-CO")}</div>
      <div className="text-[11px] text-slate-400">{fmtPct(pct)}</div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_.8fr_.8fr_.7fr_auto]">
        <Input className="bg-white" placeholder="Buscar dimensión, dominio o instrumento..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={instrumento} onValueChange={setInstrumento}>
          <SelectTrigger className="bg-white"><SelectValue placeholder="Instrumento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todos los instrumentos</SelectItem>
            {instrumentos.map((it) => <SelectItem key={it} value={it}>{it}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dominio} onValueChange={setDominio}>
          <SelectTrigger className="bg-white"><SelectValue placeholder="Dominio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todos los dominios</SelectItem>
            {dominios.map((it) => <SelectItem key={it} value={it}>{it}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={riesgo} onValueChange={setRiesgo}>
          <SelectTrigger className="bg-white"><SelectValue placeholder="Riesgo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todo riesgo</SelectItem>
            <SelectItem value="critico">Crítico ≥ 50%</SelectItem>
            <SelectItem value="alto">Con Alto/Muy alto</SelectItem>
            <SelectItem value="sin_riesgo_alto">Sin Alto/Muy alto</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center justify-end text-sm text-slate-500">{filtered.length} dimensiones</div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="max-h-[720px] overflow-auto">
          <table className="min-w-[1320px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 shadow-sm">
              <tr>
                <Th label="Dominio" sortKey="dominio_label" />
                <Th label="Dimensión" sortKey="dimension_label" />
                <Th label="Instrumento" sortKey="instrument_label" />
                <Th label="N" sortKey="n" align="right" />
                <Th label="Promedio" sortKey="promedio_transformado" align="right" />
                <Th label="Siempre" sortKey="respuesta_siempre" align="right" />
                <Th label="Casi siempre" sortKey="respuesta_casi_siempre" align="right" />
                <Th label="Algunas veces" sortKey="respuesta_algunas_veces" align="right" />
                <Th label="Casi nunca" sortKey="respuesta_casi_nunca" align="right" />
                <Th label="Nunca" sortKey="respuesta_nunca" align="right" />
                <Th label="% Alto/Muy alto" sortKey="pct_alto_muy_alto" align="right" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((it) => (
                <tr key={`${it.evaluacion_id}-${it.dimension_code}`} className="hover:bg-slate-50/70">
                  <td className="max-w-[260px] px-4 py-3 text-slate-700"><div className="break-words font-semibold leading-snug">{it.dominio_label || "—"}</div></td>
                  <td className="max-w-[360px] px-4 py-3 font-medium text-slate-900">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(it)}
                      className="group block max-w-full text-left leading-snug text-slate-900 transition hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
                      title="Abrir detalle estadístico de la dimensión"
                    >
                      <span className="break-words underline decoration-slate-300 underline-offset-4 group-hover:decoration-violet-500">
                        {it.dimension_label}
                      </span>
                      <span className="mt-1 block text-[11px] font-normal text-slate-400 group-hover:text-violet-500">Ver detalle</span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{it.instrument_label}</td>
                  <td className="px-4 py-3 text-right">{it.n}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtNum(it.promedio_transformado)}</td>
                  <td className="px-4 py-3"><ResponseCell count={it.respuesta_siempre} pct={it.pct_respuesta_siempre} /></td>
                  <td className="px-4 py-3"><ResponseCell count={it.respuesta_casi_siempre} pct={it.pct_respuesta_casi_siempre} /></td>
                  <td className="px-4 py-3"><ResponseCell count={it.respuesta_algunas_veces} pct={it.pct_respuesta_algunas_veces} /></td>
                  <td className="px-4 py-3"><ResponseCell count={it.respuesta_casi_nunca} pct={it.pct_respuesta_casi_nunca} /></td>
                  <td className="px-4 py-3"><ResponseCell count={it.respuesta_nunca} pct={it.pct_respuesta_nunca} /></td>
                  <td className="px-4 py-3 text-right"><span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", riesgoTone(it.pct_alto_muy_alto))}>{fmtPct(it.pct_alto_muy_alto)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Las columnas de respuestas son conteos agregados de todos los ítems de la dimensión. Por eso pueden superar N cuando la dimensión contiene varias preguntas. La interpretación oficial sigue siendo el puntaje transformado y el nivel de riesgo.
      </p>
    </div>
  );
}


function SegmentacionChart({ title, items }: { title: string; items?: SegmentacionItem[] }) {
  const data = (items ?? []).slice(0, 8);
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>% de registros en Alto/Muy alto por grupo.</CardDescription>
      </CardHeader>
      <CardContent>
        {!data.length ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="nombre" width={130} />
              <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Alto/Muy alto"]} />
              <Bar dataKey="pct_alto_muy_alto" fill="#7c3aed" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

type SocioChartMode = "bar" | "horizontal" | "donut" | "pie" | "table";

function SocioChart({ title, items }: { title: string; items?: SocioDistribucionItem[] }) {
  const storageKey = "eva360:socio-chart:" + title;
  const [mode, setMode] = useState<SocioChartMode>(() => {
    try {
      return (localStorage.getItem(storageKey) as SocioChartMode) || "horizontal";
    } catch {
      return "horizontal";
    }
  });
  const data = useMemo(() => (items ?? []).slice(0, 10), [items]);
  const hasOnlyMissing = data.length === 1 && String(data[0]?.nombre).toLowerCase() === "sin dato";

  const changeMode = (value: string) => {
    const next = value as SocioChartMode;
    setMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // localStorage puede no estar disponible en algunos entornos de prueba.
    }
  };

  const chartData = data.map((item) => ({
    ...item,
    porcentaje: Number(item.porcentaje ?? 0),
    cantidad: Number(item.cantidad ?? 0),
  }));

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Distribución porcentual de la ficha de datos generales.</CardDescription>
        </div>
        <Select value={mode} onValueChange={changeMode}>
          <SelectTrigger className="h-9 w-full bg-white text-xs sm:w-[150px]"><SelectValue placeholder="Vista" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Barras H.</SelectItem>
            <SelectItem value="bar">Barras</SelectItem>
            <SelectItem value="donut">Dona</SelectItem>
            <SelectItem value="pie">Torta</SelectItem>
            <SelectItem value="table">Tabla</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!chartData.length ? (
          <EmptyState text="No hay datos sociodemográficos disponibles para esta variable." />
        ) : hasOnlyMissing ? (
          <EmptyState text="La variable existe, pero los participantes no tienen este dato cargado." />
        ) : mode === "table" ? (
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">N</th>
                  <th className="px-4 py-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {chartData
                  .slice()
                  .sort((a, b) => b.cantidad - a.cantidad)
                  .map((item) => (
                    <tr key={String(item.nombre)}>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.nombre}</td>
                      <td className="px-4 py-3 text-right font-semibold">{item.cantidad.toLocaleString("es-CO")}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmtPct(item.porcentaje)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : mode === "donut" || mode === "pie" ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="cantidad"
                nameKey="nombre"
                innerRadius={mode === "donut" ? 68 : 0}
                outerRadius={104}
                paddingAngle={mode === "donut" ? 3 : 1}
              >
                {chartData.map((entry, index) => (
                  <Cell key={"socio-" + title + "-" + String(entry.nombre) + "-" + String(index)} fill={["#7c3aed", "#22c55e", "#f97316", "#0ea5e9", "#eab308", "#ef4444", "#64748b", "#14b8a6"][index % 8]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any, name: any) => [Number(value).toLocaleString("es-CO") + " participantes", name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : mode === "bar" ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => String(v) + "%"} domain={[0, 100]} />
              <Tooltip formatter={(value: any, name: any, props: any) => [Number(value).toFixed(1) + "% (" + String(props?.payload?.cantidad ?? 0) + ")", "Participación"]} />
              <Bar dataKey="porcentaje" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 110, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => String(v) + "%"} />
              <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any, name: any, props: any) => [Number(value).toFixed(1) + "% (" + String(props?.payload?.cantidad ?? 0) + ")", "Participación"]} />
              <Bar dataKey="porcentaje" fill="#7c3aed" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}


export default function ReportesPsico() {
  const [searchParams] = useSearchParams();
  const initialAplicacionId = Number(searchParams.get("aplicacionId") || searchParams.get("aplicacion_id") || 0) || null;
  const [apps, setApps] = useState<PsicoAplicacionItem[]>([]);
  const [aplicacionId, setAplicacionId] = useState<number | null>(initialAplicacionId);
  const [data, setData] = useState<PsicoDashboardResponse | null>(null);
  const [tab, setTab] = useState<TabKey>("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<DimensionPsico | null>(null);
  const [dimensionDetail, setDimensionDetail] = useState<DimensionDetalleResponse | null>(null);
  const [dimensionDetailLoading, setDimensionDetailLoading] = useState(false);
  const [dimensionDetailError, setDimensionDetailError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<DominioPsico | null>(null);

  async function loadApps() {
    const items = await listarAplicacionesPsicoDashboard();
    setApps(items);
    if (!aplicacionId && items.length) setAplicacionId(items[0].id);
  }

  async function loadDashboard(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await obtenerDashboardPsicoAplicacion(id);
      setData(res);
      if (res?.aplicacion?.nombre) {
        setApps((prev) => {
          const label = res.aplicacion.nombre;
          const empresaNombre = (res.aplicacion as any)?.empresa_nombre || (res.aplicacion as any)?.empresa || undefined;
          const item = { id, nombre: label, empresa_nombre: empresaNombre } as PsicoAplicacionItem;
          return prev.some((a) => Number(a.id) === Number(id))
            ? prev.map((a) => (Number(a.id) === Number(id) ? { ...a, ...item } : a))
            : [item, ...prev];
        });
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el dashboard psicosocial.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function openDimensionDetail(item: DimensionPsico) {
    if (!aplicacionId) return;
    setSelectedDimension(item);
    setDimensionDetail(null);
    setDimensionDetailError(null);
    setDimensionDetailLoading(true);
    try {
      const res = await obtenerDetalleDimensionPsicoAplicacion(aplicacionId, item.dimension_code, item.evaluacion_id);
      setDimensionDetail(res);
    } catch (e) {
      console.error(e);
      setDimensionDetailError("No fue posible cargar el detalle de la dimensión.");
    } finally {
      setDimensionDetailLoading(false);
    }
  }

  function closeDimensionDetail() {
    setSelectedDimension(null);
    setDimensionDetail(null);
    setDimensionDetailError(null);
  }

  function openDomainDetail(item: DominioPsico) {
    setSelectedDomain(item);
  }

  function closeDomainDetail() {
    setSelectedDomain(null);
  }

  useEffect(() => {
    loadApps().catch(() => {
      if (initialAplicacionId) {
        setApps([{ id: initialAplicacionId, nombre: `Aplicación #${initialAplicacionId}` } as PsicoAplicacionItem]);
      } else {
        setApps([]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (aplicacionId) loadDashboard(aplicacionId);
  }, [aplicacionId]);

  const app = data?.aplicacion;
  const calidad = data?.calidad;

  const totalIntra = data?.totales?.filter((t) => t.total_code === "TOTAL_INTRA") ?? [];
  const totalExtra = data?.totales?.find((t) => t.total_code === "TOTAL_EXTRA");
  const totalEstres = data?.totales?.find((t) => t.total_code === "TOTAL_ESTRES");

  const predominantTotal = useMemo(() => {
    const all = data?.distribucion_totales.flatMap((d) => d.niveles.map((n) => ({ ...n, instrumento: d.instrument_label }))) ?? [];
    return all.sort((a, b) => b.cantidad - a.cantidad)[0];
  }, [data]);


  const dominioCritico = data?.kpis.dominio_mas_critico;
  const dimensionCritica = data?.kpis.dimension_mas_critica;
  const periodicidad = Number(data?.kpis.pct_global_alto_muy_alto ?? 0) >= 15 ? "12 meses" : "12-24 meses";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <LineChart className="h-8 w-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reportes — Riesgo Psicosocial</h1>
                  {calidad && estadoBadge(calidad.estado)}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Dashboard oficial por aplicación: A o B + Extralaboral + Estrés.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Aplicación: <b>{app?.nombre ?? "—"}</b></span>
                  <span>·</span>
                  <span>Empresa: <b>{(app as any)?.empresa_nombre ?? (app as any)?.empresa ?? "—"}</b></span>
                  <span>·</span>
                  <span>Estado: <b>{app?.estado ?? calidad?.estado ?? "—"}</b></span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={aplicacionId ? String(aplicacionId) : undefined} onValueChange={(v) => setAplicacionId(Number(v))}>
                <SelectTrigger className="w-[280px] bg-white">
                  <SelectValue placeholder="Selecciona una aplicación" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>
                      {a.nombre} · {(a as any).empresa_nombre ? `${(a as any).empresa_nombre} · ` : ""}#{a.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => aplicacionId && loadDashboard(aplicacionId)} disabled={!aplicacionId || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Actualizar
              </Button>
              <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-700" disabled>
                <FileText className="mr-2 h-4 w-4" /> Informe global
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <Select disabled><SelectTrigger className="bg-white"><SelectValue placeholder="Formulario: Todos" /></SelectTrigger></Select>
            <Select disabled><SelectTrigger className="bg-white"><SelectValue placeholder="Área: Todas" /></SelectTrigger></Select>
            <Select disabled><SelectTrigger className="bg-white"><SelectValue placeholder="Cargo: Todos" /></SelectTrigger></Select>
            <Select disabled><SelectTrigger className="bg-white"><SelectValue placeholder="Género: Todos" /></SelectTrigger></Select>
            <Select disabled><SelectTrigger className="bg-white"><SelectValue placeholder="Edad: Todas" /></SelectTrigger></Select>
            <Select disabled><SelectTrigger className="bg-white"><SelectValue placeholder="Antigüedad: Todas" /></SelectTrigger></Select>
            <Button variant="outline" disabled><Filter className="mr-2 h-4 w-4" /> Más filtros</Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-white p-1 shadow-sm">
          <div className="flex min-w-max gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)} className={cn("flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition", tab === key ? "bg-violet-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100")}> 
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <AbrilLoading title="Preparando dashboard psicosocial" subtitle="Validando sesión, aplicación, maestros normativos y resultados calculados." />
        ) : !data ? (
          <EmptyState text="Selecciona una aplicación para visualizar el dashboard." />
        ) : (
          <>
            {tab === "resumen" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                  <div className="xl:col-span-2">
                    <KpiCard compact title="Participación" value={`${calidad?.bateria_completa_correcta ?? 0}/${calidad?.personas_unicas ?? 0}`} subtitle={`${fmtPct(calidad?.porcentaje_completitud)} batería completa`} icon={Users} tone="violet" />
                  </div>
                  <div className="xl:col-span-2">
                    <KpiCard compact title="Riesgo predominante" value={predominantTotal?.label ?? "—"} subtitle="Nivel más frecuente en scores totales" icon={ShieldCheck} tone={data.kpis.pct_global_alto_muy_alto > 0 ? "yellow" : "green"} />
                  </div>
                  <div className="xl:col-span-2">
                    <KpiCard compact title="Alto/Muy alto" value={fmtPct(data.kpis.pct_global_alto_muy_alto)} subtitle={`${riesgoLabel(data.kpis.pct_global_alto_muy_alto)} · ponderado por scores`} icon={Gauge} tone={data.kpis.pct_global_alto_muy_alto > 0 ? "red" : "green"} />
                  </div>
                  <div className="xl:col-span-2">
                    <KpiCard compact title="Próxima evaluación" value={periodicidad} subtitle="Periodicidad sugerida según exposición" icon={CalendarClock} tone="green" />
                  </div>
                  <div className="xl:col-span-2">
                    <KpiCard compact title="Dominio crítico" value={shortText(dominioCritico?.dominio_label, 24)} valueTitle={dominioCritico?.dominio_label} subtitle={`Alto/Muy alto ${fmtPct(dominioCritico?.pct_alto_muy_alto)}`} icon={Target} tone="orange" />
                  </div>
                  <div className="xl:col-span-2">
                    <KpiCard compact title="Dimensión crítica" value={shortText(dimensionCritica?.dimension_label, 24)} valueTitle={dimensionCritica?.dimension_label} subtitle={`Promedio ${fmtNum(dimensionCritica?.promedio_transformado)}`} icon={Brain} tone="red" />
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-xs leading-relaxed text-sky-900">
                  <b>Lectura para el psicólogo:</b> los resultados se interpretan con puntajes transformados de 0 a 100 y niveles de riesgo oficiales. Las frecuencias de respuesta ayudan a reconocer patrones de exposición por ítem, pero la clasificación normativa se mantiene en los baremos del instrumento.
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                  <Card className="border-slate-200 shadow-sm xl:col-span-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Distribución global por nivel</CardTitle>
                      <CardDescription>Distribución de niveles en scores totales oficiales.</CardDescription>
                    </CardHeader>
                    <CardContent><DonutGlobal data={data.distribucion_totales} /></CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm xl:col-span-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Top dimensiones críticas</CardTitle>
                      <CardDescription>Ordenadas por % Alto/Muy alto.</CardDescription>
                    </CardHeader>
                    <CardContent><RankingList items={data.ranking_dimensiones} /></CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm xl:col-span-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Mapa ejecutivo de dominios</CardTitle>
                      <CardDescription>Promedio y exposición por dominio/dimensión agrupada.</CardDescription>
                    </CardHeader>
                    <CardContent><DominioCards dominios={data.ranking_dominios} onOpen={openDomainDetail} /></CardContent>
                  </Card>
                </div>

                <InstrumentOverviewSection data={data as any} />

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Alertas importantes</CardTitle>
                    <CardDescription>Eventos para revisión del psicólogo/SST.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!data.alertas.length ? (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mb-2 h-5 w-5" />Sin alertas críticas con los datos actuales.</div>
                    ) : data.alertas.map((a, i) => (
                      <div key={"alerta-" + String(i)} className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="mb-2 h-5 w-5" />{a.mensaje}</div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === "calidad" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Calidad y completitud de batería</CardTitle>
                    <CardDescription>Regla esperada: cada colaborador tiene A o B + Extralaboral + Estrés.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <KpiCard title="Con A" value={calidad?.con_a} icon={FileText} tone="blue" />
                      <KpiCard title="Con B" value={calidad?.con_b} icon={FileText} tone="blue" />
                      <KpiCard title="Con Extra" value={calidad?.con_extra} icon={Sparkles} tone="green" />
                      <KpiCard title="Con Estrés" value={calidad?.con_estres} icon={Gauge} tone="orange" />
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-sm"><span>Completitud oficial</span><b>{fmtPct(calidad?.porcentaje_completitud)}</b></div>
                      <Progress value={calidad?.porcentaje_completitud ?? 0} />
                    </div>
                    <TotalesTable items={data.totales} />
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Inconsistencias</CardTitle>
                    <CardDescription>Debe permanecer en cero para reporte oficial.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <KpiCard title="A y B simultáneo" value={calidad?.error_con_a_y_b} icon={AlertTriangle} tone={calidad?.error_con_a_y_b ? "red" : "green"} />
                    <KpiCard title="Sin intra" value={calidad?.error_sin_intra} icon={AlertTriangle} tone={calidad?.error_sin_intra ? "red" : "green"} />
                    <KpiCard title="Sin extra" value={calidad?.error_sin_extra} icon={AlertTriangle} tone={calidad?.error_sin_extra ? "red" : "green"} />
                    <KpiCard title="Sin estrés" value={calidad?.error_sin_estres} icon={AlertTriangle} tone={calidad?.error_sin_estres ? "red" : "green"} />
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === "dominios" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader><CardTitle>Riesgo por dominios</CardTitle><CardDescription>Ranking ejecutivo por exposición Alto/Muy alto.</CardDescription></CardHeader>
                    <CardContent><DominioCards dominios={data.ranking_dominios} onOpen={openDomainDetail} /></CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader><CardTitle>Top dimensiones críticas</CardTitle><CardDescription>Priorización para intervención.</CardDescription></CardHeader>
                    <CardContent><RankingList items={data.ranking_dimensiones} /></CardContent>
                  </Card>
                </div>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle>Tabla detallada de dimensiones</CardTitle><CardDescription>Base analítica para psicólogo evaluador y plan de acción.</CardDescription></CardHeader>
                  <CardContent><DimensionsTable items={data.dimensiones} onOpenDetail={openDimensionDetail} /></CardContent>
                </Card>
              </div>
            )}

            {tab === "segmentacion" && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <SegmentacionChart title="Distribución por área" items={data.segmentacion?.area} />
                <SegmentacionChart title="Distribución por cargo" items={data.segmentacion?.cargo} />
                <SegmentacionChart title="Distribución por género" items={data.segmentacion?.sexo} />
              </div>
            )}

            {tab === "sociodemografico" && (
              <div className="space-y-5">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Perfil sociodemográfico</CardTitle>
                    <CardDescription>Variables de ficha de datos generales disponibles para los participantes de la aplicación.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <KpiCard title="Participantes con scoring" value={data.sociodemografia?.total_participantes ?? calidad?.personas_unicas ?? 0} icon={Users} tone="violet" />
                      <KpiCard title="Completitud género" value={fmtPct(data.sociodemografia?.completitud?.sexo)} icon={CheckCircle2} tone="green" />
                      <KpiCard title="Completitud tipo cargo" value={fmtPct(data.sociodemografia?.completitud?.tipo_cargo)} icon={CheckCircle2} tone="blue" />
                      <KpiCard title="Completitud edad" value={fmtPct(data.sociodemografia?.completitud?.edad)} icon={CheckCircle2} tone="orange" />
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <SocioChart title="Género" items={data.sociodemografia?.variables?.sexo} />
                  <SocioChart title="Tipo de cargo" items={data.sociodemografia?.variables?.tipo_cargo} />
                  <SocioChart title="Edad" items={data.sociodemografia?.variables?.edad} />
                  <SocioChart title="Nivel educativo" items={data.sociodemografia?.variables?.nivel_educativo} />
                  <SocioChart title="Estado civil" items={data.sociodemografia?.variables?.estado_civil} />
                  <SocioChart title="Estrato" items={data.sociodemografia?.variables?.estrato} />
                  <SocioChart title="Tipo de contrato" items={data.sociodemografia?.variables?.tipo_contrato} />
                  <SocioChart title="Tipo de salario" items={data.sociodemografia?.variables?.tipo_salario} />
                  <SocioChart title="Antigüedad en la empresa" items={data.sociodemografia?.variables?.antiguedad_empresa} />
                  <SocioChart title="Antigüedad en el cargo" items={data.sociodemografia?.variables?.antiguedad_cargo} />
                </div>
              </div>
            )}


            {tab === "participantes" && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Participantes e informes individuales</CardTitle>
                  <CardDescription>Listado por colaborador con estado de batería, niveles por instrumento y base para informe individual.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ParticipantesTable items={data.participantes?.items ?? []} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      <DomainDetailPanel
        open={Boolean(selectedDomain)}
        dominio={selectedDomain}
        dimensiones={data?.dimensiones ?? []}
        onClose={closeDomainDetail}
      />
      <DimensionDetailPanel
        open={Boolean(selectedDimension)}
        loading={dimensionDetailLoading}
        detail={dimensionDetail}
        error={dimensionDetailError}
        onClose={closeDimensionDetail}
      />
    </div>
  );
}
