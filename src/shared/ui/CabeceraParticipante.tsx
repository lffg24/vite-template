import evaLogoColor from "@/assets/eva-logo-color.png";
import AbrilWordmark from "@/components/brand/AbrilWordmark";

export function CabeceraParticipante() {
  return (
    <header className="border-b border-rel-border/80 bg-rel-surface">
      <div className="mx-auto flex min-h-[4.75rem] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:min-h-[5rem] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rel-accent-subtle ring-1 ring-rel-accent/10 sm:h-12 sm:w-12">
            <img src={evaLogoColor} alt="" aria-hidden="true" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
          </span>
          <div className="min-w-0">
            <AbrilWordmark className="truncate font-rel-heading text-xl font-black tracking-tight text-rel-dark sm:text-2xl" accentClassName="text-rel-primary" />
            <p className="truncate text-[0.7rem] font-medium text-rel-muted sm:text-xs">Aprende · Avanza · Impacta</p>
          </div>
        </div>
        <span className="inline-flex min-h-[2.5rem] shrink-0 items-center rounded-full bg-rel-accent-subtle px-3 text-xs font-bold text-rel-accent sm:px-4 sm:text-sm">
          Participante
        </span>
      </div>
    </header>
  );
}
