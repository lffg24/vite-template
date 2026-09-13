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
  /** Permite migrar una superficie a la identidad vigente sin alterar las demás. */
  tone?: "legacy" | "rel";
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
  tone = "legacy",
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
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(storageKey, collapsed ? "1" : "0");
  }, [collapsed, storageKey]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const actualizar = () => setMobile(media.matches);
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);

  const compact = collapsed || mobile;
  const ancho = compact ? (mobile ? 72 : 84) : 292;
  const currentBrand = tone === "rel";

  return (
    <aside
      className={`min-h-screen shrink-0 overflow-hidden text-white shadow-2xl transition-all duration-300 ${currentBrand ? "bg-rel-dark" : "bg-[#071329]"}`}
      style={{ width: ancho, minWidth: ancho, maxWidth: ancho }}
    >
      <div className="flex h-full flex-col p-4">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 p-2 shadow-lg ${currentBrand ? "shadow-black/20" : "shadow-violet-950/30"}`}>
              <img src={evaIsotipoWhite} alt="" className="h-full w-full object-contain" aria-hidden="true" />
            </div>
            {!compact && (
              <div className="min-w-0">
                {brandTitle === "ABRIL360" || brandTitle === "ABRIL-360" ? (
                  <AbrilWordmark className="block truncate text-2xl font-black" accentClassName={currentBrand ? "text-rel-sky" : "text-violet-300"} />
                ) : (
                  <div className="truncate text-2xl font-black">{brandTitle}</div>
                )}
                {brandSubtitle ? <div className="truncate text-xs text-slate-400">{brandSubtitle}</div> : null}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={compact ? "Expandir menú" : "Contraer menú"}
            className={`${mobile ? "hidden" : "grid"} h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white`}
          >
            {compact ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`${compact ? "items-center justify-center p-2" : "gap-3 p-3"} mb-5 flex rounded-2xl border border-white/10 bg-white/5`}>
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-bold ${currentBrand ? "bg-rel-accent" : "bg-violet-600"}`}>{avatarText}</div>
          {!compact && (
            <div className="min-w-0">
              <div className="truncate font-bold">{userTitle}</div>
              <div className={`truncate text-sm ${currentBrand ? "text-teal-100" : "text-violet-200"}`}>{userSubtitle}</div>
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
                title={compact ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (location.pathname !== item.to) navigate(item.to);
                }}
                className={[
                  "group flex w-full items-center rounded-2xl text-left text-sm font-semibold transition",
                  compact ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
                  active
                    ? (currentBrand ? "bg-rel-accent text-white shadow-lg shadow-black/20" : "bg-violet-600 text-white shadow-lg shadow-violet-950/30")
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!compact && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!compact && (
          <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">
            <div>{footerTitle}</div>
            {footerLink ? (
              <a href={footerLink} target="_blank" rel="noreferrer" className={currentBrand ? "text-teal-100 hover:text-white" : "text-violet-200 hover:text-white"}>
                {footerLinkLabel}
              </a>
            ) : null}
          </div>
        )}

        <NavLink
          to="/logout"
          title={compact ? "Cerrar sesión" : undefined}
          className={`${compact ? "justify-center px-0" : "gap-3 px-4"} mt-4 flex items-center rounded-2xl py-3 text-sm font-semibold text-slate-300 hover:bg-white/10`}
        >
          <LogOut className="h-5 w-5" />
          {!compact && "Cerrar sesión"}
        </NavLink>
      </div>
    </aside>
  );
}
