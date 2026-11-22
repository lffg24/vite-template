# Actualización de dependencias mayores · 2026-11-21

Rama `chore/deps-mayores-20261121` (desde `ux/homologacion-estilos-20261115`).
Un commit por paquete, para poder revertir uno solo.

| Paquete | De → a | Qué hizo falta |
|---|---|---|
| jsdom | 26 → 29.1 | El `Blob` de jsdom 29 ya no tiene `stream()`, que `Response` de Node necesita. La prueba de `psicoInformesIndividualesService` arma el cuerpo con bytes (`Uint8Array`). |
| msw | 2 → 3.0.7 | Nada: ningún archivo del repo lo importa hoy. Queda al día como devDependency. |
| lucide-react | 0.503 → 1.77 | Nada: `tsc`, pruebas y build pasan; no se usaba ningún icono de marca (retirados en 1.x). |
| react / react-dom | 18.3 → 19.3.1 | Nada de código. `@types/react` y `@types/react-dom` pasan a 19.3.0 (dependencias, `resolutions` y `overrides`). |

Notas
- `npm i` falló con msw 3 (error interno de npm al resolver `overrides`); se resolvió con `--legacy-peer-deps`. `yarn.lock` se sincroniza solo; ambos lockfiles van en cada commit.
- jsdom quedó en 29 a petición; la última es 31.
- Verificación: `npx tsc --noEmit -p .` limpio, 542 pruebas verdes (106 archivos), `npm run build` correcto, `/ui-kit` abre sin errores de React en consola.
- No se probó contra el backend ni se recorrió cada pantalla: conviene una pasada visual por Psicosocial y Capacitaciones antes de fusionar.
