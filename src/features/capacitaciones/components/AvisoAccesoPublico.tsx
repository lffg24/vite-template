// src/features/capacitaciones/components/AvisoAccesoPublico.tsx
//
// Avisa ANTES de repartir algo que no va a funcionar.
//
// ## El trabajo perdido que evita
//
// El recorrido público se abre empresa por empresa. Cuando está cerrado, generar
// un enlace o una invitación funciona —el servidor los crea sin protestar, y es
// correcto: crear no es entrar— pero al abrirlos responden que no está
// habilitado para esta empresa.
//
// El orden en que eso ocurría es lo que lo hacía caro: se creaba el curso, se
// asignaba, se generaba el enlace, se imprimía la hoja, se repartía… y el
// rechazo aparecía delante de la persona a la que se le acababa de dar. Todo el
// trabajo se descubría inútil al final.
//
// ## Por qué avisa y además inhabilita
//
// Un aviso que se puede ignorar se ignora. Y aquí no hay nada que ganar
// intentándolo: el enlace generado no serviría hasta que alguien habilite la
// empresa, y entonces habría que generarlo otra vez —el token se muestra una
// sola vez—.
//
// ## Por qué no dice CÓMO se arregla
//
// Porque quien está en esta pantalla normalmente no puede arreglarlo: habilitar
// una empresa es superficie de plataforma. Se nombra dónde se hace para que la
// petición llegue a quien corresponde, sin prometer un botón que esta persona no
// va a encontrar.

import { ShieldOff } from "lucide-react";

import { useCapacitaciones } from "@/features/capacitaciones/ContextoCapacitaciones";

/**
 * Si el recorrido público está abierto para esta empresa.
 *
 * **Cerrado también cuando no se sabe.** La bandera llega en `null` si nadie la
 * declaró, y eso bloquea igual que apagada: el `COALESCE` de la guarda devuelve
 * NULL y el acceso se cierra. Tratarlo como «quizá sí» haría que la pantalla
 * prometiera lo contrario de lo que va a pasar.
 */
export function useAccesoPublicoAbierto(): boolean {
  const { capacidades } = useCapacitaciones();
  return capacidades?.bandera_participacion === true;
}

export function AvisoAccesoPublico({ que }: { que: "enlaces" | "invitaciones" }) {
  if (useAccesoPublicoAbierto()) return null;

  const objeto = que === "enlaces" ? "los enlaces" : "las invitaciones";
  return (
    <div
      role="status"
      className="flex min-w-0 gap-3 rounded-rel-card border border-rel-warning bg-rel-warning-subtle p-4"
    >
      <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-rel-warning" aria-hidden="true" />
      <div className="min-w-0 font-rel-body text-sm">
        <p className="font-semibold text-rel-dark">
          El acceso público está cerrado para esta empresa
        </p>
        <p className="mt-1 text-rel-muted">
          {objeto.charAt(0).toUpperCase() + objeto.slice(1)} se generarían, pero al
          abrirlos responderían que no está habilitado — y como el código se
          muestra una sola vez, habría que volver a generarlos después. Pídele a
          quien administra la plataforma que habilite el módulo para esta empresa
          en <strong className="text-rel-dark">Habilitar módulos</strong>.
        </p>
      </div>
    </div>
  );
}
