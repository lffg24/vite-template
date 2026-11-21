// src/shared/ui/NumeroQueCuenta.tsx
//
// Un número que llega contando desde cero. Se usa para UNA cifra que es el
// resultado de algo que la persona acaba de hacer (la nota de una evaluación),
// no para decorar cifras que ya estaban ahí.
//
// ## Qué cuenta y qué no
//
// El número del DOM es siempre el definitivo cuando la animación no corre: sin
// preferencia de movimiento reducido declarada como «sin preferencia», se
// pinta el valor final de entrada. Eso cubre a quien pidió menos movimiento,
// a los lectores de pantalla y a las pruebas (jsdom responde «no» a todo).
//
// Cuando sí corre, el texto animado se oculta a las ayudas técnicas y se deja
// el definitivo como texto invisible: un lector de pantalla no debe oír
// «3, 11, 27, 48…».
//
// ## Cuánto dura
//
// 700 ms con salida suave: lo bastante para que se vea que llega, lo bastante
// corto para que nadie espere por conocer su nota.

import { useEffect, useState } from "react";

const DURACION_MS = 700;

function puedeAnimar(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}

export function NumeroQueCuenta({
  valor,
  sufijo = "",
  className,
}: {
  valor: number;
  sufijo?: string;
  className?: string;
}) {
  const [animar] = useState(puedeAnimar);
  const [mostrado, setMostrado] = useState(animar ? 0 : valor);

  useEffect(() => {
    if (!animar) {
      setMostrado(valor);
      return;
    }
    let cuadro = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / DURACION_MS);
      // Salida cúbica: arranca rápido y se asienta, como el resto del movimiento.
      const suave = 1 - Math.pow(1 - t, 3);
      setMostrado(Math.round(valor * suave));
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [animar, valor]);

  if (!animar || mostrado === valor) {
    return (
      <span className={className}>
        {valor}
        {sufijo}
      </span>
    );
  }

  return (
    <span className={className}>
      <span aria-hidden="true">
        {mostrado}
        {sufijo}
      </span>
      <span className="sr-only">
        {valor}
        {sufijo}
      </span>
    </span>
  );
}
