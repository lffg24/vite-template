import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, FileBarChart, UserRound } from "lucide-react";

/**
 * Página wrapper alineada con tu estructura actual:
 * - ReportesPsico.tsx sigue en src/pages.
 * - El módulo nuevo vive en src/features/psicosocial.
 * - Esta página evita rutas en blanco mientras conectas el servicio real del perfil.
 */
export default function PsicoEmpleadoPerfilPage() {
  const { empleadoId } = useParams<{ empleadoId: string }>();
  const navigate = useNavigate();

  const displayId = useMemo(() => empleadoId ?? "sin-id", [empleadoId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-[1300px] space-y-5">
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Perfil del empleado</h1>
              <p className="text-sm text-slate-500">
                Vista psicosocial del colaborador. Empleado ID: <b>{displayId}</b>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/reportes/psico")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a reportes
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Información del colaborador</h2>
            <p className="mt-1 text-sm text-slate-500">
              Este wrapper confirma que la ruta funciona. Aquí debe conectarse el servicio real del perfil
              para traer nombre, cédula, área, cargo, información laboral y sociodemográfica.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoRow label="Empleado ID" value={displayId} />
              <InfoRow label="Estado" value="Pendiente de conectar API real" />
              <InfoRow label="Origen" value="/psicosocial/empleados/:empleadoId" />
              <InfoRow label="Uso" value="Consulta + acceso a respuestas/resultados" />
            </div>
          </section>

          <aside className="space-y-3">
            <button
              type="button"
              onClick={() => navigate(`/psicosocial/empleados/${displayId}/respuestas`)}
              className="flex w-full items-center gap-3 rounded-2xl bg-violet-600 p-4 text-left font-semibold text-white shadow-sm hover:bg-violet-700"
            >
              <ClipboardList className="h-5 w-5" />
              Registrar respuestas
            </button>

            <button
              type="button"
              onClick={() => navigate(`/psicosocial/empleados/${displayId}/resultados`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <FileBarChart className="h-5 w-5 text-violet-700" />
              Ver resultados individuales
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
