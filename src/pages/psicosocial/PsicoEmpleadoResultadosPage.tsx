import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { psicoEmpleadoService } from '../../features/psicosocial/api/psicoEmpleadoService';
import { IndividualRiskTable } from '../../features/psicosocial/components/resultados/IndividualRiskTable';
import type { PsicoEmpleadoPerfil, PsicoEmpleadoResultados } from '../../features/psicosocial/types/psicoEmpleado.types';

export default function PsicoEmpleadoResultadosPage() {
  const { empleadoId, aplicacionId } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PsicoEmpleadoPerfil | null>(null);
  const [resultados, setResultados] = useState<PsicoEmpleadoResultados | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalc, setRecalc] = useState(false);

  async function load() {
    if (!empleadoId || !aplicacionId) return;
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        psicoEmpleadoService.perfil(empleadoId),
        psicoEmpleadoService.resultados(empleadoId, aplicacionId),
      ]);
      setPerfil(p);
      setResultados(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [empleadoId, aplicacionId]);

  async function recalcular() {
    if (!empleadoId || !aplicacionId) return;
    setRecalc(true);
    try {
      await psicoEmpleadoService.recalcular(empleadoId, aplicacionId);
      await load();
    } finally {
      setRecalc(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="rounded-3xl border bg-white p-10 text-center text-slate-500">Cargando resultados...</div></main>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button onClick={() => navigate(`/psicosocial/empleados/${empleadoId}`)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-5 w-5" /></button>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Resultado individual</p>
                <h1 className="text-3xl font-black text-slate-950">{perfil?.nombre_completo || 'Colaborador'}</h1>
                <p className="text-sm text-slate-500">Lectura oficial desde puntajes transformados y baremos por instrumento.</p>
              </div>
            </div>
            <button disabled={recalc} onClick={recalcular} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-700 disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Recalcular</button>
          </div>
        </section>

        {resultados ? <IndividualRiskTable resultados={resultados} /> : <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 font-semibold text-amber-800">No hay resultados calculados para esta aplicación.</div>}
      </div>
    </main>
  );
}
