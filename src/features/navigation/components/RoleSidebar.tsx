import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import evaIsotipoWhite from "@/assets/eva-isotipo-white.png";
import AbrilWordmark from "@/components/brand/AbrilWordmark";

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
  brandTitle = "ABRIL360",
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

  const width = collapsed ? "w-[96px]" : "w-[292px]";

  return (
    <aside className={`${width} min-h-screen shrink-0 overflow-hidden bg-sidebar text-sidebar-foreground shadow-floating transition-all duration-standard`}>
      <div className="flex h-full flex-col p-4">
        <div className={`mb-6 ${collapsed ? "flex flex-col items-center gap-3" : "flex items-center justify-between gap-3"}`}>
          <div className={`min-w-0 ${collapsed ? "flex items-center justify-center" : "flex items-center gap-3"}`}>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sidebar-border bg-sidebar-hover p-2 shadow-card">
              <img src={evaIsotipoWhite} alt="" className="h-full w-full object-contain" aria-hidden="true" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                {brandTitle === "ABRIL360" || brandTitle === "ABRIL-360" ? (
                  <AbrilWordmark className="block truncate text-2xl font-black text-sidebar-foreground" accentClassName="text-brand-turquoise" />
                ) : (
                  <div className="truncate text-2xl font-black">{brandTitle}</div>
                )}
                {brandSubtitle ? <div className="truncate text-xs text-sidebar-muted">{brandSubtitle}</div> : null}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={`grid shrink-0 place-items-center rounded-xl border border-sidebar-border bg-sidebar-hover text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${collapsed ? "h-10 w-10" : "h-9 w-9"}`}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`${collapsed ? "items-center justify-center p-2" : "gap-3 p-3"} mb-5 flex rounded-2xl border border-sidebar-border bg-sidebar-hover`}>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sidebar-active font-heading font-bold text-sidebar-active-foreground">{avatarText}</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-heading font-semibold text-sidebar-foreground">{userTitle}</div>
              <div className="truncate text-sm text-sidebar-muted">{userSubtitle}</div>
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
                  "group flex w-full items-center rounded-2xl text-left text-sm font-semibold transition-colors duration-fast",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                  active
                    ? "bg-sidebar-active text-sidebar-active-foreground shadow-card"
                    : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-5 border-t border-sidebar-border pt-4 text-xs leading-5 text-sidebar-muted">
            <div>{footerTitle}</div>
            {footerLink ? (
              <a href={footerLink} target="_blank" rel="noreferrer" className="text-brand-turquoise hover:text-sidebar-foreground">
                {footerLinkLabel}
              </a>
            ) : null}
          </div>
        )}

        <NavLink
          to="/logout"
          title={collapsed ? "Cerrar sesión" : undefined}
          className={`${collapsed ? "justify-center px-0" : "gap-3 px-4"} mt-4 flex items-center rounded-2xl py-3 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-hover`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Cerrar sesión"}
        </NavLink>
      </div>
    </aside>
  );
}
