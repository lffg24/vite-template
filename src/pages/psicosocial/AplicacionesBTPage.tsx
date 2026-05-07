// src/pages/psicosocial/AplicacionesBTPage.tsx
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Layers3,
  Loader2,
  Plus,
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
import { psicoAdminService, type AplicacionEmpresa, type EmpresaPsico } from "@/features/psicosocial/api/psicoAdminService";

type AplicacionBT = {
  id: number;
  empresaId: string;
  empresaNombre: string;
  nombre: string;
  servicio: string;
  instrumentos: string[];
  instrumentosLabel: string;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
  participantes: number;
  registrados: number;
  avance: number;
  creditos: number;
  createdAt?: string;
};

const PAGE_SIZES = [10, 25, 50, 100];

const instrumentLabels: Record<string, string> = {
  PSICO_INTRA_A: "Forma A",
  PSICO_INTRA_B: "Forma B",
  PSICO_EXTRA: "Extralaboral",
  PSICO_ESTRES: "Estrés",
};

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getNumber(source: any, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return fallback;
}

function buildInstrumentLabels(app: AplicacionEmpresa) {
  const evaluaciones = Array.isArray((app as any).evaluaciones) ? (app as any).evaluaciones : [];
  const codes = evaluaciones.map((ev: any) => ev.instrument_code || ev.instrumento || ev.codigo).filter(Boolean);
  const uniqueCodes = Array.from(new Set(codes));
  const labels = uniqueCodes.map((code) => instrumentLabels[String(code)] ?? String(code));
  return {
    codes: uniqueCodes.map(String),
    label: labels.length ? labels.join(" + ") : "Sin instrumentos visibles",
  };
}

type WorkflowState = "FINALIZADA" | "LISTA_CIERRE" | "ACTIVA" | "BORRADOR";

function workflowState(row: Pick<AplicacionBT, "estado" | "participantes" | "registrados" | "avance">): WorkflowState {
  const key = normalize(row.estado);
  if (key.includes("final") || key.includes("calcul")) return "FINALIZADA";
  if (row.participantes > 0 && row.avance >= 100) return "LISTA_CIERRE";
  if (row.registrados > 0 || row.avance > 0 || key.includes("activa") || key.includes("abierta") || key.includes("captura") || key.includes("progreso")) return "ACTIVA";
  return "BORRADOR";
}

function workflowLabel(row: Pick<AplicacionBT, "estado" | "participantes" | "registrados" | "avance">) {
  const state = workflowState(row);
  if (state === "FINALIZADA") return "Finalizada";
  if (state === "LISTA_CIERRE") return "Lista para cierre";
  if (state === "ACTIVA") return "Activa";
  return "Borrador";
}

function workflowClass(row: Pick<AplicacionBT, "estado" | "participantes" | "registrados" | "avance">) {
  const state = workflowState(row);
  if (state === "FINALIZADA") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (state === "LISTA_CIERRE") return "bg-orange-50 text-orange-700 ring-orange-200";
  if (state === "ACTIVA") return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-violet-50 text-violet-700 ring-violet-200";
}

function buildRows(empresas: EmpresaPsico[], appsByEmpresa: Map<string, AplicacionEmpresa[]>) {
  const rows: AplicacionBT[] = [];
  for (const empresa of empresas) {
    const apps = appsByEmpresa.get(empresa.id) ?? [];
    for (const app of apps) {
      const anyApp = app as any;
      const instrumentos = buildInstrumentLabels(app);
      const participantes = getNumber(anyApp, ["participantes", "total_participantes", "total_empleados", "empleados", "empleados_empresa"]);
      const registrados = getNumber(anyApp, ["registrados", "con_registro", "empleados_registrados", "participantes_registrados", "completados"], 0);
      const avance = participantes > 0 ? Math.min(100, Math.round((registrados / participantes) * 1000) / 10) : 0;
      rows.push({
        id: Number(anyApp.id),
        empresaId: empresa.id,
        empresaNombre: empresa.nombre,
        nombre: anyApp.nombre || `Aplicación #${anyApp.id}`,
        servicio: anyApp.servicio || anyApp.tipo || "Riesgo Psicosocial",
        instrumentos: instrumentos.codes,
        instrumentosLabel: instrumentos.label,
        estado: anyApp.estado || "Sin estado",
        fechaInicio: anyApp.fecha_aplicacion || anyApp.fecha_inicio || anyApp.created_at || anyApp.creado_en,
        fechaFin: anyApp.fecha_cierre || anyApp.fecha_fin,
        participantes,
        registrados,
        avance,
        creditos: getNumber(anyApp, ["creditos_consumidos", "creditos", "creditos_estimados"], registrados || participantes || 0),
        createdAt: anyApp.created_at || anyApp.creado_en,
      });
    }
  }
  return rows.sort((a, b) => b.id - a.id);
}

export default function AplicacionesBTPage() {
  const [rows, setRows] = useState<AplicacionBT[]>([]);
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
      const empresasResp = await psicoAdminService.listarEmpresas(true);
      const empresas = empresasResp.items ?? [];
      const appsByEmpresa = new Map<string, AplicacionEmpresa[]>();

      await Promise.all(
        empresas.map(async (empresa) => {
          try {
            const appsResp = await psicoAdminService.aplicacionesEmpresa(empresa.id);
            appsByEmpresa.set(empresa.id, appsResp.items ?? []);
          } catch {
            appsByEmpresa.set(empresa.id, []);
          }
        }),
      );

      setRows(buildRows(empresas, appsByEmpresa));
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las aplicaciones BT.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const empresasResp = await psicoAdminService.listarEmpresas(true);
        const empresas = empresasResp.items ?? [];
        const appsByEmpresa = new Map<string, AplicacionEmpresa[]>();
        await Promise.all(
          empresas.map(async (empresa) => {
            try {
              const appsResp = await psicoAdminService.aplicacionesEmpresa(empresa.id);
              appsByEmpresa.set(empresa.id, appsResp.items ?? []);
            } catch {
              appsByEmpresa.set(empresa.id, []);
            }
          }),
        );
        if (alive) setRows(buildRows(empresas, appsByEmpresa));
      } catch (err: any) {
        if (alive) setError(err?.message || "No se pudieron cargar las aplicaciones BT.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => setPage(1), [query, empresaFilter, instrumentFilter, statusFilter, pageSize]);

  const empresas = useMemo(() => Array.from(new Map(rows.map((row) => [row.empresaId, row.empresaNombre])).entries()), [rows]);
  const instruments = useMemo(() => Array.from(new Set(rows.flatMap((row) => row.instrumentos.map((code) => instrumentLabels[code] ?? code)))).sort(), [rows]);
  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => workflowLabel(row)))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return rows.filter((row) => {
      const instrumentNames = row.instrumentos.map((code) => instrumentLabels[code] ?? code);
      const matchesQuery = !q || [row.id, row.empresaNombre, row.nombre, row.servicio, row.instrumentosLabel, row.estado]
        .some((value) => normalize(value).includes(q));
      const matchesEmpresa = empresaFilter === "TODAS" || row.empresaId === empresaFilter;
      const matchesInstrument = instrumentFilter === "TODOS" || instrumentNames.includes(instrumentFilter);
      const matchesStatus = statusFilter === "TODOS" || workflowLabel(row) === statusFilter;
      return matchesQuery && matchesEmpresa && matchesInstrument && matchesStatus;
    });
  }, [rows, query, empresaFilter, instrumentFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const first = filtered.length ? (currentPage - 1) * pageSize + 1 : 0;
  const last = Math.min(currentPage * pageSize, filtered.length);

  const summary = useMemo(() => {
    const total = filtered.length;
    const finalizadas = filtered.filter((row) => workflowState(row) === "FINALIZADA").length;
    const listasCierre = filtered.filter((row) => workflowState(row) === "LISTA_CIERRE").length;
    const activas = filtered.filter((row) => workflowState(row) === "ACTIVA" || workflowState(row) === "LISTA_CIERRE").length;
    const captura = filtered.filter((row) => workflowState(row) === "ACTIVA" && row.avance < 100).length;
    const creditos = filtered.reduce((acc, row) => acc + (row.creditos || 0), 0);
    return { total, activas, captura, listasCierre, finalizadas, creditos };
  }, [filtered]);

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
              Consulta y gestiona todas las aplicaciones de batería psicosocial creadas en tus empresas asignadas, con filtros, avance, créditos y acceso directo al detalle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="h-11 min-w-[210px] rounded-xl bg-white shadow-sm">
                <Building2 className="mr-2 h-4 w-4 text-violet-700" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas mis empresas</SelectItem>
                {empresas.map(([id, nombre]) => <SelectItem key={id} value={id}>{nombre}</SelectItem>)}
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
          <MetricCard icon={Layers3} label="Total aplicaciones" value={summary.total} note="en tus empresas" accent="from-violet-600 to-indigo-500" progress={100} />
          <MetricCard icon={CheckCircle2} label="Activas" value={summary.activas} note={`${percent(summary.activas, summary.total)}% del total`} accent="from-emerald-500 to-teal-400" progress={percent(summary.activas, summary.total)} />
          <MetricCard icon={FileText} label="En captura" value={summary.captura} note={`${percent(summary.captura, summary.total)}% del total`} accent="from-blue-500 to-cyan-400" progress={percent(summary.captura, summary.total)} />
          <MetricCard icon={Clock3} label="Listas para cierre" value={summary.listasCierre} note={`${percent(summary.listasCierre, summary.total)}% del total`} accent="from-orange-500 to-amber-400" progress={percent(summary.listasCierre, summary.total)} />
          <MetricCard icon={ShieldCheck} label="Finalizadas" value={summary.finalizadas} note={`${percent(summary.finalizadas, summary.total)}% del total`} accent="from-violet-600 to-fuchsia-500" progress={percent(summary.finalizadas, summary.total)} />
          <MetricCard icon={WalletCards} label="Créditos consumidos" value={summary.creditos} note="estimados" accent="from-purple-500 to-violet-700" progress={100} />
        </section>

        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-4 border-b border-slate-100 p-5 lg:grid-cols-[1.45fr_0.95fr_0.95fr_0.95fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="h-12 rounded-xl border-slate-200 bg-white pl-11 shadow-sm" placeholder="Buscar aplicación, empresa, instrumento o ID..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue placeholder="Formulario" /></SelectTrigger>
                <SelectContent><SelectItem value="TODOS">Todos los formularios</SelectItem>{instruments.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent><SelectItem value="TODOS">Todos los estados</SelectItem>{statuses.map((estado) => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size} filas</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" className="h-12 rounded-xl bg-white shadow-sm" type="button">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full text-sm">
                <thead className="bg-slate-50/90 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Aplicación</th>
                    <th className="px-5 py-4">Empresa</th>
                    <th className="px-5 py-4">Servicio</th>
                    <th className="px-5 py-4">Formulario / instrumentos</th>
                    <th className="px-5 py-4">Participantes</th>
                    <th className="px-5 py-4">Registrados / avance</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-5 py-4">Créditos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr><td colSpan={9} className="px-5 py-16 text-center text-slate-500"><Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-violet-700" />Cargando aplicaciones BT...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-red-700">{error}</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-500">No hay aplicaciones para los filtros seleccionados.</td></tr>
                  ) : paginated.map((row) => (
                    <tr key={`${row.empresaId}-${row.id}`} className="transition hover:bg-violet-50/35">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                            <ClipboardIcon />
                          </div>
                          <div>
                            <Link
                              to={`/psicosocial/empresas/${row.empresaId}/aplicaciones/${row.id}`}
                              className="font-black text-slate-900 underline decoration-violet-300 underline-offset-4 transition hover:text-violet-700 hover:decoration-violet-700"
                            >
                              {row.nombre}
                            </Link>
                            <div className="text-xs text-slate-500">Aplicación #{row.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{row.empresaNombre}</td>
                      <td className="px-5 py-4 text-slate-600">{row.servicio}</td>
                      <td className="px-5 py-4 text-slate-700">{row.instrumentosLabel}</td>
                      <td className="px-5 py-4"><strong className="text-slate-950">{row.participantes}</strong><div className="text-xs text-slate-500">participantes</div></td>
                      <td className="px-5 py-4 min-w-[170px]">
                        <div className="mb-1 font-bold text-slate-800">{row.registrados} / {row.avance}%</div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-violet-700" style={{ width: `${row.avance}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${workflowClass(row)}`}>{workflowLabel(row)}</span></td>
                      <td className="px-5 py-4 text-slate-600"><CalendarDays className="mb-1 inline h-4 w-4 text-slate-400" /> {formatDate(row.fechaInicio)}{row.fechaFin ? <div className="text-xs text-slate-500">a {formatDate(row.fechaFin)}</div> : null}</td>
                      <td className="px-5 py-4"><strong>{row.creditos}</strong><div className="text-xs text-slate-500">créditos</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/80 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">Mostrando <strong>{first}</strong> a <strong>{last}</strong> de <strong>{filtered.length}</strong> aplicaciones</div>
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

        <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Card className="rounded-[1.75rem] border-violet-100 bg-gradient-to-br from-violet-50 to-white shadow-sm">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm"><Sparkles className="h-7 w-7" /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">¿Necesitas ayuda con tus aplicaciones?</h2>
                  <p className="text-sm text-slate-600">Usa esta vista para revisar avance, estado y entrada al detalle operativo por empresa.</p>
                </div>
              </div>
              <Button asChild className="rounded-xl bg-violet-700 hover:bg-violet-800"><Link to="/psicosocial/informes">Ir a informes</Link></Button>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="grid gap-4 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700"><WalletCards className="h-7 w-7" /></div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Créditos consumidos</h2>
                <p className="text-sm text-slate-600">Estimación consolidada sobre aplicaciones filtradas.</p>
              </div>
              <div className="text-right"><div className="text-3xl font-black text-slate-950">{summary.creditos}</div><div className="text-xs text-slate-500">créditos</div></div>
            </CardContent>
          </Card>
        </section>
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
          <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-violet-100`}>
            <Icon className="h-6 w-6" />
          </div>
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

function ClipboardIcon() {
  return <FileText className="h-5 w-5" />;
}
