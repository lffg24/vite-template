// src/features/psicosocial/components/PsicologoSidebar.tsx
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardEdit,
  FileText,
  Home,
  Layers3,
  LogOut,
  PieChart,
  Plus,
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
  { label: "Captura", to: "/psicosocial/captura", icon: ClipboardEdit, badge: "Pend." },
  { label: "Resultados", to: "/psicosocial/resultados", icon: BarChart3 },
  { label: "Informes", to: "/psicosocial/informes", icon: FileText },
  { label: "Seguimiento", to: "/psicosocial/seguimiento", icon: Target, badge: "Crit." },
  { label: "Reportes", to: "/psicosocial/reportes", icon: PieChart },
  { label: "Configuración", to: "/psicosocial/perfil", icon: Settings },
];

const COLLAPSED_KEY = "eva360.psico.sidebar.collapsed";

export default function PsicologoSidebar() {
  const { empresas, empresaActiva, empresaActivaId, cambiarEmpresa, loading } = usePsicoEmpresaActiva();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1");

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const width = collapsed ? "w-[84px]" : "w-[292px]";
  const activeName = useMemo(() => empresaActiva?.nombre ?? "Sin empresas asignadas", [empresaActiva]);

  return (
    <aside className={`${width} min-h-screen shrink-0 bg-[#071329] text-white shadow-2xl transition-all duration-300`}>
      <div className="flex h-full flex-col p-4">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-600 text-xl font-black">E</div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-2xl font-black tracking-tight">EVA-360</div>
                <div className="truncate text-xs text-slate-400">Riesgo psicosocial</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`${collapsed ? "items-center justify-center p-2" : "gap-3 p-3"} mb-5 flex rounded-2xl border border-white/10 bg-white/5`}>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-600 font-bold">PS</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-bold">Psicólogo evaluador</div>
              <div className="truncate text-sm text-violet-200">Perfil multiempresa</div>
            </div>
          )}
        </div>

        <div className="mb-5">
          {!collapsed && <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Empresa activa</div>}
          {collapsed ? (
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-[#111d35] text-xs font-black text-violet-200"
              title={activeName}
            >
              {empresaActiva?.nombre?.slice(0, 2).toUpperCase() ?? "—"}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <nav className="flex-1 space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    "group flex items-center rounded-2xl text-sm font-semibold transition",
                    collapsed ? "justify-center px-0 py-3" : "justify-between px-4 py-3",
                    isActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!collapsed && item.badge && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-bold uppercase text-violet-300">Acciones rápidas</div>
            <NavLink to="/psicosocial/empresas" className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              <Plus className="h-4 w-4" /> Nueva empresa
            </NavLink>
            <NavLink to="/psicosocial/captura" className="mt-2 block rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              Registrar respuestas
            </NavLink>
          </div>
        )}

        <NavLink
          to="/logout"
          title={collapsed ? "Cerrar sesión" : undefined}
          className={`${collapsed ? "justify-center px-0" : "gap-3 px-4"} mt-5 flex items-center rounded-2xl py-3 text-sm font-semibold text-slate-300 hover:bg-white/10`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Cerrar sesión"}
        </NavLink>
      </div>
    </aside>
  );
}
