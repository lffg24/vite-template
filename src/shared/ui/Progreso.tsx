// src/shared/ui/Progreso.tsx
//
// Cuánto falta, en barra o en anillo.
//
// Antes cada pantalla pintaba su barra con dos `div` y un `style.width`, sin
// `role` ni valor accesible: un lector de pantalla no sabía que ahí había un
// progreso. Aquí se dice una vez y bien.
//
// `valor` va de 0 a 1 y se recorta a ese rango. Un 1,2 que llega de un cálculo
// con redondeo no puede dibujar una barra que se sale de su caja.
//
// El `Progress` de shadcn no sirve de base: pinta con los tokens viejos
// (`brand-turquoise`) y lo consume Psicosocial, que no se toca.

import { cn } from "@/lib/utils";

function acotar(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(1, Math.max(0, valor));
}

export function BarraProgreso({
  valor,
  etiqueta,
  mostrarPorcentaje = false,
  tamano = "md",
  className,
}: {
  valor: number;
  /** Lo que mide. Se anuncia aunque no se vea. */
  etiqueta: string;
  mostrarPorcentaje?: boolean;
  tamano?: "sm" | "md";
  className?: string;
}) {
  const v = acotar(valor);
  const porcentaje = Math.round(v * 100);
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        className={cn(
          "relative min-w-0 flex-1 overflow-hidden rounded-full bg-rel-neutral-subtle",
          tamano === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className="h-full rounded-full bg-rel-primary transition-[width] duration-rel-context motion-reduce:transition-none"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      {mostrarPorcentaje ? (
        <span className="shrink-0 text-sm font-semibold tabular-nums text-rel-dark" aria-hidden="true">
          {porcentaje}%
        </span>
      ) : null}
    </div>
  );
}

/**
 * El anillo del resumen: un número grande que se lee de lejos.
 *
 * Se dibuja con `stroke-dasharray` sobre la circunferencia, que es lo que hace
 * que el trazo empiece arriba y avance en sentido horario sin cálculos de arco.
 */
export function AnilloProgreso({
  valor,
  etiqueta,
  leyenda = "Completado",
  tono = "marca",
  tamano = 132,
  className,
}: {
  valor: number;
  etiqueta: string;
  /** Texto bajo el porcentaje. */
  leyenda?: string;
  /** `exito` para cumplimiento; la marca para avance personal. */
  tono?: "marca" | "exito";
  tamano?: number;
  className?: string;
}) {
  const v = acotar(valor);
  const porcentaje = Math.round(v * 100);
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={porcentaje}
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: tamano, height: tamano }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radio} fill="none" strokeWidth="9" className="stroke-rel-neutral-subtle" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - v)}
          className={cn(
            "transition-[stroke-dashoffset] duration-rel-context motion-reduce:transition-none",
            tono === "exito" ? "stroke-rel-success" : "stroke-rel-primary"
          )}
        />
      </svg>
      <div className="relative text-center" aria-hidden="true">
        <p className="font-rel-heading text-2xl font-black tabular-nums text-rel-dark">
          {porcentaje}
          <span className="text-base">%</span>
        </p>
        {leyenda ? <p className="text-xs text-rel-muted">{leyenda}</p> : null}
      </div>
    </div>
  );
}
