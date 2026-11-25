// Compatibilidad: `Skeleton` es el nombre con el que llegaron los componentes
// de shadcn, y lo siguen usando la barra lateral y `TablaDatos`. La definicion
// vive una sola vez, en `@/shared/ui/Esqueleto`, que es donde ademas estan las
// formas (texto, tabla, tarjetas) y la regla de los 300 ms.
//
// Antes eran dos aspectos distintos para el mismo trabajo: este latia
// (`animate-pulse`) y el del sistema recorria. Un esqueleto que late se lee
// como algo que respira; uno que recorre se lee como algo que avanza, que es
// lo que una espera tiene que comunicar.
export { Esqueleto as Skeleton } from "@/shared/ui/Esqueleto";
