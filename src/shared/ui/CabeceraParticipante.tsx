import { Marca } from "@/components/brand/Marca";

export function CabeceraParticipante() {
  return (
    <header className="border-b border-rel-border/80 bg-rel-surface">
      <div className="mx-auto flex min-h-19 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:min-h-20 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Marca className="h-8 shrink-0 sm:h-9" />
          <p className="min-w-0 truncate border-l border-rel-border pl-3 text-[0.7rem] font-medium text-rel-muted sm:text-xs">
            Aprende · Avanza · Impacta
          </p>
        </div>
        <span className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-rel-accent-subtle px-3 text-xs font-bold text-rel-accent-ink sm:px-4 sm:text-sm">
          Participante
        </span>
      </div>
    </header>
  );
}
