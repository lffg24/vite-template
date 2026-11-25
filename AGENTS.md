# Instrucciones para agentes · frontend ABRIL-360

Aplica a Codex, Claude y cualquier agente que edite este repositorio.

## Antes de tocar la interfaz

1. Lee **`docs/GUIA_UI_KIT.md`**.
2. Abre el catálogo vivo (`npm run dev` → `/ui-kit`) y busca la pieza que
   necesitas. **Si existe, se usa; si no, se crea en `src/shared/ui/` y se suma
   al catálogo en el mismo cambio.**
3. La skill `abril360-ui-kit` (`.agents/skills/` o `.claude/skills/`) resume
   las leyes; las comprueba `src/shared/ui/nucleo.test.ts`.

## Verificación mínima

```
npx tsc --noEmit -p .
npx vitest run src/shared/ui
npm run build
```

Y mirar el resultado en 390, 768, 1024 y 1440 px.

## Límites

- No se toca Psicosocial (componentes, scoring, baremos, textos certificados).
- No se escriben credenciales en documentos, commits ni mensajes.
- Trabajo en ramas locales; el push y los PR los decide la persona.
- Comentarios y documentación en español; mensajes de commit en inglés.

## Ciclo de vida de las ramas

- Una rama nace de `main`, con nombre `tipo/tema-AAAAMMDD` (`ux/…`, `fix/…`,
  `qa/…`), y vive el tiempo de **un** tema. Nunca se trabaja sobre una rama
  existente o compartida: cada agente abre la suya en su propio worktree.
- **Cuando se aprueba y se fusiona en `main`, se cierra**: se borra la rama
  remota, la local y el worktree. Una rama aprobada que sigue viva es deuda.
- Antes de borrar, se comprueba que todo su contenido ya está en `main`
  (`git rev-list --count origin/main..rama` = 0, o `git cherry origin/main rama`
  sin líneas `+`). Se deja constancia con los SHA en `docs/CIERRE_RAMAS_*.md`
  para poder restaurar.
- No se borran `main`, `preprod`, las ramas `release/*` ni `integration/*`.
- Las ramas `respaldo/*` son copias de seguridad temporales: se revisan y se
  cierran cuando la persona confirma que su contenido ya está a salvo en otra
  parte.
