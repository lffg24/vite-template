import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Marca } from "@/components/brand/Marca";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavigationEntry, NavigationItem } from "../navigationTree";

export type RoleSidebarItem = NavigationItem;
type Props = {
  items: NavigationEntry[]; storageKey: string;
  brandTitle?: string; brandSubtitle?: string; avatarText: string;
  userTitle: string; userSubtitle: string; navLabel: string;
  footerTitle?: string; footerLink?: string; footerLinkLabel?: string;
  loading?: boolean; error?: string | null; onRetry?: () => void;
};
const activeRoute = (current: string, target: string) => current === target || current.startsWith(`${target}/`);

/* El `tone` desaparecio con la decision de marca.
   Tenia dos valores, `legacy` y `rel`, y los cuatro armazones que montan esta
   barra pasaban `rel`. `legacy` era la rama muerta donde sobrevivia el
   violeta: el avatar, el enlace activo y el fondo de la barra tenian cada uno
   su version lila escrita a mano. Cerrada la marca en turquesa, la rama no es
   una alternativa, es codigo que nadie ejecuta guardando un color que el
   producto descarto. */
export default function RoleSidebar({ items, storageKey, brandTitle = "ABRIL360",
  brandSubtitle, avatarText, userTitle, userSubtitle, navLabel,
  footerTitle = `© ${new Date().getFullYear()} REL Consilium SAS`,
  footerLink = "https://relconsilium.com/", footerLinkLabel = "relconsilium.com",
  loading = false, error = null, onRetry }: Props) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(storageKey) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const location = useLocation();
  const base = useId();
  useEffect(() => { localStorage.setItem(storageKey, collapsed ? "1" : "0"); }, [collapsed, storageKey]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const renderContent = (compact: boolean, mobile = false) => <div className="flex h-full min-h-0 flex-col p-4">
    <div className="mb-5 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-3">
        {compact ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-rel-panel border border-white/10 bg-white/10 p-2">
            <Marca variante="isotipo" sobre="oscuro" className="h-full" />
          </span>
        ) : (
          <span className="min-w-0">
            <Marca sobre="oscuro" className="h-8" />
            {/* El modulo activo va FUERA del logotipo, nunca dentro: el manual
                lo prohibe y ademas el logotipo ya trae su propio descriptor. */}
            <span className="mt-1 block truncate text-xs text-white/70">{brandSubtitle}</span>
          </span>
        )}
      </div>
      {!mobile && <button type="button" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expandir menú" : "Contraer menú"} className="grid h-8 w-8 shrink-0 place-items-center rounded-rel-card border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rel-sky">{collapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}</button>}
    </div>
    <div className={`mb-4 flex items-center rounded-rel-panel border border-white/10 bg-white/5 ${compact ? "justify-center p-2" : "gap-3 p-3"}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rel-accent font-bold text-rel-dark`}>{avatarText}</span>
      {!compact && <span className="min-w-0"><span className="block truncate font-semibold">{userTitle}</span><span className="block truncate text-xs text-white/70">{userSubtitle}</span></span>}
    </div>
    <nav aria-label={navLabel} className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgb(255_255_255/0.25)_transparent] scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
      {loading && <p role="status" className="px-3 py-4 text-sm text-white/70">Cargando menú…</p>}
      {error && <div role="alert" className="rounded-rel-card border border-white/20 p-3 text-sm"><p>{error}</p><button type="button" onClick={onRetry} className="mt-2 underline focus-visible:ring-2 focus-visible:ring-rel-sky">Reintentar</button></div>}
      {!loading && !error && items.length === 0 && <p className="px-3 py-4 text-sm text-white/70">No hay opciones habilitadas para esta cuenta.</p>}
      {items.map((entry, indice) => {
        if ("to" in entry) {
          const Icon = entry.icon;
          const active = activeRoute(location.pathname, entry.to);
          return <NavLink key={entry.to} to={entry.to} title={compact ? entry.label : undefined} aria-label={compact ? entry.label : undefined} onClick={() => setMobileOpen(false)} className={`flex w-full items-center rounded-rel-card text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-sky ${compact ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"} ${active ? "bg-rel-accent text-rel-dark" : "text-white/85 hover:bg-white/10"}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{!compact && <span>{entry.label}</span>}</NavLink>;
        }
        const Icon = entry.icon;
        const active = entry.children.some(child => activeRoute(location.pathname, child.to));
        const expanded = openGroups.includes(entry.label) || (active && !openGroups.includes(`closed:${entry.label}`));
        /* El grupo de navegacion se queda escrito a mano y NO usa
           `SeccionPlegable`: aquel es un panel de contenido sobre superficie
           clara, con memoria en `localStorage`, titulo, descripcion y una
           accion propia en la cabecera. Esto es un grupo de enlaces sobre el
           azul oscuro de la barra, y su estado por defecto lo decide la ruta
           activa, no lo que alguien plego la ultima vez. Forzarlo dentro de la
           pieza seria vestir de panel algo que no lo es.

           Lo que si debia cumplir es el CONTRATO del plegable, y lo cumplia a
           medias:

             - `aria-controls` no existia, asi que el boton decia «abro algo»
               sin decir que.
             - En modo compacto declaraba `aria-expanded={false}`, y ahi el
               boton no plega nada: despliega la barra entera. Un desplegable
               que anuncia estar cerrado cuando en realidad es otro mando es
               peor que no anunciar nada.

           El identificador lleva `d`/`m` porque `renderContent` se llama dos
           veces —barra de escritorio y hoja movil— y las dos pueden estar en
           el DOM a la vez. */
        const idGrupo = `${base}-${mobile ? "m" : "d"}-grupo-${indice}`;
        return <div key={entry.label} className="rounded-rel-card border border-white/10">
          <button type="button" aria-expanded={compact ? undefined : expanded} aria-controls={compact ? undefined : idGrupo} aria-label={compact ? `Abrir ${entry.label}` : undefined} onClick={() => {
            if (compact) { setCollapsed(false); setOpenGroups(v => [...v, entry.label]); return; }
            setOpenGroups(v => expanded ? [...v.filter(x => x !== entry.label), `closed:${entry.label}`] : [...v.filter(x => x !== `closed:${entry.label}`), entry.label]);
          }} className={`flex w-full items-center rounded-rel-card text-left text-sm font-semibold text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rel-sky ${compact ? "justify-center p-3" : "gap-3 px-3 py-2.5"}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{!compact && <><span className="min-w-0 flex-1">{entry.label}</span><ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} /></>}</button>
          {/* El submenu no se monta y desmonta: aparecia y desaparecia en
              el mismo fotograma, que es el salto que mas se nota del menu.
              Con `grid-rows` de 0fr a 1fr la altura se puede animar sin
              saber cuanto mide el contenido --lo que `height: auto` no
              permite-- y sin medir nada en JavaScript.

              `invisible` cuando esta cerrado NO es decorativo: sin ello los
              enlaces siguen en el orden de tabulacion y alguien que navega
              con el teclado cae dentro de un grupo que no ve. Y lleva su
              propia transicion porque `visibility` se interpola a saltos:
              al cerrar espera a que la fila termine de encogerse en vez de
              dejar el hueco vacio a medio camino. */}
          {!compact && <div id={idGrupo} aria-hidden={expanded ? undefined : true}
            className={`grid transition-[grid-template-rows] duration-enter ease-rel-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className={`overflow-hidden transition-[visibility] duration-enter ${expanded ? "visible" : "invisible"}`}>
            <div className="space-y-0.5 pb-2 pl-3 pr-2">{entry.children.map(child => {
            const ChildIcon = child.icon;
            return <NavLink key={child.to} to={child.to} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2.5 rounded-rel-control px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-sky ${activeRoute(location.pathname, child.to) ? "bg-white/15 font-semibold text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><ChildIcon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{child.label}</span></NavLink>;
          })}</div>
            </div>
          </div>}
        </div>;
      })}
    </nav>
    {!compact && <div className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/70"><div>{footerTitle}</div>{footerLink && <a href={footerLink} target="_blank" rel="noreferrer" className="underline hover:text-white">{footerLinkLabel}</a>}</div>}
    <NavLink to="/logout" title={compact ? "Cerrar sesión" : undefined} className={`mt-3 flex items-center rounded-rel-card py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-rel-sky ${compact ? "justify-center" : "gap-3 px-3"}`}><LogOut className="h-5 w-5" aria-hidden="true" />{!compact && "Cerrar sesión"}</NavLink>
  </div>;

  return <>
    <div className="flex w-full items-center gap-3 bg-rel-dark px-4 py-3 text-white sm:hidden"><Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><button type="button" aria-label="Abrir menú" className="rounded-rel-control p-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-sky"><Menu className="h-6 w-6" aria-hidden="true" /></button></SheetTrigger><SheetContent side="left" className="w-[min(88vw,340px)] border-0 bg-rel-dark p-0 text-white"><SheetTitle className="sr-only">Menú de Abril360</SheetTitle>{renderContent(false, true)}</SheetContent></Sheet><Marca sobre="oscuro" className="h-7" /></div>
    <aside className={`hidden h-screen shrink-0 overflow-hidden text-white shadow-rel-floating transition-[width] duration-context ease-rel-out sm:sticky sm:top-0 sm:block bg-rel-dark`} style={{ width: collapsed ? 84 : 292 }} aria-label={brandTitle}>{renderContent(collapsed)}</aside>
  </>;
}
