# SPEC 04 — Integración base con Supabase

> **Estado:** Aprobado
> **Depende de:** Ninguna (infraestructura; reutiliza la convención de `.env.local` de la SPEC 03)
> **Fecha:** 2026-10-27
> **Objetivo:** Dejar el proyecto Next.js listo para usar el proyecto de Supabase existente (dependencias, variables de entorno, clientes de navegador y servidor, y documentación), sin cambiar ninguna pantalla ni crear tablas.

---

## Por qué existe esta spec

El proyecto de Supabase ya existe (ref `ffpkjrmhlpjyljezclcf`, enlazado en `.mcp.json`) y su base está vacía. Las specs futuras (autenticación, puntuaciones reales, Realtime, Edge Functions) necesitan una base común. Esta spec fija solo esa base y deja cada funcionalidad para su propia spec.

---

## Alcance

**Dentro:**

- Instalar las dependencias `@supabase/supabase-js` y `@supabase/ssr`, y nada más.
- Variables de entorno públicas, ambas con prefijo `NEXT_PUBLIC_`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Añadirlas a `.env.local` (ignorado por git) y crear `.env.example` versionado con los mismos nombres y los valores públicos del proyecto.
- Excepción en `.gitignore` (`!.env.example`) para poder versionar `.env.example`, ya que `.env*` está ignorado.
- Cliente de navegador en `lib/supabase/client.ts`: exporta `createClient`, que usa `createBrowserClient` de `@supabase/ssr` con las dos variables públicas.
- Cliente de servidor en `lib/supabase/server.ts`: exporta `createClient`, que usa `createServerClient` de `@supabase/ssr` con las dos variables públicas y las cookies de `next/headers`.
- Documentar en `CLAUDE.md`: el proyecto Supabase, las variables de entorno, los dos clientes y cómo se usarán Realtime y Edge Functions desde el mismo cliente.

**Fuera de alcance (para futuras specs):**

- `proxy.ts` para refrescar la sesión de Auth.
- Usar los clientes en alguna pantalla o Server Action; se crean pero nada los importa todavía.
- Conectar `/acceso` o cualquier ruta `/auth` (login, registro, callbacks, redirecciones): requiere su propia spec con flujos, estados de error y redirecciones definidos explícitamente. `/acceso`, `SessionProvider` y la sesión simulada en `localStorage` quedan intactos.
- Tablas, esquema, políticas RLS y migraciones: la base sigue vacía y el modelo de datos se define en otra spec. Esta spec solo establece la conexión.
- Puntuaciones reales y catálogo de juegos en base de datos.
- Realtime y Edge Functions: sin código ni carpeta `supabase/functions/`.
- CLI de Supabase (`supabase/config.toml`, `supabase/migrations/`).
- Clave `service_role` o cualquier secreto de Supabase en el código o en `.env.example`.
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Esta feature no introduce datos persistentes ni tablas. Solo añade configuración y dos factorías de cliente, sin tipos de base de datos (no hay esquema todavía):

```ts
// lib/supabase/client.ts  (navegador)
export function createClient(): SupabaseClient;

// lib/supabase/server.ts  (servidor; asíncrona porque cookies() de Next 16 lo es)
export async function createClient(): Promise<SupabaseClient>;
```

Variables de entorno:

| Variable                               | Obligatoria | Valor                                              |
| -------------------------------------- | ----------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Sí          | `https://ffpkjrmhlpjyljezclcf.supabase.co`         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí          | Clave publicable del proyecto (`sb_publishable_…`) |

Convenciones:

- Se usa la clave **publicable**, no la `anon` heredada.
- Ambas variables son públicas por diseño: acaban en el bundle del cliente. La seguridad de los datos depende de RLS en las specs futuras, no de ocultar estas claves.
- `SUPABASE_DB_PASSWORD` (ya presente en `.env.local`) es un secreto, no se copia a `.env.example` ni se expone con `NEXT_PUBLIC_`.
- No se genera `database.types.ts` ni se usa un tipo `Database`; los tipos nacen con el esquema, en la spec que lo defina.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` la guía de variables de entorno y, en la documentación de Supabase (`search_docs`), la guía de `@supabase/ssr` para Next.js. Sin cambios en el repo.
2. Instalar las dependencias: `npm install @supabase/supabase-js @supabase/ssr`. Verificación: ambas aparecen en `package.json` y `npx tsc --noEmit` no da errores.
3. Obtener la URL y la clave publicable con las herramientas MCP (`get_project_url`, `get_publishable_keys`) y añadir las dos variables a `.env.local`. Verificación: `.env.local` no aparece en `git status`.
4. Crear `.env.example` con las dos variables y añadir `!.env.example` a `.gitignore`. Verificación: `git status` muestra `.env.example` y no `.env.local`.
5. Crear `lib/supabase/client.ts` con `createClient` basado en `createBrowserClient`. Verificación: `npx tsc --noEmit` y `npx eslint lib` sin errores.
6. Crear `lib/supabase/server.ts` con `createClient` basado en `createServerClient` y con los métodos de cookies de `next/headers` según la guía de `@supabase/ssr` leída en el paso 1. Verificación: `npx tsc --noEmit` y `npx eslint lib` sin errores.
7. Actualizar `CLAUDE.md` (proyecto Supabase, variables, los dos clientes y cuál usar en cada caso, uso futuro de Realtime y Edge Functions con el mismo cliente, y que la sesión sigue simulada). Verificación: el documento refleja todo lo anterior.

---

## Criterios de aceptación

- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr` y ninguna otra dependencia nueva.
- [ ] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores.
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y `git status` no lo lista.
- [ ] `.env.example` está versionado, contiene solo esas dos variables y no incluye `SUPABASE_DB_PASSWORD`, `service_role` ni la clave `anon` heredada.
- [ ] No existe `lib/supabase/database.types.ts` y ningún archivo usa un tipo `Database`.
- [ ] `list_tables` del MCP de Supabase sigue devolviendo una lista vacía.
- [ ] `lib/supabase/client.ts` exporta `createClient`, implementado con `createBrowserClient`.
- [ ] Ningún archivo del repo importa `createClient` de `@supabase/supabase-js`; solo `@supabase/ssr` se importa desde `lib/supabase/`.
- [ ] `lib/supabase/server.ts` exporta `createClient`, implementado con `createServerClient`, y lee las cookies con `next/headers`.
- [ ] `client.ts` no importa `next/headers` y `server.ts` no usa `"use client"`.
- [ ] No existen `proxy.ts`, `supabase/functions/` ni `supabase/migrations/`.
- [ ] Ningún archivo bajo `app/` importa de `lib/supabase/`, y ninguno cambia: `git diff --stat` solo muestra `package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `lib/supabase/` (`client.ts`, `server.ts`), `CLAUDE.md` y `specs/`.
- [ ] `npm run dev` arranca y `/`, `/biblioteca`, `/acceso` y `/acerca` responden 200 sin errores en la consola.
- [ ] `CLAUDE.md` documenta las dos variables, los dos clientes y el uso futuro de Realtime y Edge Functions.

---

## Decisiones

- **Sí:** instalar solo `@supabase/supabase-js` y `@supabase/ssr`, sin otras dependencias.
- **Sí:** crear `lib/supabase/client.ts` y `lib/supabase/server.ts`, cada uno exportando `createClient` (decisión del usuario tras cerrar el borrador inicial). Las specs futuras parten de la misma factoría.
- **Sí:** los clientes se crean solo con `@supabase/ssr` (`createBrowserClient` y `createServerClient`), que gestiona las cookies y la sesión correctamente en el App Router de Next.js. **No:** instanciar `createClient` de `@supabase/supabase-js` directamente, ni en el código ni en la verificación; el paquete se instala porque `@supabase/ssr` lo necesita, pero la app no lo importa.
- **Sí:** esta spec solo establece la conexión. **No:** definir tablas, esquema o RLS (otra spec define el modelo de datos), ni conectar `/acceso` o rutas `/auth` (otra spec define flujos, errores y redirecciones). **No:** `proxy.ts` todavía; el refresco de sesión corresponde a la spec de Auth. **No:** importar los clientes desde `app/`, que seguirá igual.
- **Sí:** ambas variables públicas con `NEXT_PUBLIC_`. Son claves diseñadas para el navegador y las specs futuras usarán el cliente en el cliente. **No:** variables solo de servidor, que habría que duplicar después.
- **Sí:** clave publicable (`sb_publishable_…`). Es el formato actual de Supabase. **No:** la `anon` heredada, que sigue activa pero es el formato antiguo.
- **Sí:** `.env.example` versionado con valores públicos. Documenta la configuración necesaria en un entorno nuevo. **No:** incluir secretos; `SUPABASE_DB_PASSWORD` se queda solo en `.env.local`.
- **No:** generar `database.types.ts` ni tipar los clientes con `Database`. Sin esquema el archivo sería un cascarón vacío; los tipos se generan en la spec que defina el modelo de datos.
- **Sí:** no crear tablas. La primera llega con la spec de puntuaciones, que decide su esquema y RLS. **No:** migración de prueba.
- **Sí:** Realtime y Edge Functions solo documentadas. Ambas se usan con el mismo cliente de Supabase y no necesitan configuración previa. **No:** inicializar la CLI ni crear `supabase/functions/` sin una función concreta.
- **No:** verificación puntual de la conexión en esta spec (decisión del usuario). La validación queda en `tsc`, ESLint y el arranque de la app; la conexión se comprobará en la primera spec que use los clientes.
- **Sí:** mantener la sesión simulada con `localStorage`. Migrarla es el objetivo de la spec de Auth.

---

## Riesgos

| Riesgo                                                                                                        | Mitigación                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `.gitignore` ignora `.env*` y el `.env.example` no se versiona.                                               | Excepción `!.env.example` y comprobación en `git status` (paso 4).                                                 |
| Confundir las claves públicas con secretos, o exponer por error `service_role` o la contraseña de la base.    | Solo el prefijo `NEXT_PUBLIC_` en las dos claves públicas, y `.env.example` sin secretos (criterio de aceptación). |
| Las claves públicas en el bundle permiten acceder a datos si luego se crean tablas sin RLS.                   | La base está vacía ahora; toda spec que cree tablas debe activar RLS desde la migración.                           |
| Versiones de `@supabase/ssr` y Next 16.4.2 con `cacheComponents` más recientes que la documentación conocida. | El paso 1 obliga a leer las guías antes de escribir los clientes; `tsc` y ESLint validan su forma (pasos 5 y 6).   |
| Sin `proxy.ts`, los tokens de sesión del servidor no se refrescan.                                            | Aceptado: nada usa Auth todavía; el proxy entra en la spec de Auth.                                                |
| El cliente de servidor usa `cookies()` y con `cacheComponents` solo puede llamarse en contexto dinámico.      | Documentarlo en `CLAUDE.md`; ninguna página lo importa en esta spec.                                               |

---

## Lo que **no** entra en esta spec

- `proxy.ts` y cualquier uso de los clientes en pantallas o Server Actions.
- Autenticación real, rutas `/auth` y cambios en `/acceso` o `SessionProvider` (otra spec con flujos, errores y redirecciones).
- Tablas, esquema, RLS y migraciones (el modelo de datos va en otra spec).
- Puntuaciones reales o catálogo de juegos en base de datos.
- Realtime y Edge Functions (solo documentación).
- CLI de Supabase y carpeta `supabase/`.
- Secretos de Supabase en el repositorio.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
