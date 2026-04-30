import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Loader2, ShieldAlert } from "lucide-react";

import { obtenerPerfilPsicoEmpleado, type PsicoAplicacionEmpleado } from "@/features/psicosocial/api/psicoEmpleadoService";

export default function PsicoEmpleadoRespuestasPage() {
  const { empleadoId, aplicacionId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<PsicoAplicacionEmpleado | null>(null);
  const [nombre, setNombre] = useState("Colaborador");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!empleadoId || !aplicacionId) return;
      setLoading(true);
      try {
        const perfil = await obtenerPerfilPsicoEmpleado(empleadoId);
        const selected = (perfil.aplicaciones || []).find((a) => String(a.aplicacion_id) === String(aplicacionId)) || null;
        if (mounted) {
          setNombre(perfil.nombre_completo || `Colaborador ${String(perfil.cedula || empleadoId).slice(-4)} Demo`);
          setApp(selected);
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "No fue posible cargar la aplicación.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [empleadoId, aplicacionId]);

  if (loading) return <div className="p-6 text-slate-500"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" /> Cargando registro...</div>;

  return (
    <main className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
      <button type="button" onClick={() => navigate(`/psicosocial/empleados/${empleadoId}`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50">
        <ArrowLeft className="h-4 w-4" /> Volver al perfil
      </button>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-violet-600">Registro de respuestas</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">{app?.nombre || "Aplicación psicosocial"}</h1>
            <p className="mt-1 text-slate-500">Colaborador: <b>{nombre}</b></p>
          </div>
          <ClipboardList className="h-12 w-12 text-violet-600" />
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      {!app ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No se encontró esta aplicación para el colaborador.</div>
      ) : app.bateria_completa ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <ShieldAlert className="mb-2 h-6 w-6" />
          Esta batería ya está completa/calculada para el colaborador. No se permite registrar nuevamente las mismas evaluaciones. Puedes verla en resultados individuales.
        </div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Evaluaciones pendientes o editables</h2>
          <p className="mt-1 text-sm text-slate-500">Esta pantalla queda lista para conectar la captura pregunta a pregunta. Por ahora valida qué instrumento corresponde continuar sin duplicar los ya calculados.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {app.evaluaciones.map((ev) => (
              <div key={`ev-${ev.evaluacion_id}`} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-black text-slate-950">{ev.label || ev.instrument_code}</p>
                <p className="mt-1 text-sm text-slate-500">{ev.respondidas}/{ev.total_preguntas} respuestas</p>
                <p className="mt-2 text-xs font-black uppercase text-slate-500">{ev.estado_respuestas}</p>
                <button disabled={!ev.editable} className="mt-4 w-full rounded-xl bg-violet-700 px-3 py-2 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-500">
                  {ev.editable ? "Continuar instrumento" : "Ya calculada"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
