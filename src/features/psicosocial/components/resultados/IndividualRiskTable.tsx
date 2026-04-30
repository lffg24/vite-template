import type { PsicoEmpleadoResultados } from '../../types/psicoEmpleado.types';

export function IndividualRiskTable({ resultados }: { resultados: PsicoEmpleadoResultados }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Resultados por dimensión</h2>
          <p className="text-sm text-slate-500">Lectura normativa con puntaje transformado y nivel de riesgo.</p>
        </div>
        <span className="text-sm font-semibold text-slate-500">{resultados.dimensiones.length} dimensiones</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Dimensión</th>
              <th className="px-4 py-3">Dominio</th>
              <th className="px-4 py-3">Instrumento</th>
              <th className="px-4 py-3 text-right">Puntaje 0-100</th>
              <th className="px-4 py-3 text-right">Nivel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resultados.dimensiones.map((d) => (
              <tr key={`${d.evaluacion_id}-${d.dimension_code}`} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-900">{d.dimension}</td>
                <td className="px-4 py-3 text-slate-600">{d.dominio || 'Sin dominio'}</td>
                <td className="px-4 py-3 text-slate-600">{d.instrument_code}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-950">{formatNumber(d.puntaje_transformado)}</td>
                <td className="px-4 py-3 text-right"><RiskBadge value={d.nivel_riesgo} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RiskBadge({ value }: { value?: string | null }) {
  const label = value || 'Sin nivel';
  const normalized = label.toLowerCase();
  const cls = normalized.includes('muy_alto') || normalized.includes('muy alto')
    ? 'bg-red-50 text-red-700 border-red-200'
    : normalized.includes('alto')
      ? 'bg-orange-50 text-orange-700 border-orange-200'
      : normalized.includes('medio')
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : normalized.includes('bajo')
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-50 text-slate-600 border-slate-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{label.replaceAll('_', ' ')}</span>;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(Number(value));
}
