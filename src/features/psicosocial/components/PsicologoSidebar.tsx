// src/features/psicosocial/components/PsicologoSidebar.tsx
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  ClipboardEdit,
  FileText,
  HelpCircle,
  Home,
  Layers3,
  LogOut,
  PieChart,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { usePsicoEmpresaActiva } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";

const items = [
  { label: "Dashboard", to: "/psicosocial/dashboard", icon: Home },
  { label: "Empresas", to: "/psicosocial/empresas", icon: Building2 },
  { label: "Aplicaciones", to: "/psicosocial/aplicaciones", icon: Layers3 },
  { label: "Evaluaciones", to: "/psicosocial/evaluaciones", icon: ClipboardCheck },
  { label: "Participantes", to: "/psicosocial/participantes", icon: Users },
  { label: "Captura de respuestas", to: "/psicosocial/captura", icon: ClipboardEdit, badge: "Pendientes" },
  { label: "Resultados", to: "/reportes/psico", icon: BarChart3 },
  { label: "Informes", to: "/psicosocial/informes", icon: FileText },
  { label: "Seguimiento", to: "/psicosocial/seguimiento", icon: Target, badge: "Críticos" },
  { label: "Reportes", to: "/psicosocial/reportes", icon: PieChart },
  { label: "Configuración", to: "/psicosocial/perfil", icon: Settings },
  { label: "Ayuda", to: "/ayuda", icon: HelpCircle },
];

export default function PsicologoSidebar() {
  const { empresas, empresaActiva, empresaActivaId, cambiarEmpresa, loading } = usePsicoEmpresaActiva();

  return (
    <aside className="min-h-screen w-[292px] shrink-0 bg-[#071329] text-white shadow-2xl">
      <div className="flex h-full flex-col p-5">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-xl font-black">E</div>
          <div>
            <div className="text-2xl font-black tracking-tight">EVA-360</div>
            <div className="text-xs text-slate-400">Riesgo psicosocial</div>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-violet-600 font-bold">PS</div>
          <div className="min-w-0">
            <div className="truncate font-bold">Psicólogo evaluador</div>
            <div className="truncate text-sm text-violet-200">Perfil multiempresa</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Empresa activa</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-[#111d35] px-3 py-3 text-sm font-semibold text-white outline-none focus:border-violet-400"
            value={empresaActivaId ?? ""}
            onChange={(e) => cambiarEmpresa(e.target.value)}
            disabled={loading || empresas.length === 0}
          >
            {empresas.length === 0 ? (
              <option value="">Sin empresas asignadas</option>
            ) : (
              empresas.map((empresa) => (
                <option key={empresa.empresa_id} value={empresa.empresa_id}>
                  {empresa.nombre}
                </option>
              ))
            )}
          </select>
          {empresaActiva && <div className="mt-2 truncate text-xs text-slate-400">{empresaActiva.nit ?? "Sin NIT"}</div>}
        </div>

        <nav className="flex-1 space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                      : "text-slate-300 hover:bg-white/8 hover:text-white",
                  ].join(" ")
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-bold uppercase text-violet-300">Acciones rápidas</div>
          <NavLink to="/psicosocial/aplicaciones/nueva" className="mt-3 block rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10">
            + Crear aplicación
          </NavLink>
          <NavLink to="/psicosocial/captura" className="mt-2 block rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10">
            Registrar respuestas
          </NavLink>
        </div>

        <NavLink to="/logout" className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/8">
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </NavLink>
      </div>
    </aside>
  );
}
