import "@testing-library/jest-dom";
import { configure } from "@testing-library/dom";
import RO from "resize-observer-polyfill";
(globalThis as any).ResizeObserver ||= RO;

// `findBy*` espera 1 000 ms por defecto, y con la suite entera en marcha eso no
// alcanza: el arranque de un archivo compite con los demás y la aserción llega
// mientras la pantalla todavía dice «cargando». Se ha visto caer así a cinco
// archivos distintos, sin relación entre ellos, y siempre pasando por separado.
//
// Un rojo de ese tipo no dice nada del código y enseña a relanzar la suite hasta
// que pase, que es la peor costumbre que puede coger un equipo. El margen no
// tapa nada: una espera que de verdad no se resuelve sigue fallando, solo que
// cinco segundos más tarde.
configure({ asyncUtilTimeout: 5_000 });

// jsdom no trae `matchMedia`, y sin él cualquier componente que pregunte por el
// ancho de la ventana revienta dentro de su efecto —y React, al reventar un
// efecto, desmonta el árbol entero, así que la prueba no encuentra NADA y el
// fallo no se parece en nada a su causa.
//
// Responde siempre «no coincide»: pantalla ancha. Una prueba que quiera
// comprobar la versión estrecha lo sustituye solo en ese bloque —ver
// `shared/ui/TablaDatos.test.tsx`—, que es mejor que un mundo donde media
// suite se pinta en móvil sin que nadie lo haya pedido.
if (!window.matchMedia) {
  window.matchMedia = ((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// cmdk (Seleccion) desplaza la opción marcada; jsdom no implementa scrollIntoView.
Element.prototype.scrollIntoView ||= () => {};
