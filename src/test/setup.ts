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
