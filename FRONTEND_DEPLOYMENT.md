# ABRIL-360 Frontend Deployment

Guia operativa para desarrollo local, build productivo y despliegue continuo del frontend React/Vite/TypeScript en Cloudflare Pages.

## Stack y alcance

- Frontend: React + Vite + TypeScript
- Hosting objetivo: Cloudflare Pages
- Backend productivo: `https://eva-360-production.up.railway.app`
- No usar Cloudflare Workers ni `wrangler deploy` para este frontend.
- No versionar secretos ni variables privadas del backend.

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Crear o validar `.env.local` local, sin versionarlo:

```bash
VITE_API_URL=http://localhost:8000
```

Levantar Vite:

```bash
npm run dev
```

La aplicacion debe quedar disponible en:

```text
http://localhost:5173
```

Para probar temporalmente contra Railway desde local:

```bash
VITE_API_URL=https://eva-360-production.up.railway.app
```

## Build productivo

Ejecutar:

```bash
npm run build
```

El build valida TypeScript con `tsc` y genera la salida en:

```text
dist/
```

Preview local del build:

```bash
npm run preview
```

## Configuracion de API

La URL de API se centraliza en:

```text
src/lib/config.ts
```

La variable requerida es publica de Vite:

```text
VITE_API_URL
```

No hardcodear URLs de API en componentes. Las llamadas deben usar la configuracion centralizada o clientes/servicios que importen `API_URL`.

## Cloudflare Pages

Configuracion recomendada:

```text
Project name: abril-360
Production branch: main
Framework preset: React (Vite)
Build command: npm run build
Build output directory: dist
Root directory: frontend
```

Variable de entorno de produccion:

```text
VITE_API_URL=/api
BACKEND_URL=https://eva-360-production.up.railway.app
```

En Cloudflare Pages, el frontend debe consumir `/api`. La funcion
`functions/api/[[path]].js` proxyea esas llamadas al backend Railway. Esto evita
que Safari/iOS trate la cookie HttpOnly de sesion como cookie de terceros.

No configurar en Cloudflare Pages:

- `DATABASE_URL`
- `JWT_SECRET`
- Variables privadas de Railway
- Secretos del backend

## SPA routing

El archivo `public/_redirects` evita 404 al refrescar rutas internas:

```text
/* /index.html 200
```

Debe quedar copiado automaticamente dentro de `dist/_redirects` despues de `npm run build`.

## Coordinacion CORS con backend

Cuando Cloudflare Pages este desplegado, el backend en Railway debe permitir el origen:

```text
CORS_ALLOW_ORIGINS=https://abril-360.pages.dev
```

Cuando se configure dominio propio:

```text
CORS_ALLOW_ORIGINS=https://app.abril360.com
```

Para preview deployments de Cloudflare, usar una estrategia controlada de allowlist o patron seguro. Evitar dejar `*` permanentemente si se usan cookies, credenciales o datos sensibles.

## Validacion de produccion

Despues de desplegar:

1. Abrir `https://abril-360.pages.dev`.
2. Validar `/login`.
3. Refrescar una ruta interna como `/dashboard` y confirmar que no devuelve 404.
4. Iniciar sesion o validar `/auth/me` segun el flujo actual.
5. Confirmar en Network que las llamadas del navegador apuntan a `/api/*`.
6. Confirmar que la funcion de Pages proxyea al backend Railway.

## Troubleshooting

### Error de CORS

Sintoma: el navegador bloquea llamadas a Railway.

Accion: pedir al agente backend ajustar `CORS_ALLOW_ORIGINS` con el dominio exacto de Cloudflare Pages o del dominio propio.

### 404 al refrescar rutas

Sintoma: `/login`, `/dashboard` u otra ruta interna funciona navegando desde la app, pero falla al refrescar.

Accion: confirmar que `public/_redirects` existe y que `dist/_redirects` fue generado con `/* /index.html 200`.

### `VITE_API_URL` mal configurado

Sintoma: llamadas API van a localhost en produccion o a un host incorrecto.

Accion: revisar la variable de entorno en Cloudflare Pages y redeployar. En Vite, las variables quedan embebidas en build time.

### Build falla por TypeScript

Sintoma: `npm run build` falla durante `tsc`.

Accion: corregir tipos/imports rotos en lugar de ocultar errores eliminando validaciones importantes.

### Repo incorrecto o template vacio

Sintoma: faltan `src/`, `public/`, `index.html`, `vite.config.ts` o componentes reales de ABRIL-360.

Accion: restaurar el frontend real antes de configurar Cloudflare Pages. Si el frontend vive en una subcarpeta, configurar esa carpeta como Root directory.
