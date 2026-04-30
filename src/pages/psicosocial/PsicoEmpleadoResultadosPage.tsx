import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  ShieldAlert,
  Target,
  UserRound,
} from "lucide-react";

type RiskKey = "SIN_RIESGO" | "MUY_BAJO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO" | string;

type ScoreRow = {
  evaluacion_id?: number;
  instrument_code?: string;
  instrumento_nombre?: string;
  total_code?: string;
  dominio_code?: string;
  dominio_nombre?: string;
  dimension_code?: string;
  dimension_nombre?: string;
  puntaje_bruto?: number | null;
  puntaje_transformado?: number | null;
  nivel_riesgo?: string | null;
  nivel_riesgo_key?: RiskKey | null;
  nivel_riesgo_label?: string | null;
};

type RespuestaRow = {
  evaluacion_id?: number;
  instrument_code?: string;
  instrumento_nombre?: string;
  pregunta_id?: number;
  pregunta_orden?: number | null;
  pregunta_texto?: string | null;
  dominio_code?: string | null;
  dominio_nombre?: string | null;
  dimension_code?: string | null;
  dimension_nombre?: string | null;
  valor_text?: string | null;
  valor_num?: number | null;
  respondida_en?: string | null;
  computada_en?: string | null;
};

type ResultadoIndividual = {
  ok?: boolean;
  empleado?: {
    id?: number;
    cedula?: string;
    nombre_completo?: string;
    cargo?: string;
    area?: string;
  };
  aplicacion?: {
    id?: number;
    nombre?: string;
    estado?: string;
    fecha_aplicacion?: string | null;
    created_at?: string | null;
  };
  resumen?: {
    estado_calculo?: string;
    riesgo_mas_alto?: string;
    riesgo_mas_alto_key?: RiskKey | null;
    puntaje_mayor?: number | null;
    dominio_critico?: ScoreRow | null;
    dimension_critica?: ScoreRow | null;
    total_instrumentos_calculados?: number;
    total_dominios_calculados?: number;
    total_dimensiones_calculadas?: number;
    niveles_totales?: Record<string, number>;
  };
  totales?: ScoreRow[];
  dominios?: ScoreRow[];
  dimensiones?: ScoreRow[];
  respuestas?: RespuestaRow[];
  fuente_normativa?: string[];

  // Compatibilidad con endpoint anterior
  totals?: ScoreRow[];
  total?: ScoreRow[];
  result?: {
    totals?: ScoreRow[];
    totales?: ScoreRow[];
    dominios?: ScoreRow[];
    dimensiones?: ScoreRow[];
  };
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const riskRank: Record<string, number> = {
  SIN_RIESGO: 0,
  MUY_BAJO: 1,
  BAJO: 2,
  MEDIO: 3,
  ALTO: 4,
  MUY_ALTO: 5,
};

const riskLabel: Record<string, string> = {
  SIN_RIESGO: "Sin riesgo",
  MUY_BAJO: "Muy bajo",
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
  MUY_ALTO: "Muy alto",
};

const riskBadgeClass: Record<string, string> = {
  SIN_RIESGO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MUY_BAJO: "bg-green-50 text-green-700 border-green-200",
  BAJO: "bg-lime-50 text-lime-700 border-lime-200",
  MEDIO: "bg-amber-50 text-amber-700 border-amber-200",
  ALTO: "bg-orange-50 text-orange-700 border-orange-200",
  MUY_ALTO: "bg-red-50 text-red-700 border-red-200",
  SIN_NIVEL: "bg-slate-50 text-slate-600 border-slate-200",
};

function normalizeRisk(value?: string | null): string {
  if (!value) return "SIN_NIVEL";
  const key = String(value).trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (key === "MUYALTO") return "MUY_ALTO";
  if (key === "MUYBAJO") return "MUY_BAJO";
  if (key === "SINRIESGO") return "SIN_RIESGO";
  return key;
}

function labelRisk(value?: string | null): string {
  const key = normalizeRisk(value);
  return riskLabel[key] || (key === "SIN_NIVEL" ? "Sin nivel" : key.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase()));
}

function riskClass(value?: string | null): string {
  return riskBadgeClass[normalizeRisk(value)] || riskBadgeClass.SIN_NIVEL;
}

function fmtNumber(value?: number | null, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("es-CO", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

function prettyCode(code?: string | null): string {
  if (!code) return "Sin código";
  const text = code.replace(/_/g, " ").toLowerCase();
  return text.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token") || "";
  const empresaId = localStorage.getItem("empresa_id") || localStorage.getItem("X-Empresa-Id") || "46fa152f-cafc-4a1a-bee8-3831403ae1db";
  return {
    "Content-Type": "application/json",
    "X-Empresa-Id": empresaId,
    ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
  };
}

function normalizeRows(data: ResultadoIndividual | null, key: "totales" | "dominios" | "dimensiones"): ScoreRow[] {
  if (!data) return [];
  const direct = data[key];
  const nested = data.result?.[key];
  if (Array.isArray(direct)) return direct;
  if (Array.isArray(nested)) return nested;
  if (key === "totales") {
    if (Array.isArray(data.totals)) return data.totals;
    if (Array.isArray(data.total)) return data.total;
    if (Array.isArray(data.result?.totals)) return data.result?.totals || [];
  }
  return [];
}

function getCritical(rows: ScoreRow[]): ScoreRow | null {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => {
    const rb = riskRank[normalizeRisk(b.nivel_riesgo_key || b.nivel_riesgo)] ?? -1;
    const ra = riskRank[normalizeRisk(a.nivel_riesgo_key || a.nivel_riesgo)] ?? -1;
    if (rb !== ra) return rb - ra;
    return Number(b.puntaje_transformado || 0) - Number(a.puntaje_transformado || 0);
  })[0];
}

function RiskBadge({ value }: { value?: string | null }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${riskClass(value)}`}>
      {labelRisk(value)}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof ShieldAlert;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 break-words text-2xl font-black text-slate-950">{value}</p>
          {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ScoreTable({ rows, mode }: { rows: ScoreRow[]; mode: "totales" | "dominios" | "dimensiones" }) {
  const [sortKey, setSortKey] = useState<"riesgo" | "puntaje" | "nombre">("riesgo");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortKey === "puntaje") return Number(b.puntaje_transformado || 0) - Number(a.puntaje_transformado || 0);
      if (sortKey === "nombre") {
        const an = mode === "dimensiones" ? a.dimension_nombre || a.dimension_code : mode === "dominios" ? a.dominio_nombre || a.dominio_code : a.instrumento_nombre || a.instrument_code;
        const bn = mode === "dimensiones" ? b.dimension_nombre || b.dimension_code : mode === "dominios" ? b.dominio_nombre || b.dominio_code : b.instrumento_nombre || b.instrument_code;
        return String(an || "").localeCompare(String(bn || ""));
      }
      const rb = riskRank[normalizeRisk(b.nivel_riesgo_key || b.nivel_riesgo)] ?? -1;
      const ra = riskRank[normalizeRisk(a.nivel_riesgo_key || a.nivel_riesgo)] ?? -1;
      if (rb !== ra) return rb - ra;
      return Number(b.puntaje_transformado || 0) - Number(a.puntaje_transformado || 0);
    });
  }, [rows, sortKey, mode]);

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
        No hay registros calculados para esta sección.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-700">{rows.length} registros</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Ordenar por</span>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700"
          >
            <option value="riesgo">criticidad</option>
            <option value="puntaje">puntaje</option>
            <option value="nombre">nombre</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{mode === "totales" ? "Instrumento" : mode === "dominios" ? "Dominio" : "Dimensión"}</th>
              {mode === "dimensiones" ? <th className="px-4 py-3">Dominio</th> : null}
              <th className="px-4 py-3">Instrumento</th>
              <th className="px-4 py-3">Puntaje bruto</th>
              <th className="px-4 py-3">Transformado</th>
              <th className="px-4 py-3">Nivel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row, index) => {
              const title =
                mode === "totales"
                  ? row.instrumento_nombre || prettyCode(row.instrument_code)
                  : mode === "dominios"
                    ? row.dominio_nombre || prettyCode(row.dominio_code)
                    : row.dimension_nombre || prettyCode(row.dimension_code);
              return (
                <tr key={`${mode}-${row.evaluacion_id || "x"}-${row.instrument_code || "inst"}-${row.total_code || row.dominio_code || row.dimension_code || index}`} className="hover:bg-slate-50">
                  <td className="max-w-md px-4 py-4 font-bold text-slate-950">{title}</td>
                  {mode === "dimensiones" ? <td className="px-4 py-4 text-slate-600">{row.dominio_nombre || prettyCode(row.dominio_code)}</td> : null}
                  <td className="px-4 py-4 text-slate-600">{row.instrumento_nombre || prettyCode(row.instrument_code)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{fmtNumber(row.puntaje_bruto)}</td>
                  <td className="px-4 py-4 font-black text-slate-950">{fmtNumber(row.puntaje_transformado)}</td>
                  <td className="px-4 py-4"><RiskBadge value={row.nivel_riesgo_key || row.nivel_riesgo} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RespuestasTable({ rows }: { rows: RespuestaRow[] }) {
  const [instrumento, setInstrumento] = useState("TODOS");
  const [dimension, setDimension] = useState("TODAS");
  const [query, setQuery] = useState("");

  const instrumentos = useMemo(
    () => Array.from(new Set(rows.map((r) => r.instrumento_nombre || prettyCode(r.instrument_code)).filter(Boolean))).sort(),
    [rows],
  );
  const dimensiones = useMemo(
    () => Array.from(new Set(rows.map((r) => r.dimension_nombre || prettyCode(r.dimension_code)).filter(Boolean))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const inst = r.instrumento_nombre || prettyCode(r.instrument_code);
      const dim = r.dimension_nombre || prettyCode(r.dimension_code);
      if (instrumento !== "TODOS" && inst !== instrumento) return false;
      if (dimension !== "TODAS" && dim !== dimension) return false;
      if (!q) return true;
      return [r.pregunta_texto, r.valor_text, inst, dim, r.pregunta_orden]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [rows, instrumento, dimension, query]);

  const conteo = useMemo(() => {
    const out: Record<string, number> = {};
    filtered.forEach((r) => {
      const key = String(r.valor_text || "Sin respuesta").trim() || "Sin respuesta";
      out[key] = (out[key] || 0) + 1;
    });
    return out;
  }, [filtered]);

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
        No hay respuestas registradas para esta aplicación y colaborador.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pregunta, respuesta o dimensión..."
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200 md:col-span-2"
        />
        <select value={instrumento} onChange={(event) => setInstrumento(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <option value="TODOS">Todos los instrumentos</option>
          {instrumentos.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={dimension} onChange={(event) => setDimension(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <option value="TODAS">Todas las dimensiones</option>
          {dimensiones.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"].map((label) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{conteo[label] || 0}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-700">{filtered.length} respuestas visibles de {rows.length}</p>
          <p className="text-xs text-slate-500">Trazabilidad descriptiva; la interpretación oficial sigue en el detalle normativo.</p>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-[1120px] w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Ítem</th>
                <th className="px-4 py-3">Instrumento</th>
                <th className="px-4 py-3">Dimensión</th>
                <th className="px-4 py-3 text-center">Respuesta</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, index) => (
                <tr key={`${row.evaluacion_id || "e"}-${row.pregunta_id || index}`} className="hover:bg-slate-50/70">
                  <td className="max-w-[520px] px-4 py-3">
                    <div className="font-semibold text-slate-900">P{row.pregunta_orden ?? row.pregunta_id ?? index + 1}</div>
                    <div className="mt-1 leading-snug text-slate-600">{row.pregunta_texto || "Pregunta sin texto"}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.instrumento_nombre || prettyCode(row.instrument_code)}</td>
                  <td className="px-4 py-3 text-slate-600">{row.dimension_nombre || prettyCode(row.dimension_code)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">{row.valor_text || "Sin respuesta"}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-950">{fmtNumber(row.valor_num)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PsicoEmpleadoResultadosPage() {
  const { empleadoId, aplicacionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ResultadoIndividual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"totales" | "dominios" | "dimensiones">("totales");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!empleadoId || !aplicacionId) return;
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      const detalleUrl = `${API_URL}/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/resultados-detalle`;
      const legacyUrl = `${API_URL}/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/resultados`;

      try {
        let response = await fetch(detalleUrl, { headers });
        if (response.status === 404) {
          response = await fetch(legacyUrl, { headers });
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = (await response.json()) as ResultadoIndividual;
        if (alive) setData(json);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "No fue posible cargar resultados.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [empleadoId, aplicacionId]);

  const totales = normalizeRows(data, "totales");
  const dominios = normalizeRows(data, "dominios");
  const dimensiones = normalizeRows(data, "dimensiones");
  const respuestas = data?.respuestas || [];

  const dominioCritico = data?.resumen?.dominio_critico || getCritical(dominios);
  const dimensionCritica = data?.resumen?.dimension_critica || getCritical(dimensiones);
  const riesgoMayor = data?.resumen?.riesgo_mas_alto_key || data?.resumen?.riesgo_mas_alto || getCritical(totales)?.nivel_riesgo_key || getCritical(totales)?.nivel_riesgo;

  const activeRows = tab === "totales" ? totales : tab === "dominios" ? dominios : dimensiones;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase text-violet-700">Resultado individual</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Cargando resultados...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(`/psicosocial/empleados/${empleadoId}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al perfil
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/respuestas`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ClipboardList className="h-4 w-4" />
              Ver respuestas
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-800"
            >
              <Download className="h-4 w-4" />
              Preparar informe
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-5 w-5" />
              No fue posible cargar el resultado individual
            </div>
            <p className="mt-1 text-sm">{error}. Verifica que exista el endpoint de resultados-detalle o el endpoint legado de resultados.</p>
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-violet-100 text-2xl font-black text-violet-700">
                {(data?.empleado?.nombre_completo || "CO").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-violet-700">Resultado individual</p>
                <h1 className="mt-1 break-words text-3xl font-black text-slate-950 lg:text-4xl">
                  {data?.empleado?.nombre_completo || `Colaborador ${empleadoId}`}
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-violet-600" />CC {data?.empleado?.cedula || "Sin dato"}</span>
                  <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-violet-600" />{data?.empleado?.cargo || "Sin cargo"}</span>
                  <span>{data?.empleado?.area || "Sin área"}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Aplicación</p>
              <p className="mt-1 text-xl font-black text-slate-950">{data?.aplicacion?.nombre || `Aplicación #${aplicacionId}`}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>Estado: <strong>{data?.aplicacion?.estado || "Sin dato"}</strong></span>
                {riesgoMayor ? <RiskBadge value={String(riesgoMayor)} /> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={ShieldAlert} label="Riesgo más alto" value={labelRisk(String(riesgoMayor || "SIN_NIVEL"))} helper="Según mayor nivel entre totales, dominios y dimensiones" />
          <MetricCard icon={Target} label="Dominio crítico" value={dominioCritico?.dominio_nombre || prettyCode(dominioCritico?.dominio_code)} helper={dominioCritico ? `${labelRisk(dominioCritico.nivel_riesgo_key || dominioCritico.nivel_riesgo)} · ${fmtNumber(dominioCritico.puntaje_transformado)}` : "Sin dato"} />
          <MetricCard icon={Brain} label="Dimensión crítica" value={dimensionCritica?.dimension_nombre || prettyCode(dimensionCritica?.dimension_code)} helper={dimensionCritica ? `${labelRisk(dimensionCritica.nivel_riesgo_key || dimensionCritica.nivel_riesgo)} · ${fmtNumber(dimensionCritica.puntaje_transformado)}` : "Sin dato"} />
          <MetricCard icon={CheckCircle2} label="Instrumentos calculados" value={`${totales.length}`} helper={`${dominios.length} dominios · ${dimensiones.length} dimensiones`} />
        </section>

        <section className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5">
          <div className="flex gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
            <div>
              <p className="font-black text-slate-950">Lectura normativa</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                La interpretación se basa en puntajes transformados de 0 a 100 y niveles de riesgo definidos por baremos oficiales para cada instrumento, dominio y dimensión. Esta vista resume el resultado individual; las respuestas textuales deben usarse como trazabilidad descriptiva, no como reemplazo del nivel normativo.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Detalle normativo</h2>
              <p className="text-sm text-slate-500">Totales, dominios y dimensiones calculadas para este colaborador.</p>
            </div>
            <div className="flex rounded-2xl bg-slate-100 p-1">
              {([
                ["totales", "Totales"],
                ["dominios", "Dominios"],
                ["dimensiones", "Dimensiones"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${tab === key ? "bg-violet-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ScoreTable rows={activeRows} mode={tab} />
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Respuestas registradas</h2>
              <p className="text-sm text-slate-500">Vista descriptiva de cómo respondió el colaborador por pregunta, instrumento y dimensión.</p>
            </div>
            <span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-black text-violet-700">
              {respuestas.length} respuestas
            </span>
          </div>
          <RespuestasTable rows={respuestas} />
        </section>

      </div>
    </main>
  );
}
