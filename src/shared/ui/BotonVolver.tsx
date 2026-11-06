// src/shared/ui/BotonVolver.tsx
//
// El «volver» de la casa.
//
// Es la forma que ya usa Psicosocial —contorno sobre blanco, flecha, sombra
// fina— y no la que tenía Capacitaciones, que era un botón fantasma: texto
// suelto pegado al borde izquierdo. La diferencia importa más de lo que parece,
// porque «volver» es el control que más se busca con prisa; si en una pantalla
// es un botón y en otra parece un enlace perdido, hay que encontrarlo dos veces.
//
// Es un `<Link>` y no un `navigate(-1)`: el destino es SIEMPRE explícito. El
// historial no sabe de jerarquía —quien llegó desde un enlace pegado en un chat
// acabaría fuera de la aplicación— y un enlace de verdad se puede abrir en otra
// pestaña.

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function BotonVolver({
  a,
  children,
  className,
}: {
  /** A dónde se vuelve. Explícito, nunca al historial. */
  a: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={a}
      className={cn(
        "inline-flex items-center gap-2 rounded-rel-control border border-rel-border bg-rel-surface px-4 py-2 text-sm font-bold text-rel-dark shadow-sm transition-colors hover:bg-rel-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
