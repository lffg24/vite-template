import { useEffect, useMemo, useState } from "react";
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
import {
  listarAplicacionesPsicoDashboard,
  obtenerDashboardPsicoAplicacion,
} from "@/services/reportesPsicoDashboardService";
import type {
  DimensionPsico,
  DistribucionTotal,
  DominioPsico,
  PsicoAplicacionItem,
  PsicoDashboardResponse,
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

function KpiCard({ title, value, subtitle, icon: Icon, tone = "violet" }: any) {
  const tones: Record<string, string> = {
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    red: "bg-red-50 text-red-700 border-red-100",
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <Card className="h-full min-h-[138px] overflow-hidden border-slate-200 bg-white/90 shadow-sm">
      <CardContent className="h-full p-5">
        <div className="flex h-full items-start gap-4">
          <div className={cn("shrink-0 rounded-2xl border p-3", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-sm font-medium leading-snug text-slate-600">{title}</div>
            <div className="mt-1 break-words text-[clamp(1.35rem,1.55vw,1.85rem)] font-bold leading-[1.15] tracking-tight text-slate-950 [overflow-wrap:anywhere]">
              {value}
            </div>
            {subtitle && <div className="mt-2 break-words text-xs leading-snug text-slate-500 [overflow-wrap:anywhere]">{subtitle}</div>}
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
    <ResponsiveContainer width="100%" height={310}>
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
    <div className="relative h-[310px]">
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
          <div className="text-xs text-slate-500">registros</div>
        </div>
      </div>
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
            <div className="truncate font-medium text-slate-700" title={item.dimension_label}>{item.dimension_label}</div>
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

function DominioCards({ dominios }: { dominios: DominioPsico[] }) {
  if (!dominios.length) return <EmptyState />;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {dominios.slice(0, 8).map((dom) => (
        <div key={`${dom.evaluacion_id}-${dom.dominio_code}`} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">{dom.dominio_label}</div>
              <div className="mt-1 text-xs text-slate-500">{dom.instrument_label}</div>
            </div>
            <Badge className={cn("rounded-full border", riesgoTone(dom.pct_alto_muy_alto))}>{fmtPct(dom.pct_alto_muy_alto)}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Promedio</div>
              <div className="text-xl font-bold text-slate-950">{fmtNum(dom.promedio_transformado)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Alto/Muy alto</div>
              <div className="text-xl font-bold text-slate-950">{dom.alto_muy_alto}</div>
            </div>
          </div>
        </div>
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

function DimensionsTable({ items }: { items: DimensionPsico[] }) {
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
                <Th label="Dimensión" sortKey="dimension_label" />
                <Th label="Dominio" sortKey="dominio_label" />
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
                  <td className="max-w-[360px] px-4 py-3 font-medium text-slate-900"><div className="break-words leading-snug">{it.dimension_label}</div></td>
                  <td className="max-w-[260px] px-4 py-3 text-slate-600"><div className="break-words leading-snug">{it.dominio_label || "—"}</div></td>
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

function SocioChart({ title, items }: { title: string; items?: SocioDistribucionItem[] }) {
  const data = (items ?? []).slice(0, 10);
  const hasOnlyMissing = data.length === 1 && String(data[0]?.nombre).toLowerCase() === "sin dato";
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Distribución porcentual de la ficha de datos generales.</CardDescription>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          <EmptyState text="No hay datos sociodemográficos disponibles para esta variable." />
        ) : hasOnlyMissing ? (
          <EmptyState text="La variable existe, pero los participantes no tienen este dato cargado." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 110, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any, name: any, props: any) => [`${Number(value).toFixed(1)}% (${props?.payload?.cantidad ?? 0})`, "Participación"]} />
              <Bar dataKey="porcentaje" fill="#7c3aed" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}


export default function ReportesPsico() {
  const [apps, setApps] = useState<PsicoAplicacionItem[]>([]);
  const [aplicacionId, setAplicacionId] = useState<number | null>(null);
  const [data, setData] = useState<PsicoDashboardResponse | null>(null);
  const [tab, setTab] = useState<TabKey>("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el dashboard psicosocial.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApps().catch(() => setApps([]));
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
                  <span>Empresa actual por X-Empresa-Id</span>
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
                  {apps.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nombre} · #{a.id}</SelectItem>)}
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            <Skeleton className="h-[420px] rounded-2xl" />
          </div>
        ) : !data ? (
          <EmptyState text="Selecciona una aplicación para visualizar el dashboard." />
        ) : (
          <>
            {tab === "resumen" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  <KpiCard title="Participación" value={`${calidad?.bateria_completa_correcta ?? 0}/${calidad?.personas_unicas ?? 0}`} subtitle={`${fmtPct(calidad?.porcentaje_completitud)} batería completa`} icon={Users} tone="violet" />
                  <KpiCard title="Riesgo predominante" value={predominantTotal?.label ?? "—"} subtitle="Nivel más frecuente en totales" icon={ShieldCheck} tone="yellow" />
                  <KpiCard title="% Alto/Muy alto" value={fmtPct(data.kpis.pct_global_alto_muy_alto)} subtitle="Promedio en totales oficiales" icon={Gauge} tone={data.kpis.pct_global_alto_muy_alto > 0 ? "red" : "green"} />
                  <KpiCard title="Dominio más crítico" value={data.kpis.dominio_mas_critico?.dominio_label ?? "—"} subtitle={`% Alto/Muy alto ${fmtPct(data.kpis.dominio_mas_critico?.pct_alto_muy_alto)}`} icon={Target} tone="orange" />
                  <KpiCard title="Dimensión más crítica" value={data.kpis.dimension_mas_critica?.dimension_label ?? "—"} subtitle={`Promedio ${fmtNum(data.kpis.dimension_mas_critica?.promedio_transformado)}`} icon={Brain} tone="red" />
                  <KpiCard title="Próxima evaluación" value="12-24 meses" subtitle="Según nivel de riesgo final" icon={CalendarClock} tone="green" />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                  <Card className="border-slate-200 shadow-sm xl:col-span-4">
                    <CardHeader>
                      <CardTitle className="text-base">Distribución global por nivel</CardTitle>
                      <CardDescription>Consolidado visual de los totales oficiales.</CardDescription>
                    </CardHeader>
                    <CardContent><DonutGlobal data={data.distribucion_totales} /></CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm xl:col-span-4">
                    <CardHeader>
                      <CardTitle className="text-base">Top dimensiones críticas</CardTitle>
                      <CardDescription>Ordenadas por % Alto/Muy alto.</CardDescription>
                    </CardHeader>
                    <CardContent><RankingList items={data.ranking_dimensiones} /></CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm xl:col-span-4">
                    <CardHeader>
                      <CardTitle className="text-base">Mapa ejecutivo de dominios</CardTitle>
                      <CardDescription>Promedio y exposición por dominio intralaboral.</CardDescription>
                    </CardHeader>
                    <CardContent><DominioCards dominios={data.ranking_dominios} /></CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                  <Card className="border-slate-200 shadow-sm xl:col-span-8">
                    <CardHeader>
                      <CardTitle className="text-base">Distribución por instrumento</CardTitle>
                      <CardDescription>Barras apiladas por nivel de riesgo.</CardDescription>
                    </CardHeader>
                    <CardContent><DistributionBars data={data.distribucion_totales} /></CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm xl:col-span-4">
                    <CardHeader>
                      <CardTitle className="text-base">Alertas importantes</CardTitle>
                      <CardDescription>Eventos para revisión del psicólogo/SST.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!data.alertas.length ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mb-2 h-5 w-5" />Sin alertas críticas con los datos actuales.</div>
                      ) : data.alertas.map((a, i) => (
                        <div key={i} className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="mb-2 h-5 w-5" />{a.mensaje}</div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
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
                    <CardContent><DominioCards dominios={data.ranking_dominios} /></CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader><CardTitle>Top dimensiones críticas</CardTitle><CardDescription>Priorización para intervención.</CardDescription></CardHeader>
                    <CardContent><RankingList items={data.ranking_dimensiones} /></CardContent>
                  </Card>
                </div>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle>Tabla detallada de dimensiones</CardTitle><CardDescription>Base analítica para psicólogo evaluador y plan de acción.</CardDescription></CardHeader>
                  <CardContent><DimensionsTable items={data.dimensiones} /></CardContent>
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
                  <SocioChart title="Tipo de vivienda" items={data.sociodemografia?.variables?.tipo_vivienda} />
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
                  <CardDescription>Esta pestaña queda preparada para enlazar el listado individual y generación de PDF por empleado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState text="Siguiente subpaso: endpoint de participantes por aplicación + acceso a informe individual." />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
