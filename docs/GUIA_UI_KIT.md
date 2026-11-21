# Guía del UI kit de ABRIL-360

> Para quien desarrolla el frontend: persona, Codex o Claude. Léela antes de
> escribir cualquier pantalla o componente. Lo que no esté aquí, está en el
> catálogo vivo (`/ui-kit`) o en la cabecera de cada pieza.

## 1. La regla única

**Antes de escribir una pieza visual, búscala en el catálogo. Si existe, se
usa. Si no existe, se crea en `src/shared/ui/` y se suma al catálogo en el
mismo cambio.** Una pantalla que dibuja a mano lo que el kit ya resuelve es un
defecto, aunque se vea bien: son esas diferencias las que hicieron que el
producto tuviera «tablas distintas, botones distintos, secciones distintas».

## 2. Dónde está el catálogo

La página `/ui-kit` muestra cada pieza real con sus estados, las 90 escenas del
registro de ilustraciones y los iconos. Existe solo en desarrollo o con
`VITE_UI_KIT=1`:

```powershell
npm run dev      # luego abrir http://localhost:5173/ui-kit
```

Archivo: `src/pages/dev/CatalogoUiKitPage.tsx`.

## 3. Qué pieza uso

| Necesito… | Pieza | Archivo |
|---|---|---|
| Un contenedor | `Caja` (papel `panel` · `caja` · `fila`) | `shared/ui/Caja.tsx` |
| Una tarjeta que ES la acción | `Caja viva` | ídem |
| Una sección con título | `Panel` | `shared/ui/Panel.tsx` |
| El encabezado de una pantalla | `PageHeader` | `shared/ui/PageHeader.tsx` |
| Un botón | `Button` (variantes `rel`, `relOutline`) | `components/ui/button.tsx` |
| La acción principal de móvil | `BotonAccion` + `BarraAccionesMovil` | `shared/ui/BotonAccion.tsx` |
| Un dato de una línea | `Campo` + `Input` | `shared/ui/Campo.tsx` |
| Elegir entre pocas / varias | `OpcionesExcluyentes` / `OpcionesMultiples` | `shared/ui/Opciones*.tsx` |
| Elegir entre muchas, con búsqueda | `Seleccion` | `shared/ui/Seleccion.tsx` |
| Avisar sin cortar el trabajo (flotante, arriba a la derecha) | `toast()` | `hooks/use-toast` + `components/ui/toaster.tsx` |
| Lista + tablero + detalle de tareas | `VistaTareas` (y sus piezas) | `shared/ui/tablero/` |
| Una decisión que exige datos al mover | `DialogoTransicion` | `shared/ui/tablero/` |
| Esqueleto con la forma de la pantalla | `EsqueletoCurso`, `…PaginaLista`, `…Detalle`… | `shared/ui/EsqueletoPantalla.tsx` |
| Elegir entre pocas, sin buscar | `Desplegable` | `shared/ui/Desplegable.tsx` |
| Una fecha | `DatePicker` | `shared/ui/DatePicker.tsx` |
| Una contraseña | `EntradaClave` | `shared/ui/EntradaClave.tsx` |
| Confirmar una afirmación | `Casilla` | `shared/ui/Casilla.tsx` |
| El estado de una fila | `Pill` | `shared/ui/Pill.tsx` |
| Un mensaje que para la lectura | `Aviso` | `shared/ui/Aviso.tsx` |
| Una lista sin nada | `EstadoVacio` | `shared/ui/EstadoVacio.tsx` |
| Carga de una forma conocida | `Esqueleto` | `shared/ui/Esqueleto.tsx` |
| Listar registros | `TablaDatos` | `shared/ui/TablaDatos.tsx` |
| Vistas hermanas | `Pestanas` | `shared/ui/Pestanas.tsx` |
| Un bloque largo que se pliega | `SeccionPlegable` | `shared/ui/SeccionPlegable.tsx` |
| Cuánto (porcentaje) | `BarraProgreso` / `AnilloProgreso` | `shared/ui/Progreso.tsx` |
| Cuántos y cuál (pasos) | `PasosCurso` | `shared/ui/PasosCurso.tsx` |
| Una cifra que acaba de resultar | `NumeroQueCuenta` | `shared/ui/NumeroQueCuenta.tsx` |
| Una cifra que es el punto | `IndicadorKpi` | `shared/ui/IndicadorKpi.tsx` |
| Una decisión corta | `DialogoCasa` | `shared/ui/DialogoCasa.tsx` |
| Crear/editar con varios campos | `PanelLateral` | `shared/ui/PanelLateral.tsx` |
| Una imagen de estado | `Illustration` + nombre del registro | `shared/ui/illustration/` |
| Un icono con fondo | `AzulejoIcono` | `shared/ui/AzulejoIcono.tsx` |

## 4. Cómo se añade una pieza nueva

1. **Confirma que el hueco es real.** Busca en el catálogo y en `shared/ui`. Si
   una pieza existente casi sirve, se extiende con una propiedad (opt-in); no se
   duplica.
2. **Nombre en español**, por lo que es y no por cómo se ve (`PasosCurso`, no
   `SegmentedBar`).
3. **Vive en `src/shared/ui/`.** Nunca dentro de una pantalla si la usará más de
   una.
4. **Cabecera de documentación** al inicio del archivo: qué es, **por qué
   existe** (qué defecto o repetición resuelve), qué NO hace, y la
   accesibilidad. Mira `PasosCurso.tsx` o `Caja.tsx` como modelo.
5. **Solo tokens.** Color `rel-*`, esquina `rounded-rel-*`, relieve
   `shadow-rel-*`, duración `duration-press|exit|enter|context`, curva
   `ease-rel-out` (el rebote `ease-rel-spring` solo en confirmaciones). Ningún
   hex, ningún `rem` suelto, ninguna duración en milisegundos.
6. **Objetivo táctil de 44 px** como mínimo (56 en la acción principal de
   móvil). El estado nunca se dice solo con color.
7. **Movimiento:** `motion-reduce:` siempre. En Tailwind 4, `translate-*`,
   `scale-*` y `rotate-*` escriben las propiedades `translate`/`scale`/`rotate`,
   **no** `transform`: una transición que nombre `transform` no las cubre (la
   guardia «la transición nombra la propiedad que la utilidad escribe» lo
   comprueba).
8. **Prueba** al lado (`Pieza.test.tsx`): comportamiento y accesibilidad, no
   clases decorativas. Sin `user-event`: se usa `fireEvent`.
9. **Entrada en el catálogo** (`CatalogoUiKitPage.tsx`): nombre, archivo, cuándo
   se usa, y la muestra real con sus estados.
10. **Verifica** (sección 7) y comprueba el resultado en pantalla, no solo la
    suite.

## 5. Ilustraciones

- Se piden **por nombre** al registro
  (`shared/ui/illustration/illustration.registry.ts`), nunca por ruta ni con
  `<img src>`. Claves nuevas en camelCase por **intención** (`evidenceReady`).
- Una sola familia visual: Soft Dimensional, turquesa de marca. No se inventan
  ilustraciones; si falta una, se pide a Diseño.
- Decorativa: `decorative` (alt vacío + `aria-hidden`). Informativa:
  `decorative={false}` con un `alt` que no repita el texto visible.
- **Ninguna** dentro de tablas densas, matrices, constructores, formularios
  densos ni modales CRUD. Sí en estados, vacíos, éxitos y la experiencia del
  participante.
- La ilustración **llena su superficie** (`size="full"` en una
  `IllustrationSurface`); un tamaño fijo pequeño en una caja grande se ve
  perdido.
- Presupuesto: hero < 250 KB, spot < 100 KB, ambient < 50 KB, WebP.

## 6. Iconos

- Una sola librería: Lucide. Tamaños de la escala (`h-4`, `h-5`, `h-6`…).
- Todo icono declara qué es: decorativo (`aria-hidden="true"`) o el control
  (con nombre accesible). La guardia «todo icono declara…» lo exige.
- El color lo da el significado (éxito, atención, peligro, información), no el
  gusto. El turquesa de marca no es el verde de éxito.

## 7. Verificación

```powershell
npx tsc --noEmit -p .
npx vitest run src/shared/ui        # incluye nucleo.test.ts (las guardias)
npm run build
```

- **`nucleo.test.ts` son las leyes del kit** (45 guardias). Si una falla, el
  mensaje dice qué ley rompiste y cómo se arregla; no se silencia ni se sube un
  contador para que pase.
- Lo visual se mira de verdad: capturas en **390, 768, 1024 y 1440 px**, y se
  mide `document.documentElement.scrollWidth` (no debe pasar del ancho).
- Una transición o animación se verifica con `el.getAnimations()`, no
  muestreando estilos con el reloj.

## 8. Lo que no se toca

- **Psicosocial**: ni componentes, ni scoring, ni baremos, ni textos
  certificados. Las piezas base compartidas (`components/ui`) se cambian con
  cuidado: Psicosocial las consume.
- **Credenciales**: nunca en documentos, commits ni mensajes.
- El ZIP de pantallas es inventario de alcance, no especificación visual.

## 9. Mantenimiento de esta guía

Cuando se añada o retire una pieza, se actualiza la **tabla de la sección 3** y
el catálogo. La guía es corta a propósito: el detalle de cada pieza vive en su
cabecera, donde no se desactualiza sin que se vea.
