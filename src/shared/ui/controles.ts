// src/shared/ui/controles.ts
//
// El aspecto del control de formulario. Una vez.
//
// ## Por qué hacía falta
//
// `Textarea` lleva escrito en su propio comentario el defecto que arregló:
// «antes divergían en TODO lo que se percibe: `rounded-md` frente a
// `rounded-lg`, fondo transparente frente a `bg-surface`, anillo de foco de
// 1 px frente a 4, y ninguna señal al pasar el puntero». Se homologó copiando
// las clases de `Input` carácter por carácter.
//
// Copiar funciona una vez. **El desplegable se quedó fuera**, y ahí la copia
// se multiplicó: dieciocho `<select>` nativos con CINCO apariencias, y
// ninguna igual a la del campo de texto que tienen al lado:
//
//   - Seis miden 44 px de alto junto a campos de texto de 40 px. Cuatro
//     píxeles de diferencia entre dos controles de la misma fila.
//   - Trece conservan el anillo de foco de 2 px al 20 %. `Input` lo subió a
//     4 px al 25 % porque **el de 2 px apenas se veía sobre fondo blanco**, y
//     eso está escrito en su comentario. El desplegable nunca lo recibió.
//   - Once reciben `disabled` y **ninguno tiene aspecto de deshabilitado**:
//     sin clases `disabled:`, un `select` bloqueado se ve exactamente igual
//     que uno operable. Se hace clic y no pasa nada.
//   - Cinco usan `rounded-md`, que no es otro nombre del radio de control:
//     son 2 px menos. Esquina distinta a la del campo de al lado.
//
// Y tres de las diferencias eran solo de nombre: `--input` y `--border` tienen
// el mismo valor en claro y en oscuro, y `--rel-dark` ES `--foreground`. El
// mismo color con tres nombres no se puede comparar leyendo el código.
//
// ## Lo que decide este módulo
//
//   - **No lleva alto.** Cada pieza pone el suyo, porque un campo de una
//     línea, un área de texto y un desplegable no miden lo mismo. Todo lo
//     demás —borde, fondo, tipografía, radio, foco, inválido, deshabilitado,
//     transición— sale de aquí.
//   - **El control no tiene relieve.** `Input` y `Textarea` llevaban
//     `shadow-sm`, que es la sombra negra de Tailwind al 5 %, y un
//     desplegable llevaba `shadow-rel-card`: una sombra de tarjeta de 24 px
//     bajo un control de 40 px. La señal de un control es su borde, su cambio
//     al pasar el puntero y su anillo de foco; no una elevación.

/** Borde, fondo, tipografía, radio, foco, inválido y deshabilitado. Sin alto. */
export const CLASE_CONTROL =
  "w-full rounded-rel-control border border-input bg-surface px-3 py-2 font-body text-base text-foreground " +
  "transition-[border-color,box-shadow,background-color] duration-rel-micro ease-rel-out " +
  "placeholder:text-muted-foreground hover:border-border-strong " +
  "focus-visible:outline-none focus-visible:border-input-focus focus-visible:ring-4 focus-visible:ring-input-focus/25 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25 " +
  "disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-50 " +
  "motion-reduce:transition-none md:text-sm";
