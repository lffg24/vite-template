---
name: abril360-ui-kit
description: Reglas del UI kit del frontend de ABRIL-360 (Abril360). Usar SIEMPRE antes de crear o modificar una pantalla, un componente visual, un estado vacío, una tabla, un formulario, una animación o un icono del frontend; y al revisar trabajo visual de otro agente. Dice qué pieza usar, cómo añadir una nueva al kit y cómo verificarla.
---

# ABRIL-360 · UI kit

La fuente completa es **`docs/GUIA_UI_KIT.md`** (en este repositorio). Léela
entera la primera vez; aquí va lo que más se rompe.

## Antes de escribir nada

1. Abre el catálogo vivo: `npm run dev` y `/ui-kit`. Busca la pieza.
2. **Si existe, se usa.** No se dibuja a mano una caja, botón, tabla, campo,
   estado vacío, aviso, pestaña o modal que el kit ya resuelve.
3. **Si no existe**, se crea en `src/shared/ui/` (nombre en español, por lo que
   es), con cabecera que explique *por qué existe*, prueba al lado y entrada en
   `src/pages/dev/CatalogoUiKitPage.tsx` en el **mismo cambio**.

## Leyes duras (las comprueba `src/shared/ui/nucleo.test.ts`)

- Solo tokens: color `rel-*`, esquina `rounded-rel-*`, relieve `shadow-rel-*`,
  duración `duration-press|exit|enter|context`, curva `ease-rel-out`. Ningún
  hex, `rem` suelto ni milisegundos escritos a mano.
- Control de 44 px; la acción principal de móvil, 56. El estado nunca solo con
  color.
- **Tailwind 4:** `translate-*`, `scale-*`, `rotate-*` escriben esas propiedades,
  no `transform`. Una transición que nombre `transform` no las anima.
- Movimiento: siempre `motion-reduce:`. Entrar 220 ms, cambiar de contexto
  280 ms, pulsar 90 ms. Rebote solo en confirmaciones.
- Todo icono declara si es decorativo (`aria-hidden`) o el control (con nombre).
- Ilustraciones **por nombre del registro**, nunca por ruta. Ninguna en tablas
  densas, constructores, formularios densos ni modales CRUD. Se piden a Diseño;
  no se inventan.
- No se toca Psicosocial, scoring, baremos ni credenciales.

## Verificar

```
npx tsc --noEmit -p .
npx vitest run src/shared/ui
npm run build
```

Y mirar de verdad en **390, 768, 1024 y 1440 px**, midiendo `scrollWidth`. Una
animación se verifica con `getAnimations()`, no muestreando estilos.

Complementa a la skill `abril360-ilustraciones` (que gobierna dónde y cómo van
las ilustraciones).
