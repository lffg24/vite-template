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
