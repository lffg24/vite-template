import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Save, ShieldCheck } from 'lucide-react';
import { psicoEmpleadoService } from '../../features/psicosocial/api/psicoEmpleadoService';
import type { PsicoAplicacionEmpleado, PsicoEmpleadoPerfil, PsicoPreguntaRespuesta } from '../../features/psicosocial/types/psicoEmpleado.types';

const OPTIONS = ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'];

export default function PsicoEmpleadoRespuestasPage() {
  const { empleadoId, aplicacionId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const evaluacionId = params.get('evaluacionId');
  const [perfil, setPerfil] = useState<PsicoEmpleadoPerfil | null>(null);
  const [apps, setApps] = useState<PsicoAplicacionEmpleado[]>([]);
  const [preguntas, setPreguntas] = useState<PsicoPreguntaRespuesta[]>([]);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!empleadoId || !aplicacionId) return;
    Promise.all([
      psicoEmpleadoService.perfil(empleadoId).then(setPerfil),
      psicoEmpleadoService.aplicaciones(empleadoId).then((r) => setApps(r.aplicaciones || [])),
    ]).catch(() => null);
  }, [empleadoId, aplicacionId]);

  const currentApp = useMemo(() => apps.find((a) => String(a.aplicacion_id) === String(aplicacionId)), [apps, aplicacionId]);
  const currentEvaluation = useMemo(() => currentApp?.evaluaciones?.find((e) => String(e.evaluacion_id) === String(evaluacionId)) || currentApp?.evaluaciones?.[0], [currentApp, evaluacionId]);

  useEffect(() => {
    if (!empleadoId || !currentEvaluation?.evaluacion_id) return;
    if (!evaluacionId) setParams({ evaluacionId: String(currentEvaluation.evaluacion_id) }, { replace: true });
    setLoading(true);
    psicoEmpleadoService.respuestas(empleadoId, currentEvaluation.evaluacion_id)
      .then((data) => {
        setPreguntas(data.preguntas || []);
        const next: Record<number, string | null> = {};
        for (const p of data.preguntas || []) next[p.pregunta_id] = p.respuesta ?? null;
        setAnswers(next);
      })
      .finally(() => setLoading(false));
  }, [empleadoId, currentEvaluation?.evaluacion_id]);

  const responded = Object.values(answers).filter(Boolean).length;
  const total = preguntas.length;
  const pct = total ? Math.round((responded / total) * 100) : 0;

  async function save(finalizar = false) {
    if (!empleadoId || !currentEvaluation?.evaluacion_id) return;
    setSaving(true);
    try {
      const payload = { respuestas: preguntas.map((p) => ({ pregunta_id: p.pregunta_id, orden: p.orden, respuesta: answers[p.pregunta_id] ?? null })), finalizar };
      const res = await psicoEmpleadoService.guardarRespuestas(empleadoId, currentEvaluation.evaluacion_id, payload);
      if (finalizar) await psicoEmpleadoService.finalizar(empleadoId, currentEvaluation.evaluacion_id);
      setMessage(finalizar ? 'Registro finalizado correctamente.' : `Borrador guardado. ${res.respondidas}/${res.total} respuestas.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button onClick={() => navigate(`/psicosocial/empleados/${empleadoId}`)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-5 w-5" /></button>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Registro de respuestas</p>
                <h1 className="text-3xl font-black text-slate-950">{perfil?.nombre_completo || 'Colaborador'}</h1>
                <p className="text-sm text-slate-500">CC {perfil?.cedula} · {perfil?.cargo || 'Sin cargo'} · {perfil?.area || 'Sin área'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={saving} onClick={() => save(false)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Save className="h-4 w-4" /> Guardar borrador</button>
              <button disabled={saving || pct < 100} onClick={() => save(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-700 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Finalizar registro</button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Metric label="Instrumento" value={currentEvaluation?.nombre || 'Sin evaluación'} />
            <Metric label="Total preguntas" value={total} />
            <Metric label="Respondidas" value={responded} />
            <Metric label="Avance" value={`${pct}%`} />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${pct}%` }} /></div>
          {message && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{message}</p>}
        </section>

        <div className="grid gap-5 lg:grid-cols-[260px_1fr_300px]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-bold text-slate-950">Instrumentos</h2>
            <div className="mt-3 space-y-2">
              {currentApp?.evaluaciones?.map((e) => (
                <button key={e.evaluacion_id} onClick={() => setParams({ evaluacionId: String(e.evaluacion_id) })} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${String(e.evaluacion_id) === String(currentEvaluation?.evaluacion_id) ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>{e.nombre}</button>
              ))}
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {loading ? <div className="p-10 text-center text-slate-500">Cargando preguntas...</div> : (
              <div className="space-y-3">
                {preguntas.map((p) => (
                  <div key={p.pregunta_id} className="rounded-2xl border border-slate-100 p-4 hover:border-violet-100">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-violet-600">Pregunta {p.orden} · {p.dimension || p.dimension_code || 'Sin dimensión'}</p>
                        <p className="mt-1 font-semibold text-slate-900">{p.texto}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {OPTIONS.map((op) => (
                          <button key={op} onClick={() => setAnswers((prev) => ({ ...prev, [p.pregunta_id]: op }))} className={`rounded-xl border px-3 py-2 text-xs font-bold ${answers[p.pregunta_id] === op ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{op}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Validación</h2>
              <p className="mt-2 text-sm text-slate-500">Pendientes por responder: <b className="text-slate-950">{Math.max(0, total - responded)}</b></p>
              <p className="mt-1 text-sm text-slate-500">Solo podrás finalizar cuando el instrumento esté completo.</p>
            </div>
            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5 text-sm text-violet-900">
              <ShieldCheck className="mb-2 h-5 w-5" />
              Registro confidencial. Digita las respuestas del formulario físico tal como fueron marcadas por el colaborador.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{String(value)}</p></div>;
}
