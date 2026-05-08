// src/pages/psicosocial/AplicacionesBTPage.tsx
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Layers3,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  psicoAdminService,
  psicoAplicacionesBTService,
  type AplicacionBTServerItem,
  type EmpresaPsico,
} from "@/features/psicosocial/api/psicoAdminService";

type AplicacionBT = {
  id: number;
  empresaId: string;
  empresaNombre: string;
  nombre: string;
  servicio: string;
  instrumentos: string[];
  instrumentosLabel: string;
  estado: string;
  estadoLabel: string;
  fechaInicio?: string | null;
  participantes: number;
  registrados: number;
  avance: number;
  creditos: number;
  tieneResultados: boolean;
  puedeCerrar: boolean;
};

const PAGE_SIZES = [10, 25, 50, 100];

const instrumentLabels: Record<string, string> = {
  PSICO_INTRA_A: "Forma A",
  PSICO_INTRA_B: "Forma B",
  PSICO_EXTRA: "Extralaboral",
  PSICO_ESTRES: "Estrés",
};

const stateLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_CAPTURA: "En captura",
  CALCULANDO: "Calculando",
  FINALIZADA: "Finalizada",
  REABIERTA: "Reabierta",
  ERROR_CALCULO: "Error de cálculo",
};

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function buildInstrumentLabels(codes: string[] = []) {
  const unique = Array.from(new Set(codes.filter(Boolean).map(String)));
  const labels = unique.map((code) => instrumentLabels[code] ?? code);
  return { codes: unique, label: labels.length ? labels.join(" + ") : "Sin instrumentos visibles" };
}

function toRow(item: AplicacionBTServerItem): AplicacionBT {
  const instrumentosRaw = Array.isArray(item.instrumentos)
    ? item.instrumentos
    : Array.isArray(item.evaluaciones)
      ? item.evaluaciones.map((ev) => ev.instrument_code).filter(Boolean)
      : [];
  const instrumentos = buildInstrumentLabels(instrumentosRaw);
  const estado = String(item.estado || "BORRADOR").toUpperCase();
  const participantes = Number(item.participantes ?? 0);
  const registrados = Number(item.registrados ?? 0);
  const avance = Number(item.avance_porcentaje ?? (participantes > 0 ? Math.round((registrados / participantes) * 1000) / 10 : 0));

  return {
    id: Number(item.id),
    empresaId: String(item.empresa_id),
    empresaNombre: item.empresa_nombre || "Empresa sin nombre",
    nombre: item.nombre || `Aplicación #${item.id}`,
    servicio: "Riesgo Psicosocial",
    instrumentos: instrumentos.codes,
    instrumentosLabel: instrumentos.label,
    estado,
    estadoLabel: item.estado_label || stateLabels[estado] || estado,
    fechaInicio: item.fecha_aplicacion || item.created_at,
    participantes,
    registrados,
    avance,
    creditos: Number(item.creditos ?? Math.max(registrados, Number(item.participantes_con_scores ?? 0))),
    tieneResultados: Boolean(item.tiene_resultados),
    puedeCerrar: Boolean(item.puede_cerrar),
  };
}

function stateClass(state: string) {
  switch (state) {
    case "FINALIZADA":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "EN_CAPTURA":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "CALCULANDO":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "REABIERTA":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "ERROR_CALCULO":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

export default function AplicacionesBTPage() {
  const [rows, setRows] = useState<AplicacionBT[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaPsico[]>([]);
  const [serverCounters, setServerCounters] = useState<Record<string, number>>({});
  const [serverTotal, setServerTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("TODAS");
  const [instrumentFilter, setInstrumentFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [empresasResp, appsResp] = await Promise.all([
        psicoAdminService.listarEmpresas(true),
        psicoAplicacionesBTService.listar({
          page,
          pageSize,
          empresaId: empresaFilter,
          estado: statusFilter,
          instrumento: instrumentFilter,
          q: query,
        }),
      ]);
      setEmpresas(empresasResp.items ?? []);
      setRows((appsResp.items ?? []).map(toRow));
      setServerCounters(appsResp.counters ?? {});
      setServerTotal(Number(appsResp.total ?? 0));
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las aplicaciones BT.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, empresaFilter, instrumentFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      load();
    }, 360);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const instruments = useMemo(() => ["PSICO_INTRA_A", "PSICO_INTRA_B", "PSICO_EXTRA", "PSICO_ESTRES"], []);
  const totalPages = Math.max(1, Math.ceil(serverTotal / pageSize));
  const currentPage = Math.min(page, totalPages);
  const first = serverTotal ? (currentPage - 1) * pageSize + 1 : 0;
  const last = Math.min(currentPage * pageSize, serverTotal);

  const summary = useMemo(() => {
    return {
      total: Number(serverCounters.total ?? serverTotal ?? 0),
      borrador: Number(serverCounters.borrador ?? 0),
      captura: Number(serverCounters.en_captura ?? 0),
      calculando: Number(serverCounters.calculando ?? 0),
      finalizadas: Number(serverCounters.finalizada ?? 0),
      reabiertas: Number(serverCounters.reabierta ?? 0),
      errores: Number(serverCounters.error_calculo ?? 0),
      creditos: Number(serverCounters.creditos_consumidos ?? rows.reduce((acc, row) => acc + row.creditos, 0)),
    };
  }, [serverCounters, serverTotal, rows]);

  const pageNumbers = useMemo(() => {
    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-[#f7f9ff] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1540px] space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-violet-700">
              <Layers3 className="h-4 w-4" /> Aplicaciones BT
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">Aplicaciones BT</h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Estado oficial de las aplicaciones de batería psicosocial. Los estados vienen del backend y las métricas de avance son derivadas, no quemadas en la pantalla.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={empresaFilter} onValueChange={(v) => { setEmpresaFilter(v); setPage(1); }}>
              <SelectTrigger className="h-11 min-w-[230px] rounded-xl bg-white shadow-sm">
                <Building2 className="mr-2 h-4 w-4 text-violet-700" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas mis empresas</SelectItem>
                {empresas.map((empresa) => <SelectItem key={empresa.id} value={empresa.id}>{empresa.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-11 rounded-xl bg-white shadow-sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TimerReset className="mr-2 h-4 w-4" />} Actualizar
            </Button>
            <Button asChild className="h-11 rounded-xl bg-violet-700 px-5 font-bold shadow-lg shadow-violet-200 hover:bg-violet-800">
              <Link to="/psicosocial/empresas"><Plus className="mr-2 h-4 w-4" /> Nueva aplicación</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard icon={Layers3} label="Total" value={summary.total} note="aplicaciones" accent="from-violet-600 to-indigo-500" progress={100} />
          <MetricCard icon={FileText} label="En captura" value={summary.captura} note={`${percent(summary.captura, summary.total)}% del total`} accent="from-blue-500 to-cyan-400" progress={percent(summary.captura, summary.total)} />
          <MetricCard icon={ShieldCheck} label="Finalizadas" value={summary.finalizadas} note={`${percent(summary.finalizadas, summary.total)}% del total`} accent="from-emerald-500 to-teal-400" progress={percent(summary.finalizadas, summary.total)} />
          <MetricCard icon={RotateCcw} label="Reabiertas" value={summary.reabiertas} note={`${percent(summary.reabiertas, summary.total)}% del total`} accent="from-amber-500 to-orange-400" progress={percent(summary.reabiertas, summary.total)} />
          <MetricCard icon={AlertTriangle} label="Error cálculo" value={summary.errores} note={`${percent(summary.errores, summary.total)}% del total`} accent="from-red-500 to-rose-400" progress={percent(summary.errores, summary.total)} />
          <MetricCard icon={WalletCards} label="Créditos" value={summary.creditos} note="consumidos" accent="from-purple-500 to-violet-700" progress={100} />
        </section>

        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-4 border-b border-slate-100 p-5 lg:grid-cols-[1.45fr_0.95fr_0.95fr_0.95fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="h-12 rounded-xl border-slate-200 bg-white pl-11 shadow-sm" placeholder="Buscar aplicación, empresa o ID..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={instrumentFilter} onValueChange={(v) => { setInstrumentFilter(v); setPage(1); }}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue placeholder="Formulario" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los formularios</SelectItem>
                  {instruments.map((code) => <SelectItem key={code} value={code}>{instrumentLabels[code] ?? code}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="EN_CAPTURA">En captura</SelectItem>
                  <SelectItem value="CALCULANDO">Calculando</SelectItem>
                  <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                  <SelectItem value="REABIERTA">Reabierta</SelectItem>
                  <SelectItem value="ERROR_CALCULO">Error de cálculo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size} filas</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" className="h-12 rounded-xl bg-white shadow-sm" type="button">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-slate-50/90 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Aplicación</th>
                    <th className="px-5 py-4">Empresa</th>
                    <th className="px-5 py-4">Instrumentos</th>
                    <th className="px-5 py-4">Participantes</th>
                    <th className="px-5 py-4">Registrados / avance</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-5 py-4">Créditos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr><td colSpan={8} className="px-5 py-16 text-center text-slate-500"><Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-violet-700" />Cargando aplicaciones BT...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-red-700">{error}</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">No hay aplicaciones para los filtros seleccionados.</td></tr>
                  ) : rows.map((row) => (
                    <tr key={`${row.empresaId}-${row.id}`} className="transition hover:bg-violet-50/35">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100"><FileText className="h-5 w-5" /></div>
                          <div>
                            <Link to={`/psicosocial/empresas/${row.empresaId}/aplicaciones/${row.id}`} className="font-black text-slate-900 underline decoration-violet-300 underline-offset-4 transition hover:text-violet-700 hover:decoration-violet-700">
                              {row.nombre}
                            </Link>
                            <div className="text-xs text-slate-500">Aplicación #{row.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{row.empresaNombre}</td>
                      <td className="px-5 py-4 text-slate-700">{row.instrumentosLabel}</td>
                      <td className="px-5 py-4"><strong className="text-slate-950">{row.participantes}</strong><div className="text-xs text-slate-500">participantes</div></td>
                      <td className="px-5 py-4 min-w-[170px]">
                        <div className="mb-1 font-bold text-slate-800">{row.registrados} / {row.avance}%</div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-violet-700" style={{ width: `${Math.max(0, Math.min(100, row.avance))}%` }} /></div>
                      </td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${stateClass(row.estado)}`}>{row.estadoLabel}</span></td>
                      <td className="px-5 py-4 text-slate-600"><CalendarDays className="mb-1 inline h-4 w-4 text-slate-400" /> {formatDate(row.fechaInicio)}</td>
                      <td className="px-5 py-4"><strong>{row.creditos}</strong><div className="text-xs text-slate-500">créditos</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/80 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">Mostrando <strong>{first}</strong> a <strong>{last}</strong> de <strong>{serverTotal}</strong> aplicaciones</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" className="rounded-xl bg-white" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ArrowLeft className="h-4 w-4" /></Button>
                {pageNumbers.map((p, index) => (
                  <div key={p} className="flex items-center gap-2">
                    {index > 0 && p - pageNumbers[index - 1] > 1 ? <span className="px-1 text-slate-400">...</span> : null}
                    <Button variant={p === currentPage ? "default" : "outline"} size="sm" className={`h-10 w-10 rounded-xl ${p === currentPage ? "bg-violet-700 hover:bg-violet-800" : "bg-white"}`} onClick={() => setPage(p)}>{p}</Button>
                  </div>
                ))}
                <Button variant="outline" size="icon" className="rounded-xl bg-white" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm"><Sparkles className="h-7 w-7" /></div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Estados oficiales centralizados</h2>
                <p className="text-sm text-slate-600">BORRADOR, EN_CAPTURA, CALCULANDO, FINALIZADA, REABIERTA y ERROR_CALCULO. El frontend no decide el estado oficial.</p>
              </div>
            </div>
            <Button asChild className="rounded-xl bg-violet-700 hover:bg-violet-800"><Link to="/psicosocial/informes">Ir a informes</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

type MetricCardProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note: string;
  accent: string;
  progress: number;
};

function MetricCard({ icon: Icon, label, value, note, accent, progress }: MetricCardProps) {
  return (
    <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-violet-100`}><Icon className="h-6 w-6" /></div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-slate-500">{note}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}
