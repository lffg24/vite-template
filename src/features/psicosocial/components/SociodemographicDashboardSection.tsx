import { CircleCheck, Users } from "lucide-react";
import SociodemographicChartCard, { SociodemographicDatum } from "./SociodemographicChartCard";

type SocioVariable = {
  key: string;
  title: string;
  description?: string;
  data?: SociodemographicDatum[];
};

type SociodemographicDashboardSectionProps = {
  totalParticipantes?: number;
  completitudGenero?: number;
  completitudTipoCargo?: number;
  completitudEdad?: number;
  variables?: SocioVariable[];
};

function KpiCard({ title, value, tone = "violet" }: { title: string; value: string | number; tone?: "violet" | "emerald" | "sky" | "orange" }) {
  const toneClasses = {
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
  }[tone];
  const Icon = tone === "violet" ? Users : CircleCheck;

  return (
    <div className="min-h-[124px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`rounded-2xl border p-3 ${toneClasses}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500" title={title}>{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_VARIABLES: SocioVariable[] = [];

export function SociodemographicDashboardSection({
  totalParticipantes = 0,
  completitudGenero = 0,
  completitudTipoCargo = 0,
  completitudEdad = 0,
  variables = DEFAULT_VARIABLES,
}: SociodemographicDashboardSectionProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Perfil sociodemográfico</h2>
        <p className="mt-1 text-sm text-slate-500">
          Caracterización descriptiva de los participantes según la ficha de datos generales.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Participantes con scoring" value={totalParticipantes} tone="violet" />
          <KpiCard title="Completitud género" value={`${Number(completitudGenero).toFixed(1)}%`} tone="emerald" />
          <KpiCard title="Completitud tipo cargo" value={`${Number(completitudTipoCargo).toFixed(1)}%`} tone="sky" />
          <KpiCard title="Completitud edad" value={`${Number(completitudEdad).toFixed(1)}%`} tone="orange" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {variables.map((variable) => (
          <SociodemographicChartCard
            key={variable.key}
            title={variable.title}
            description={variable.description}
            data={variable.data}
            defaultType="pie"
          />
        ))}
      </section>
    </div>
  );
}

export default SociodemographicDashboardSection;
