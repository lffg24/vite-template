// src/components/brand/Marca.tsx
//
// La marca ABRIL360. Los archivos oficiales, y nada dibujado a mano.
//
// ## Qué había antes
//
// El producto mostraba **la marca de EVA**: `eva-logo-color.png` y
// `eva-isotipo-white.png`, el isotipo en un degradado azul→verde que no es
// ningún color de la marca. Aparecía en siete sitios, entre ellos el inicio de
// sesión, la barra lateral y la constancia que se imprime y se entrega.
//
// Y donde tenía que ir el logotipo, iba **texto recreado**: un `<span>` que
// escribía «ABRIL360» con la tipografía que tocara, con el acento del «360» en
// cuatro colores distintos según el archivo (`brand-primary`, `rel-sky`,
// `violet-300`, `rel-primary`). El manual de marca lo prohíbe explícitamente,
// y con razón: el logotipo deja de ser el logotipo en cuanto cada pantalla lo
// vuelve a dibujar.
//
// Dos detalles que sonaban mal y nadie veía: el `alt` de dos pantallas decía
// **«EVA 360»**, así que el producto se presentaba con el nombre anterior a
// quien usa lector de pantalla; y el favicon era el logotipo completo metido a
// la fuerza en 32 px, que es justo lo que el icono de aplicación existe para
// evitar.
//
// ## Lo que decide este componente
//
//   - **El archivo lo elige la superficie, no la pantalla.** `sobre="claro"` o
//     `sobre="oscuro"`; el componente sabe cuál de los oficiales corresponde.
//   - **`object-contain` siempre.** El manual prohíbe `cover`: recortaría el
//     isotipo.
//   - **Nombre accesible «ABRIL360»**, salvo que al lado ya haya un texto que
//     diga lo mismo; entonces `decorativa` lo calla en vez de repetirlo.
//
// ## Los lienzos venían con aire, y eso importaba
//
// Los PNG del kit son de 1400 × 400 con el arte ocupando 793 px: el 43 % del
// ancho era lienzo vacío. Fijar `h-10` sobre eso daba un logo visiblemente más
// pequeño de lo pedido y descentrado dentro de su hueco. Los archivos de
// `assets/marca/` están recortados al arte, así que el alto que se pide es el
// alto que se ve.
//
// El horizontal claro es **opaco sobre blanco** (el kit no trae una versión
// clara con transparencia), de modo que solo es seguro sobre superficie
// blanca; sobre cualquier otra dibujaría un rectángulo. Para fondo oscuro se
// usa el transparente, que sí lo es y por eso vale sobre cualquier oscuro.

import horizontalClaro from "@/assets/marca/abril360-horizontal-claro.png";
import horizontalTransparente from "@/assets/marca/abril360-horizontal-transparente.png";
import isotipoAzul from "@/assets/marca/abril360-isotipo-azul.png";
import isotipoBlanco from "@/assets/marca/abril360-isotipo-blanco.png";
import { cn } from "@/lib/utils";

type Variante = "horizontal" | "isotipo";
type Sobre = "claro" | "oscuro";

const ARCHIVO: Record<Variante, Record<Sobre, { src: string; ancho: number; alto: number }>> = {
  horizontal: {
    claro: { src: horizontalClaro, ancho: 798, alto: 240 },
    oscuro: { src: horizontalTransparente, ancho: 793, alto: 240 },
  },
  isotipo: {
    claro: { src: isotipoAzul, ancho: 235, alto: 260 },
    oscuro: { src: isotipoBlanco, ancho: 235, alto: 260 },
  },
};

export function Marca({
  variante = "horizontal",
  sobre = "claro",
  decorativa = false,
  className,
}: {
  variante?: Variante;
  /** El color de la superficie donde va, no el del logo. */
  sobre?: Sobre;
  /** Cuando al lado ya hay un texto que dice «ABRIL360». */
  decorativa?: boolean;
  className?: string;
}) {
  const { src, ancho, alto } = ARCHIVO[variante][sobre];
  return (
    <img
      src={src}
      // `width`/`height` reales para que el navegador reserve el hueco antes de
      // descargar la imagen: sin esto la cabecera da un salto al cargar.
      width={ancho}
      height={alto}
      alt={decorativa ? "" : "ABRIL360"}
      aria-hidden={decorativa || undefined}
      className={cn("w-auto object-contain", className)}
    />
  );
}
