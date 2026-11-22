# Hand-off para Codex · Licitaciones sobre el kit de tareas

Fecha: 2026-11-21 · Rama: `ux/licitaciones-tablero-20261121` (frontend,
`lffg24/vite-template`) · Autor: Claude, con la persona dueña del producto.

## Comentario (qué pasó)

La persona pidió que la vista de Licitaciones se ofrezca **como lista y como
tablero tipo Jira**, con modales, acciones e información de cargos, y que los
componentes sean **reutilizables** para un futuro gestor de tareas.

Se hizo así, **sin tocar tu rama** `codex/licitaciones-piloto-ui` (la regla es no
trabajar sobre ramas ajenas): se creó una rama nueva desde la rama de UX/UI
(`ux/homologacion-estilos-20261115`) y se **fusionó tu piloto** en ella. El único
conflicto fue `navigationTree.ts` (se conservaron CX y Licitaciones).

### Lo que ya existe (kit reutilizable, `src/shared/ui/tablero/`)

| Pieza | Qué hace |
|---|---|
| `TareaVista` (`modelo.ts`) | Forma común de «una tarea»: clave, título, columna, prioridad, etiquetas, responsables, vence, conteos, `bloqueada`, `origen`. |
| `VistaTareas` | Barra (buscar, filtro, conmutador Lista/Tablero con memoria) + vista + detalle. |
| `Tablero` / `TarjetaTarea` | Columnas por estado, arrastre (ratón, táctil con pulsación larga, teclado), menú «Mover a…», límites por columna. |
| `ListaTareas` | La misma colección en `TablaDatos` (orden, paginación, tarjetas en móvil). |
| `PanelTarea` | Detalle lateral con Detalle/Actividad (alternativa: `alAbrirTarea` para un detalle propio). |
| `DialogoTransicion` | Diálogo cuando mover **exige datos**; espera al servidor; si falla conserva lo escrito. |

Catálogo vivo: `npm run dev` → `/ui-kit` (sección «Tareas y tableros»). Guía:
`docs/GUIA_UI_KIT.md`.

### Lo que cambió en Licitaciones

- `src/features/licitaciones/adaptador.ts` (+ test): `Opportunity → TareaVista`,
  columnas del flujo y **reglas de movimiento**.
- `src/pages/licitaciones/LicitacionesPage.tsx`: usa `PageHeader`, `IndicadorKpi`,
  `Aviso`, `VistaTareas`, `DialogoTransicion` y `Desplegable`. **Se conservó tu
  Sheet de evidencia, revisión humana y decisión** (`alAbrirTarea`).
- No se tocó ningún servicio, endpoint ni permiso. `service.ts` y
  `reviewValue.ts` quedan igual.

### Reglas del flujo (en `adaptador.ts`, para que las revises)

- Columnas: `NUEVA → EN_REVISION → GO | GO_CON_ALIADO | NO_GO | DESCARTADA`.
- La columna es la `decision` si existe; si no, `workflow_state` (desconocido →
  `EN_REVISION`).
- **Solo se llega arrastrando a columnas de decisión.** Soltar en una de ellas
  abre `DialogoTransicion` (código de motivo + justificación) y llama a tu
  `closeDecision` con `row_version` y `Idempotency-Key`. Los errores del servicio
  (p. ej. GO sin apertura/admisión verificadas) se muestran en el diálogo.
- No se puede arrastrar a `NUEVA`/`EN_REVISION` (las pone el servicio al
  revisar), ni reabrir una decisión cerrada, ni cerrar sin
  `licitaciones.decision.close` o `licitaciones.admin`.

## Pendiente / decisiones para ti

1. Confirmar que el backend acepta GO/NO GO desde el tablero con el mismo
   contrato que el formulario del Sheet (se reutiliza `closeDecision`).
2. Si quieres otros flujos arrastrables (p. ej. asignar responsable), son otra
   «transición con diálogo»: ver `DemoTablero.tsx`.
3. `Opportunity` no trae prioridad ni responsables; el kit los soporta si el
   servicio los añade (el filtro de prioridad aparece solo cuando existen).
4. Revisar con permisos reales y datos reales; aquí se verificó con respuestas
   simuladas en 390/1440 px y 548 pruebas verdes.

## Prompt para pegar en Codex

```
Contexto: la rama `ux/licitaciones-tablero-20261121` del frontend integra tu
piloto `codex/licitaciones-piloto-ui` con el kit de tareas reutilizable
(`src/shared/ui/tablero/`). Lee `docs/HANDOFF_CODEX_LICITACIONES_20261121.md`
y `docs/GUIA_UI_KIT.md` antes de tocar nada.

No trabajes sobre mi rama ni sobre `ux/homologacion-estilos-20261115`: abre tu
propio worktree y rama desde `ux/licitaciones-tablero-20261121`.

Tareas:
1. Revisa `src/features/licitaciones/adaptador.ts` (reglas de movimiento) contra
   el contrato real del microservicio y corrige lo que no coincida.
2. Comprueba con el backend (BFF) que cerrar decisión desde el tablero funciona:
   `closeDecision` con `row_version` y `Idempotency-Key`, GO exige apertura y
   admisión verificadas, y los errores llegan legibles al diálogo.
3. Si el servicio puede dar prioridad y responsables por oportunidad, añádelos a
   `aTarea`; el kit ya los pinta.
4. No cambies el kit (`shared/ui/tablero`) salvo para un defecto; si falta algo,
   propónlo como pieza nueva y súmala al catálogo `/ui-kit`.
5. Verifica: `npx tsc --noEmit -p .`, `npx vitest run`, y mira `/licitaciones` en
   390 y 1440 px.

Límites: no push, no PR, no merge, no despliegue; no toques Psicosocial ni
credenciales; comentarios en español y commits en inglés.
```
