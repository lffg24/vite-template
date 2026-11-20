// src/shared/ui/EntradaClave.tsx
//
// El campo de contraseña con su interruptor de visibilidad.
//
// ## Por qué hacía falta
//
// Estaba escrito a mano en cuatro pantallas —inicio de sesión, restablecer
// clave, perfil del psicólogo y creación de psicólogos— y las cuatro lo
// resolvían distinto:
//
//   - Tres colocan el botón en posición absoluta sobre el campo; la cuarta lo
//     pone como hermano dentro de una caja con borde propio y su propio
//     `focus-within`, así que el foco se dibuja de dos formas en el mismo
//     producto.
//   - Ninguna declara `aria-pressed`. El botón cambia de icono y de
//     `aria-label`, pero para un lector de pantalla no es un interruptor: es
//     un botón que a veces se llama una cosa y a veces otra.
//   - Restablecer clave comparte un solo estado entre sus dos campos, así que
//     el ojo de uno revela también el otro. **Eso es correcto ahí** —son la
//     contraseña y su confirmación, y verlas juntas es justo lo que ayuda a
//     cotejarlas— pero estaba conseguido por accidente y no se podía
//     distinguir de un descuido.
//
// ## Lo que decide este componente
//
//   - **Un solo tratamiento visual**: el campo es el `Input` de la casa, con
//     sitio reservado a la derecha, y el botón va encima sin borde propio.
//   - **`aria-pressed` siempre.** El interruptor se anuncia como lo que es.
//   - **La visibilidad compartida es explícita.** Sin `visible`, cada campo
//     gobierna el suyo. Con `visible` y `alAlternar`, la pantalla decide, y
//     entonces la etiqueta del botón habla en plural porque afecta a más de un
//     campo.
//
//     Esa equivalencia —gobernado desde fuera = compartido entre varios— es una
//     decisión, y conviene saber que se puede incumplir: al migrar el inicio de
//     sesión se le pasó `visible` por costumbre, teniendo UN solo campo, y el
//     botón pasó a decir «Mostrar contraseñas». Si algún día hace falta que la
//     pantalla gobierne un campo suelto, lo que toca es una prop para el número
//     de campos, no otra etiqueta puesta a mano.

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "type"> & {
  /** Visibilidad gobernada por la pantalla, para varios campos a la vez. */
  visible?: boolean;
  alAlternar?: () => void;
  /**
   * Icono decorativo a la izquierda, el tratamiento de las pantallas de acceso.
   *
   * Es una prop y no algo que ponga cada pantalla porque el icono vive DENTRO
   * del campo: si lo coloca la pantalla, tiene que saber también cuánto
   * relleno reservarle, y ahí es donde las tres copias se separaron.
   */
  icono?: LucideIcon;
};

export function EntradaClave({ visible, alAlternar, icono: Icono, className, ...props }: Props) {
  const [propia, setPropia] = useState(false);
  const compartida = visible !== undefined;
  const mostrando = compartida ? visible : propia;

  const etiqueta = compartida
    ? mostrando
      ? "Ocultar contraseñas"
      : "Mostrar contraseñas"
    : mostrando
      ? "Ocultar contraseña"
      : "Mostrar contraseña";

  return (
    <div className="relative">
      {Icono ? (
        <Icono
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        />
      ) : null}
      <Input
        {...props}
        type={mostrando ? "text" : "password"}
        // Sitio para el botón: sin esto el texto pasa por debajo del icono en
        // cuanto la contraseña es visible y larga.
        className={cn("pr-11", Icono && "pl-12", className)}
      />
      <button
        type="button"
        onClick={() => (compartida ? alAlternar?.() : setPropia((valor) => !valor))}
        aria-pressed={mostrando}
        aria-label={etiqueta}
        title={etiqueta}
        /* `inset-y-0` y no `top-0 h-10`: las pantallas de acceso usan un campo
           de 3.5rem y el botón tiene que centrarse en el alto que tenga el
           campo, no en el alto por omisión. Un control que solo encaja a una
           altura es un control que se vuelve a copiar. */
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors duration-rel-micro ease-rel-out hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
      >
        {mostrando ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
