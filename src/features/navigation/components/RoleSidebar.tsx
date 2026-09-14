import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import evaIsotipoWhite from "@/assets/eva-isotipo-white.png";
import AbrilWordmark from "@/components/brand/AbrilWordmark";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavigationEntry, NavigationItem } from "../navigationTree";

export type RoleSidebarItem = NavigationItem;
type Props = {
  items: NavigationEntry[]; storageKey: string; tone?: "legacy" | "rel";
  brandTitle?: string; brandSubtitle?: string; avatarText: string;
  userTitle: string; userSubtitle: string; navLabel: string;
  footerTitle?: string; footerLink?: string; footerLinkLabel?: string;
  loading?: boolean; error?: string | null; onRetry?: () => void;
};
const activeRoute = (current: string, target: string) => current === target || current.startsWith(`${target}/`);

export default function RoleSidebar({ items, storageKey, tone = "rel", brandTitle = "ABRIL360",
  brandSubtitle, avatarText, userTitle, userSubtitle, navLabel,
  footerTitle = `© ${new Date().getFullYear()} REL Consilium SAS`,
  footerLink = "https://relconsilium.com/", footerLinkLabel = "relconsilium.com",
  loading = false, error = null, onRetry }: Props) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(storageKey) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const location = useLocation();
  const rel = tone === "rel";
  useEffect(() => { localStorage.setItem(storageKey, collapsed ? "1" : "0"); }, [collapsed, storageKey]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const renderContent = (compact: boolean, mobile = false) => <div className="flex h-full min-h-0 flex-col p-4">
    <div className="mb-5 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 p-2"><img src={evaIsotipoWhite} alt="" aria-hidden="true" className="h-full w-full object-contain" /></span>
        {!compact && <span className="min-w-0"><AbrilWordmark className="block truncate text-2xl font-black" accentClassName={rel ? "text-rel-sky" : "text-violet-300"} /><span className="block truncate text-xs text-slate-300">{brandSubtitle}</span></span>}
      </div>
      {!mobile && <button type="button" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expandir menú" : "Contraer menú"} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rel-sky">{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>}
    </div>
    <div className={`mb-4 flex items-center rounded-2xl border border-white/10 bg-white/5 ${compact ? "justify-center p-2" : "gap-3 p-3"}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold ${rel ? "bg-rel-accent text-rel-dark" : "bg-violet-600"}`}>{avatarText}</span>
      {!compact && <span className="min-w-0"><span className="block truncate font-semibold">{userTitle}</span><span className="block truncate text-xs text-slate-300">{userSubtitle}</span></span>}
    </div>
    <nav aria-label={navLabel} className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
      {loading && <p role="status" className="px-3 py-4 text-sm text-slate-300">Cargando menú…</p>}
      {error && <div role="alert" className="rounded-xl border border-white/20 p-3 text-sm"><p>{error}</p><button type="button" onClick={onRetry} className="mt-2 underline focus-visible:ring-2 focus-visible:ring-rel-sky">Reintentar</button></div>}
      {!loading && !error && items.length === 0 && <p className="px-3 py-4 text-sm text-slate-300">No hay opciones habilitadas para esta cuenta.</p>}
      {items.map(entry => {
        if ("to" in entry) {
          const Icon = entry.icon;
          const active = activeRoute(location.pathname, entry.to);
          return <NavLink key={entry.to} to={entry.to} title={compact ? entry.label : undefined} aria-label={compact ? entry.label : undefined} onClick={() => setMobileOpen(false)} className={`flex w-full items-center rounded-xl text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-sky ${compact ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"} ${active ? (rel ? "bg-rel-accent text-rel-dark" : "bg-violet-600 text-white") : "text-slate-200 hover:bg-white/10"}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{!compact && <span>{entry.label}</span>}</NavLink>;
        }
        const Icon = entry.icon;
        const active = entry.children.some(child => activeRoute(location.pathname, child.to));
        const expanded = openGroups.includes(entry.label) || (active && !openGroups.includes(`closed:${entry.label}`));
        return <div key={entry.label} className="rounded-xl border border-white/10">
          <button type="button" aria-expanded={!compact && expanded} aria-label={compact ? `Abrir ${entry.label}` : undefined} onClick={() => {
            if (compact) { setCollapsed(false); setOpenGroups(v => [...v, entry.label]); return; }
            setOpenGroups(v => expanded ? [...v.filter(x => x !== entry.label), `closed:${entry.label}`] : [...v.filter(x => x !== `closed:${entry.label}`), entry.label]);
          }} className={`flex w-full items-center rounded-xl text-left text-sm font-semibold text-slate-100 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rel-sky ${compact ? "justify-center p-3" : "gap-3 px-3 py-2.5"}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{!compact && <><span className="min-w-0 flex-1">{entry.label}</span><ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} /></>}</button>
          {!compact && expanded && <div className="space-y-0.5 pb-2 pl-3 pr-2">{entry.children.map(child => {
            const ChildIcon = child.icon;
            return <NavLink key={child.to} to={child.to} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-sky ${activeRoute(location.pathname, child.to) ? "bg-white/15 font-semibold text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><ChildIcon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{child.label}</span></NavLink>;
          })}</div>}
        </div>;
      })}
    </nav>
    {!compact && <div className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-slate-300"><div>{footerTitle}</div>{footerLink && <a href={footerLink} target="_blank" rel="noreferrer" className="underline hover:text-white">{footerLinkLabel}</a>}</div>}
    <NavLink to="/logout" title={compact ? "Cerrar sesión" : undefined} className={`mt-3 flex items-center rounded-xl py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rel-sky ${compact ? "justify-center" : "gap-3 px-3"}`}><LogOut className="h-5 w-5" />{!compact && "Cerrar sesión"}</NavLink>
  </div>;

  return <>
    <div className="flex w-full items-center gap-3 bg-rel-dark px-4 py-3 text-white sm:hidden"><Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><button type="button" aria-label="Abrir menú" className="rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-sky"><Menu className="h-6 w-6" /></button></SheetTrigger><SheetContent side="left" className="w-[min(88vw,340px)] border-0 bg-rel-dark p-0 text-white"><SheetTitle className="sr-only">Menú de Abril360</SheetTitle>{renderContent(false, true)}</SheetContent></Sheet><AbrilWordmark className="text-xl font-black" accentClassName="text-rel-sky" /></div>
    <aside className={`hidden h-screen shrink-0 overflow-hidden text-white shadow-lg sm:sticky sm:top-0 sm:block ${rel ? "bg-rel-dark" : "bg-[#071329]"}`} style={{ width: collapsed ? 84 : 292 }} aria-label={brandTitle}>{renderContent(collapsed)}</aside>
  </>;
}
