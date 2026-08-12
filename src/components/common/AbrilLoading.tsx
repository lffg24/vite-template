import { Loader2, Sparkles } from "lucide-react";

export function AbrilLoading({ title = "Procesando información", subtitle = "Estamos validando y preparando los datos de ABRIL-360." }: { title?: string; subtitle?: string }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-3xl border border-border/70 bg-white/80 p-8 shadow-card">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-accent text-brand-primary ring-8 ring-accent/70">
          <Loader2 className="h-9 w-9 animate-spin" />
          <div className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-brand-turquoise shadow-card">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="text-lg font-bold text-foreground">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</div>
        <div className="mt-5 h-2 w-56 overflow-hidden rounded-full bg-accent/60">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-primary" />
        </div>
      </div>
    </div>
  );
}

export default AbrilLoading;
