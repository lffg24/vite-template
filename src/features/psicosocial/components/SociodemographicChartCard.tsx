import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, CircleDot, Donut, ListChecks, PieChart as PieChartIcon } from "lucide-react";

export type SocioChartType = "bar" | "donut" | "pie" | "radial" | "table";

export type SociodemographicDatum = {
  label: string;
  cantidad?: number;
  count?: number;
  porcentaje?: number;
  percent?: number;
};

type NormalizedDatum = {
  label: string;
  cantidad: number;
  porcentaje: number;
};

type SociodemographicChartCardProps = {
  title: string;
  description?: string;
  data?: SociodemographicDatum[];
  defaultType?: SocioChartType;
  height?: number;
};

const CHART_TYPES: Array<{ value: SocioChartType; label: string; icon: React.ElementType }> = [
  { value: "bar", label: "Barras", icon: BarChart3 },
  { value: "donut", label: "Dona", icon: Donut },
  { value: "pie", label: "Torta", icon: PieChartIcon },
  { value: "radial", label: "Radial", icon: CircleDot },
  { value: "table", label: "Tabla", icon: ListChecks },
];

const PALETTE = ["#7c3aed", "#2563eb", "#059669", "#f59e0b", "#ef4444", "#0f766e", "#9333ea", "#ea580c", "#475569", "#0891b2"];

function normalizeSocioData(data?: SociodemographicDatum[]): NormalizedDatum[] {
  const raw = Array.isArray(data) ? data : [];
  const rows = raw
    .map((item) => ({
      label: String(item.label ?? "Sin dato"),
      cantidad: Number(item.cantidad ?? item.count ?? 0),
      porcentaje: Number(item.porcentaje ?? item.percent ?? 0),
    }))
    .filter((item) => item.label && Number.isFinite(item.cantidad) && item.cantidad > 0);

  const total = rows.reduce((acc, item) => acc + item.cantidad, 0);
  if (!total) return [];

  return rows
    .map((item) => ({
      ...item,
      porcentaje: item.porcentaje > 0 ? item.porcentaje : Number(((item.cantidad * 100) / total).toFixed(1)),
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-slate-900">{row.label}</div>
      <div className="mt-1 text-slate-600">Cantidad: <b>{row.cantidad}</b></div>
      <div className="text-slate-600">Porcentaje: <b>{Number(row.porcentaje).toFixed(1)}%</b></div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
      No hay datos sociodemográficos disponibles para esta variable.
    </div>
  );
}

export function SociodemographicChartCard({
  title,
  description = "Distribución de la ficha de datos generales.",
  data,
  defaultType = "bar",
  height = 280,
}: SociodemographicChartCardProps) {
  const [chartType, setChartType] = useState<SocioChartType>(defaultType);
  const rows = useMemo(() => normalizeSocioData(data), [data]);
  const chartHeight = Math.max(height, Math.min(420, rows.length * 42 + 90));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-950" title={title}>{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {CHART_TYPES.map(({ value, label, icon: Icon }) => {
            const active = chartType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setChartType(value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  active ? "bg-white text-violet-700 shadow-sm" : "text-slate-600 hover:bg-white/70"
                }`}
                title={`Ver como ${label.toLowerCase()}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-5">
        {!rows.length ? (
          <EmptyState />
        ) : chartType === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Porcentaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{row.cantidad}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{row.porcentaje.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : chartType === "bar" ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 96 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="porcentaje" radius={[0, 8, 8, 0]}>
                {rows.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : chartType === "radial" ? (
          <ResponsiveContainer width="100%" height={height}>
            <RadialBarChart innerRadius="20%" outerRadius="90%" data={rows} startAngle={90} endAngle={-270}>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
              <RadialBar dataKey="porcentaje" background cornerRadius={12}>
                {rows.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} />
              <Pie
                data={rows}
                dataKey="cantidad"
                nameKey="label"
                innerRadius={chartType === "donut" ? 62 : 0}
                outerRadius={96}
                paddingAngle={chartType === "donut" ? 2 : 0}
                label={(entry) => `${entry.porcentaje.toFixed(1)}%`}
              >
                {rows.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export default SociodemographicChartCard;
