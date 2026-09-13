// src/shared/ui/SeccionPlegable.tsx
//
// Un panel de la casa que se puede cerrar, con memoria.
//
// Para qué: en una pantalla larga de redacción —un curso con sus datos
// normativos, sus lecciones y su checklist— lo que ya está terminado sigue
// ocupando la mitad del alto y empujando hacia abajo lo que falta. Poder
// cerrarlo convierte una pantalla que se recorre en una que se revisa.
//
// Por qué NO es `<details>`: la cabecera lleva su propia acción («Agregar
// lección»), y un botón dentro de un `<summary>` abre y cierra la sección
// además de hacer lo suyo. Se arregla con `stopPropagation`, que es exactamente
// la clase de parche que deja un control comportándose distinto según dónde se
// pulse. Con `aria-expanded` + `aria-controls` el patrón es el estándar de
// acordeón y la acción vive fuera del disparador.
//
// La memoria es por sección y por navegador (`localStorage`). No viaja al
// servidor: qué tiene uno plegado es comodidad de su pantalla, no un dato del
// producto.

import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function leerMemoria(clave: string | undefined, defecto: boolean): boolean {
  if (!clave) return defecto;
  try {
    const guardado = window.localStorage.getItem(clave);
    return guardado === null ? defecto : guardado === "1";
  } catch {
    // Ventana privada, almacenamiento bloqueado, captura de miniatura: leer
    // puede LANZAR, no solo devolver vacío. Sin este catch la pantalla entera
    // se cae por recordar si un panel estaba plegado.
    return defecto;
  }
}

export function SeccionPlegable({
  titulo,
  descripcion,
  estado,
  accion,
  children,
  abiertaPorDefecto = true,
  claveMemoria,
  className,
  abierta: abiertaControlada,
  alAlternar,
}: {
  titulo: string;
  /** Línea de apoyo bajo el título. Se ve también plegada. */
  descripcion?: ReactNode;
  /** Señal de avance: una insignia, un «3 de 4». Se ve SIEMPRE, plegada o no. */
  estado?: ReactNode;
  /** Acción propia de la sección. Nunca dentro del disparador. */
  accion?: ReactNode;
  children: ReactNode;
  abiertaPorDefecto?: boolean;
  /** Clave de `localStorage`. Sin ella, la sección no recuerda nada. */
  claveMemoria?: string;
  className?: string;
  /**
   * Para controlarla desde fuera: una sección que se pliega sola al guardar.
   *
   * Si se pasa, manda ella y el estado interno queda de respaldo. La sección
   * sigue recordando en `localStorage` igual, porque quien la plegó a mano
   * espera encontrarla plegada la próxima vez aunque alguien la abra por
   * código en el medio.
   */
  abierta?: boolean;
  alAlternar?: (abierta: boolean) => void;
}) {
  const idContenido = useId();
  const [abiertaInterna, setAbiertaInterna] = useState(() =>
    leerMemoria(claveMemoria, abiertaPorDefecto)
  );
  const abierta = abiertaControlada ?? abiertaInterna;

  function alternar() {
    const siguiente = !abierta;
    setAbiertaInterna(siguiente);
    alAlternar?.(siguiente);
  }

  useEffect(() => {
    if (!claveMemoria) return;
    try {
      window.localStorage.setItem(claveMemoria, abierta ? "1" : "0");
    } catch {
      // Que no se pueda recordar no es motivo para romper nada.
    }
  }, [claveMemoria, abierta]);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-rel-panel border border-rel-border bg-rel-surface shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-6">
        <button
          type="button"
          onClick={alternar}
          aria-expanded={abierta}
          aria-controls={idContenido}
          className="group flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
        >
          <ChevronDown
            className={cn(
              "mt-1 h-5 w-5 shrink-0 text-rel-muted transition-transform motion-reduce:transition-none",
              !abierta && "-rotate-90"
            )}
            aria-hidden="true"
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-rel-heading text-lg font-bold text-rel-dark">{titulo}</span>
              {estado}
            </span>
            {descripcion ? (
              <span className="mt-1 block font-rel-body text-sm text-rel-muted">
                {descripcion}
              </span>
            ) : null}
          </span>
        </button>

        {accion ? <div className="shrink-0">{accion}</div> : null}
      </div>

      {/* `hidden` y no desmontar: desmontar tira el formulario a medio llenar
          de quien pliega la sección sin querer. */}
      <div id={idContenido} hidden={!abierta} className="border-t border-rel-border p-6">
        {children}
      </div>
    </section>
  );
}
