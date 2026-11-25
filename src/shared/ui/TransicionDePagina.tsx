// src/shared/ui/TransicionDePagina.tsx
//
// El cambio de página se ve. Una vez, y en un sitio.
//
// ## Qué pasaba
//
// Las cuatro pantallas de armazón pintaban su `<Outlet />` pelado, así que
// cambiar de ruta era un corte: el contenido anterior desaparecía y el nuevo
// aparecía ya colocado, en el mismo fotograma. Eso se percibe como que la
// pantalla «parpadea», y es de lo primero que delata una interfaz que no se
// ha cuidado.
//
// ## Qué hace, y por qué tan poco
//
// Sube 8 px y aparece, en 220 ms, con la curva de la casa. Nada más. Los
// 8 px no son decorativos: son los que hacen que el ojo lea «esto acaba de
// llegar» en vez de «esto parpadeó». Con más recorrido el bloque se arrastra
// y la navegación se siente lenta, que es el defecto contrario y se nota
// antes.
//
// No hay animación de SALIDA a propósito. Para animar la salida hay que
// retener el árbol anterior mientras se va, y eso significa mantener montadas
// dos pantallas a la vez: el doble de peticiones en vuelo, el foco en un sitio
// que ya no existe y una espera añadida antes de ver lo que se pidió. Se paga
// con lentitud real a cambio de un efecto.
//
// ## El `key`
//
// Es lo que hace que la animación vuelva a correr. Sin él React reaprovecha
// el nodo y el navegador no reinicia nada. Y trae un efecto que conviene
// nombrar: la ruta anterior se desmonta de verdad, así que su estado local no
// sobrevive al cambio. Eso es lo correcto —una ruta nueva es una pantalla
// nueva— pero no es gratis, y por eso se escribe aquí y no en cada armazón.
//
// Quien prefiere menos movimiento no ve nada de esto: la regla global de
// `prefers-reduced-motion` deja la animación en 1 ms.

import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

export function TransicionDePagina({
  children,
  className,
}: {
  children: ReactNode;
  /**
   * Las clases que el hueco necesitaba.
   *
   * Este `div` se mete entre el armazón y la pantalla, así que hereda el
   * papel que tenía el `<Outlet />` en su contenedor: si el padre es una
   * columna flexible, aquí va el `flex-1`.
   */
  className?: string;
}) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className={cn("animate-entrada", className)}>
      {children}
    </div>
  );
}
