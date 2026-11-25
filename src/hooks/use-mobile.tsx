import * as React from "react"

/** El mismo ancho que `md` en Tailwind. Si uno cambia, cambian los dos. */
const MOBILE_BREAKPOINT = 768

function esEstrecha() {
  // `typeof window` por si esto llega a correr fuera del navegador; `matchMedia`
  // puede no existir en un entorno de pruebas, y preguntar por el ancho es
  // suficiente para el primer pintado.
  if (typeof window === "undefined") return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  // El valor se calcula YA, en el primer render, y no después en un efecto.
  //
  // Antes empezaba en `undefined` —es decir, «ancha»— y se corregía en el
  // efecto, que corre DESPUÉS de pintar. En un teléfono eso significa un
  // fotograma con la versión ancha y un salto visible. Se notaba en la barra
  // lateral y se habría notado en cada tabla que elige entre filas y tarjetas.
  const [isMobile, setIsMobile] = React.useState<boolean>(esEstrecha)

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(esEstrecha())
    mql.addEventListener("change", onChange)
    // Una vez al montar: entre el primer render y este efecto la ventana pudo
    // cambiar de tamaño, y en ese hueco nadie estaba escuchando.
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
