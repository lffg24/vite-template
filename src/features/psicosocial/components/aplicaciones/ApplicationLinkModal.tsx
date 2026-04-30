import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { PsicoAplicacionEmpleado } from '../../types/psicoEmpleado.types';

export function ApplicationLinkModal({
  open,
  loading,
  aplicaciones,
  onClose,
  onContinue,
  onGoAssign,
}: {
  open: boolean;
  loading?: boolean;
  aplicaciones: PsicoAplicacionEmpleado[];
  onClose: () => void;
  onContinue: (aplicacion: PsicoAplicacionEmpleado) => void;
  onGoAssign?: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Registro de respuestas</p>
            <h2 className="text-xl font-bold text-slate-950">Seleccionar aplicación psicosocial</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500">Consultando aplicaciones disponibles...</div>
          ) : aplicaciones.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <h3 className="font-bold text-amber-950">Sin aplicación disponible</h3>
                  <p className="mt-1 text-sm text-amber-800">El colaborador no tiene una aplicación psicosocial activa o vinculada. Para registrar respuestas, primero debes asignarlo a una batería.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {onGoAssign && <button onClick={onGoAssign} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700">Asignar a batería</button>}
                    <button onClick={onClose} className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100">Cerrar</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Este colaborador tiene aplicaciones disponibles. Selecciona la batería sobre la que deseas registrar o consultar respuestas.</p>
              {aplicaciones.map((app) => (
                <button key={app.aplicacion_id} onClick={() => onContinue(app)} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-violet-300 hover:bg-violet-50/40">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-bold text-slate-950">{app.nombre}</h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">#{app.aplicacion_id} · Estado: {app.estado || 'Sin estado'}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {app.evaluaciones.map((e) => (
                          <span key={e.evaluacion_id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {e.nombre} · {e.respondidas ?? 0}/{e.total_preguntas ?? 0}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white">Continuar</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
