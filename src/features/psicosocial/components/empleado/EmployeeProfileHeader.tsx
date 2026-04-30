import { ArrowLeft, ClipboardCheck, FileText, Pencil, UserRound } from 'lucide-react';
import type { PsicoEmpleadoPerfil } from '../../types/psicoEmpleado.types';

export function EmployeeProfileHeader({ perfil, onBack, onRegister }: { perfil: PsicoEmpleadoPerfil; onBack?: () => void; onRegister: () => void }) {
  const initials = (perfil.nombre_completo || 'NA')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {onBack && (
            <button onClick={onBack} className="mt-1 rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Volver">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Riesgo Psicosocial</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Perfil del empleado</h1>
            <p className="mt-1 text-slate-500">Consulta y gestión de información sociodemográfica, laboral y resultados por aplicación.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Pencil className="h-4 w-4" /> Editar perfil
          </button>
          <button onClick={onRegister} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700">
            <ClipboardCheck className="h-4 w-4" /> Registrar respuestas
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-violet-100 text-2xl font-black text-violet-700">
              {initials || <UserRound className="h-10 w-10" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-slate-950 break-words">{perfil.nombre_completo}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniMetric label="Documento" value={perfil.cedula} icon={<FileText className="h-4 w-4" />} />
                <MiniMetric label="Cargo" value={perfil.cargo || 'Sin cargo'} />
                <MiniMetric label="Área" value={perfil.area || 'Sin área'} />
                <MiniMetric label="Empresa" value={perfil.empresa_id ? 'Empresa actual' : 'Sin empresa'} />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formulario sugerido</p>
              <p className="mt-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">{perfil.tipo_cargo?.toLowerCase().includes('oper') || perfil.tipo_cargo?.toLowerCase().includes('aux') ? 'Forma B' : 'Forma A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completitud perfil</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{Math.round(Number(perfil.completitud_perfil ?? 0))}%</p>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.max(0, Math.min(100, Number(perfil.completitud_perfil ?? 0)))}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-3 py-2">
      <p className="flex items-center gap-1 text-xs text-slate-500">{icon}{label}</p>
      <p className="truncate text-sm font-semibold text-slate-800" title={value}>{value}</p>
    </div>
  );
}
