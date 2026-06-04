import { useEffect, useState } from "react";
import { BrainCircuit, ChevronLeft, ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export type RoleSidebarItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

type RoleSidebarProps = {
  items: RoleSidebarItem[];
  storageKey: string;
  brandTitle?: string;
  brandSubtitle?: string;
  avatarText: string;
  userTitle: string;
  userSubtitle: string;
  navLabel: string;
  footerTitle?: string;
  footerLink?: string;
  footerLinkLabel?: string;
};

function isMenuActive(currentPath: string, targetPath: string) {
  if (targetPath.endsWith("/dashboard")) return currentPath === targetPath;
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export default function RoleSidebar({
  items,
  storageKey,
  brandTitle = "ABRIL-360",
  brandSubtitle,
  avatarText,
  userTitle,
  userSubtitle,
  navLabel,
  footerTitle = `© ${new Date().getFullYear()} REL Consilium SAS`,
  footerLink = "https://relconsilium.com/",
  footerLinkLabel = "relconsilium.com",
}: RoleSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(storageKey) === "1");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(storageKey, collapsed ? "1" : "0");
  }, [collapsed, storageKey]);

  const width = collapsed ? "w-[84px]" : "w-[292px]";

  return (
    <aside className={`${width} min-h-screen shrink-0 bg-[#071329] text-white shadow-2xl transition-all duration-300`}>
      <div className="flex h-full flex-col p-4">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white shadow-lg shadow-violet-950/30">
              <BrainCircuit className="h-7 w-7" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-2xl font-black tracking-tight">{brandTitle}</div>
                {brandSubtitle ? <div className="truncate text-xs text-slate-400">{brandSubtitle}</div> : null}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`${collapsed ? "items-center justify-center p-2" : "gap-3 p-3"} mb-5 flex rounded-2xl border border-white/10 bg-white/5`}>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-600 font-bold">{avatarText}</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-bold">{userTitle}</div>
              <div className="truncate text-sm text-violet-200">{userSubtitle}</div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5" aria-label={navLabel}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isMenuActive(location.pathname, item.to);
            return (
              <button
                key={item.to}
                type="button"
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (location.pathname !== item.to) navigate(item.to);
                }}
                className={[
                  "group flex w-full items-center rounded-2xl text-left text-sm font-semibold transition",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                  active
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
            <div>{footerTitle}</div>
            {footerLink ? (
              <a href={footerLink} target="_blank" rel="noreferrer" className="text-violet-200 hover:text-white">
                {footerLinkLabel}
              </a>
            ) : null}
          </div>
        )}

        <NavLink
          to="/logout"
          title={collapsed ? "Cerrar sesión" : undefined}
          className={`${collapsed ? "justify-center px-0" : "gap-3 px-4"} mt-4 flex items-center rounded-2xl py-3 text-sm font-semibold text-slate-300 hover:bg-white/10`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Cerrar sesión"}
        </NavLink>
      </div>
    </aside>
  );
}
