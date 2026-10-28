# SPEC 06 — Tablas `games` y `scores` en Supabase y leaderboard real (global y por juego)

> **Estado:** Implementado
> **Depende de:** SPEC 01 (`01-mvp-pantallas-visuales.md`), SPEC 04 (`04-integracion-supabase.md`), SPEC 05 (`05-juego-rocas-asteroides.md`)
> **Fecha:** 2026-10-28
> **Objetivo:** Crear en Supabase las tablas `games` (referencia de los juegos con ranking, hoy solo `rocas`) y `scores`, guardar allí las puntuaciones de `rocas` y conectar `/salon` y el top de `/juegos/[id]` a un leaderboard real, global (suma de la mejor marca por juego) y por juego (top 10).

---

## Por qué existe esta spec

`/salon` y el `Leaderboard` de `/juegos/[id]` ya existen y están enlazados en la navegación, pero pintan datos inventados (`seededScores`), y las puntuaciones guardadas viven solo en `localStorage` (`av_scores`). Desde la SPEC 05 hay un juego real (`rocas`) que produce puntuaciones de verdad. Esta spec crea la primera parte de la base de datos y cierra el ciclo jugar → guardar → ver el ranking, sin introducir Auth.

---

## Alcance

**Dentro:**

- Migración en Supabase (aplicada con el MCP, `apply_migration`) con dos tablas y ninguna más:
  - `games`: guarda las referencias de los juegos que tenemos con puntuaciones reales. Hoy una sola fila, `rocas`. Es la tabla que define qué juegos tienen ranking.
  - `scores`: una fila por partida guardada (todas las partidas se conservan), con `game_id` como clave foránea a `games.id`.
- **Sin RLS por ahora** (decisión del usuario): las tablas `games` y `scores` se crean sin `enable row level security` y sin políticas; configurarlo queda para una spec posterior. Hasta entonces la clave publicable puede leer y escribir ambas.
- Dos vistas para el ranking:
  - `game_leaderboard`: mejor marca de cada jugador en cada juego.
  - `global_leaderboard`: por jugador, la suma de sus mejores marcas por juego.
- Escritura por Server Action: `submitScore` en `app/juegos/[id]/jugar/actions.ts` valida e inserta con el cliente de servidor existente (`lib/supabase/server.ts`, clave publicable); no hay clave secreta.
- Generar `lib/supabase/database.types.ts` con el MCP (`generate_typescript_types`) y tipar los tres clientes con `Database`.
- `GamePlayer`: para los juegos de `PLAYABLE_GAMES` (hoy `rocas`) el botón GUARDAR PUNTUACIÓN llama a `submitScore`, con estados guardando, guardado y error. Los juegos con placeholder siguen guardando en `localStorage` con `saveScore` de `useSession()`.
- `/salon` pasa a leer de Supabase: pestaña **GLOBAL** más una pestaña por cada fila de `games` (hoy solo `rocas`, con el título de la tabla), con top 10 y podio. Solo se listan los juegos reales y jugables: no aparecen pestañas de los juegos del catálogo que siguen siendo placeholder. Con 0 filas no hay podio ni tabla, solo el mensaje "Sé el primero en entrar al salón de la fama", sin puntuaciones falsas.
- `/juegos/[id]`: el componente `Leaderboard` muestra el top 10 real si el juego tiene fila en `games`, y un mensaje de "sin puntuaciones reales todavía" si no.
- Recordar el nombre del jugador: la clave `av_player_name` de `localStorage` guarda el último nombre guardado con éxito; al abrir el modal de fin de partida el campo ya viene relleno con él, de modo que solo hay que pulsar GUARDAR PUNTUACIÓN. Ese nombre es el que `submitScore` envía y guarda en `scores.player_name`. Sin nombre recordado, el campo usa el nombre de la sesión simulada o `INVITADO`, como hoy. Se recuerda también con los juegos placeholder.
- Eliminar `seededScores` y `PLAYERS` de `app/data/scores.ts` si dejan de importarse.
- Actualizar `CLAUDE.md`.

**Fuera de alcance (para futuras specs):**

- RLS, políticas y permisos (`grant`/`revoke`) sobre `scores` y las vistas: se configuran en una spec posterior.
- Autenticación real, `user_id` en `scores` y migrar `SessionProvider` (`/acceso` sigue simulado).
- Mover el catálogo visual (biblioteca, detalle, portadas, `best`, `plays`) a la base de datos: `app/data/games.ts` sigue siendo la fuente de la biblioteca.
- Estadísticas reales (`best`, `plays` de las tarjetas y de la ficha siguen siendo mock).
- Landing (`/`): `app/data/activity.ts` (puntuaciones recientes y mejores jugadores) sigue siendo mock.
- Realtime (el ranking no se actualiza solo) y caché de lecturas.
- Verificación anti-trampas de la puntuación (el cliente reporta la puntuación; sin Auth ni servidor de juego no se puede comprobar).
- Limitación de frecuencia (rate limiting) y moderación de nombres.
- `proxy.ts`, Edge Functions, CLI de Supabase y carpeta `supabase/`.
- Cargar el catálogo de juegos desde Supabase (biblioteca, detalle y reproductor leyendo de la base): los juegos siguen en local (`app/data/games.ts`) por ahora. En esta spec `games` solo es la referencia de los juegos con ranking (`id`, `title`); la spec posterior la ampliará con las columnas del catálogo (descripciones, categoría, portada, color) y sembrará el resto de juegos.
- Un `plays` real.
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Migración `create_games_and_scores` (nombre en el historial del MCP; no se crea carpeta `supabase/`):

```sql
create table public.games (
  id         text primary key,
  title      text not null,
  created_at timestamptz not null default now()
);

insert into public.games (id, title) values ('rocas', 'ROCAS');

create table public.scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     text not null references public.games (id),
  player_name text not null
    check (player_name = upper(btrim(player_name)) and char_length(player_name) between 1 and 16),
  score       integer not null check (score between 0 and 9999999),
  created_at  timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc);

create view public.game_leaderboard as
  select distinct on (game_id, player_name)
         game_id, player_name, score as best_score, created_at
  from public.scores
  order by game_id, player_name, score desc, created_at asc;

create view public.global_leaderboard as
  select player_name,
         sum(best_score)::bigint as total_score,
         count(*)::int           as games_played
  from public.game_leaderboard
  group by player_name;
```

Tipos de aplicación (el tipo `ScoreRow` de `app/data/types.ts` se reutiliza para pintar):

```ts
// app/data/types.ts
export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

// lib/leaderboard.ts (solo servidor)
export type Board = { id: "global" | string; title: string; rows: ScoreRow[] };
export async function getBoards(): Promise<Board[]>; // GLOBAL + una por fila de `games`, top 10
export async function getGameBoard(gameId: string): Promise<ScoreRow[] | null>; // null si el juego no tiene fila en `games`

// app/juegos/[id]/jugar/actions.ts
export type SubmitScoreState = { ok: boolean; error?: string };
export async function submitScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<SubmitScoreState>;
```

Variables de entorno:

| Variable | Obligatoria | Dónde | Notas |
| -------- | ----------- | ----- | ----- |

Convenciones:

- El nombre del jugador se guarda en mayúsculas y sin espacios en los extremos; la restricción `check` lo garantiza. Es la clave de identidad del ranking (sin Auth, dos personas con el mismo nombre comparten marca).
- El rango se calcula por posición tras ordenar por `best_score` (o `total_score`) descendente y `created_at` ascendente como desempate, limitado a 10 filas.
- La fecha de cada fila se formatea `dd/mm/aaaa` (es-ES), como el mock actual.
- Las lecturas usan `lib/supabase/server.ts` y son dinámicas (`cookies()`), por lo que van dentro de `<Suspense>` con un esqueleto. No hay `"use cache"` en esta spec.
- No se añade ninguna variable de entorno nueva: se reutilizan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de la SPEC 04.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` las guías de Server Actions, `Suspense` con `cacheComponents` y acceso a datos dinámicos, y en la documentación de Supabase (`search_docs`) la de vistas. Sin cambios en el repo.
2. Aplicar la migración `create_games_and_scores` con `apply_migration`. Verificación: `list_tables` muestra `games` (1 fila, `rocas`) y `scores` (0 filas), más las dos vistas; el aviso de RLS desactivado de `get_advisors` es esperado.
3. Generar `lib/supabase/database.types.ts` con `generate_typescript_types` y tipar `client.ts` y `server.ts` con `Database`. Verificación: `npx tsc --noEmit` y `npx eslint lib`.
4. Crear `lib/leaderboard.ts` con `getBoards` y `getGameBoard` (lectura de las vistas, top 10, rango, formato de fecha). Verificación: `npx tsc --noEmit`.
5. Crear la Server Action `submitScore` con validación (el juego existe en `games`, nombre recortado de 1 a 16 caracteres y en mayúsculas, puntuación entera entre 0 y 9.999.999) y mensajes de error genéricos hacia el cliente (el detalle va a `console.error`). Verificación: `npx tsc --noEmit` y `npx eslint app`.
6. Conectar `GamePlayer`: si el juego está en `PLAYABLE_GAMES`, GUARDAR PUNTUACIÓN llama a `submitScore` (botón deshabilitado mientras guarda, mensaje de error si falla y permite reintentar, enlace a `/salon` tras guardar); si no, conserva `saveScore`. Limitar el campo de nombre a 16 caracteres. Crear `app/_components/use-player-name.ts` (`usePlayerName()` con `useSyncExternalStore` sobre `av_player_name`, para que el primer render del cliente coincida con el servidor) y usarlo así: el valor inicial del campo es el nombre recordado, luego el de la sesión y luego `INVITADO`; tras guardar con éxito se escribe en `av_player_name`. Verificación: jugar `rocas`, guardar y ver la fila en `scores` con `execute_sql`; `/juegos/serpentina/jugar` sigue guardando en `av_scores`.
7. Convertir `/salon` en Server Component que obtiene `getBoards()` dentro de `<Suspense>` y pasa los datos a `HallOfFame` (cliente, solo para las pestañas): pestaña GLOBAL primero, podio con huecos vacíos si hay menos de 3 filas, con 0 filas solo el mensaje "Sé el primero en entrar al salón de la fama" (sin podio ni cabecera de tabla), pestañas solo para GLOBAL y las filas de `games`, resaltado de la fila del usuario de sesión si está en el top y se elimina el bloque "TU MEJOR MARCA" falso. Verificación: `/salon` muestra la puntuación guardada en el paso 7 en GLOBAL y en ROCAS.
8. Conectar `/juegos/[id]`: `Leaderboard` recibe las filas de `getGameBoard(id)` dentro de `<Suspense>`; con `null` muestra "SIN PUNTUACIONES REALES TODAVÍA"; con lista vacía, el mensaje "Sé el primero en entrar al salón de la fama" en lugar de filas. Retirar `seededScores` y `PLAYERS` si ya no se importan. Verificación: `/juegos/rocas` muestra el top real y `/juegos/serpentina` el aviso.
9. Actualizar `CLAUDE.md` (tabla y vistas, sin RLS todavía, tipos generados, flujo de guardado, qué sigue siendo mock). Verificación: el documento refleja todo lo anterior.

---

## Criterios de aceptación

- [X] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores.
- [X] `list_tables` del MCP muestra únicamente las tablas `games` y `scores`, ambas sin RLS activado; `games` contiene exactamente una fila (`rocas`) y `scores.game_id` tiene clave foránea a `games.id`.
- [X] La migración no contiene `enable row level security`, `create policy` ni `grant`/`revoke`.
- [X] No existe `lib/supabase/admin.ts`, ni `SUPABASE_SECRET_KEY` en `.env.local`, `.env.example` o el código.
- [X] `submitScore` rechaza (sin insertar) un `gameId` que no existe en `games`, un nombre vacío o de más de 16 caracteres, y una puntuación negativa, no entera o mayor que 9.999.999.
- [X] `submitScore` guarda el nombre en mayúsculas y recortado.
- [X] Jugar `rocas`, perder y pulsar GUARDAR PUNTUACIÓN inserta una fila en `scores` con `game_id = 'rocas'` y la puntuación final, y el modal muestra el estado guardado con un enlace a `/salon`.
- [X] Si `submitScore` falla (p. ej. sin conexión a Supabase), el modal muestra un mensaje de error genérico, no pierde la puntuación y permite reintentar; el detalle solo aparece en el log del servidor.
- [X] Guardar dos partidas del mismo jugador en `rocas` crea dos filas en `scores`, pero el jugador aparece una sola vez en el ranking de `rocas`, con su marca más alta.
- [X] La pestaña GLOBAL de `/salon` muestra por jugador la suma de sus mejores marcas por juego; con solo `rocas` coincide con el ranking de ROCAS.
- [X] `/salon` muestra como máximo 10 filas por pestaña, ordenadas por puntuación descendente con desempate por antigüedad, y las pestañas son GLOBAL y ROCAS (no aparecen los juegos que no están en `games`).
- [X] Con 0 filas, `/salon` (en GLOBAL y ROCAS) y `/juegos/rocas` muestran el texto "Sé el primero en entrar al salón de la fama", sin podio, sin filas y sin nombres ni puntuaciones inventados, y sin errores en la consola.
- [X] Con 1 o 2 filas el podio no rompe el diseño.
- [X] En `/salon` no hay pestañas de juegos que no sean reales y jugables (solo GLOBAL y ROCAS).
- [X] Tras guardar con un nombre, `localStorage` contiene `av_player_name` con ese nombre; al terminar otra partida el campo del modal ya viene relleno con él y GUARDAR PUNTUACIÓN lo guarda en `scores.player_name` sin escribir nada.
- [X] Si el jugador cambia el nombre en el modal y guarda, el nombre nuevo se guarda en la base y pasa a ser el recordado.
- [X] Con `localStorage` vacío el campo muestra el nombre de la sesión o `INVITADO`, y recargar la página no produce avisos de hidratación.
- [X] `/juegos/rocas` muestra el top 10 real; `/juegos/serpentina` muestra "sin puntuaciones reales todavía".
- [X] `/juegos/serpentina/jugar` sigue guardando en `av_scores` y no escribe en Supabase.
- [X] Ningún archivo importa `createClient` de `@supabase/supabase-js`.
- [X] `/salon`, `/juegos/rocas` y `/juegos/rocas/jugar` responden 200 sin errores ni avisos de hidratación en la consola.
- [X] A 375 px, `/salon` no tiene scroll horizontal.
- [X] `seededScores` y `PLAYERS` ya no existen si nadie los importa, y `/biblioteca`, `/` y `/acerca` siguen funcionando igual.
- [X] `CLAUDE.md` documenta las tablas `games` y `scores`, las vistas, que RLS está pendiente y el flujo de guardado.

---

## Decisiones

- **Sí:** puntuaciones anónimas con `player_name` (iniciales del modal), sin `user_id` (decisión del usuario). **No:** Auth en esta spec; la ampliaría a tres áreas (Auth, tablas, UI). Cuando llegue Auth, se añade `user_id` en su propia migración.
- **Sí:** crear la tabla `games` (decisión del usuario) como referencia de los juegos que tenemos con puntuaciones reales; hoy solo `rocas`. `scores.game_id` es clave foránea a `games.id`, de modo que no se puede guardar una puntuación de un juego inexistente. **No:** volcar en `games` todo el catálogo ni sus columnas visuales (descripciones, portada, color): el catálogo sigue en `app/data/games.ts` y cargarlo desde Supabase será otra spec que ampliará esta tabla. **No:** mover biblioteca y detalle a la base.
- **Sí:** la tabla `games` define qué juegos tienen ranking: `getBoards` crea una pestaña por fila y `submitScore` comprueba que el juego exista. Añadir un juego con ranking es insertar una fila (más registrarlo en `PLAYABLE_GAMES`). **No:** una lista `LEADERBOARD_GAMES` en código, que duplicaría esa información, ni validar con `PLAYABLE_GAMES` (importa componentes de cliente).
- **Sí:** ranking global como suma de la mejor marca por juego (decisión del usuario). Escala a más juegos y premia el rendimiento en todos. **No:** mezclar todas las filas de `scores` (puntos de juegos distintos no son comparables) ni acumular todas las partidas (premia jugar mucho, no jugar bien).
- **Sí:** mejor marca por jugador, top 10. **No:** todas las partidas en el ranking, porque un jugador podría ocupar varios puestos; las partidas sí se conservan en `scores`.
- **Sí:** vistas SQL `game_leaderboard` y `global_leaderboard`. La lógica del ranking vive en un solo sitio y el cliente solo ordena y limita. **No:** calcular el ranking en JavaScript sobre todas las filas, ni vistas materializadas (sin volumen que lo justifique).
- **Sí:** escritura mediante Server Action con el cliente de servidor y la clave publicable, para validar en un único punto (juego, nombre, rango). **No:** RLS ni clave secreta en esta spec (decisión del usuario: RLS se configura aparte). Consecuencia aceptada: sin RLS, quien tenga la clave publicable puede escribir en `scores` sin pasar por la acción. **No:** Edge Function (exigiría CLI y `supabase/functions/`).
- **Sí:** generar `database.types.ts` y tipar los clientes con `Database` ahora que existe un esquema. Esto sustituye la decisión de la SPEC 04 de no tipar mientras no hubiera tablas. **No:** escribir tipos a mano.
- **Sí:** recordar el último nombre guardado en `localStorage` (`av_player_name`) y precargarlo en el modal (decisión del usuario); el dato de verdad va a `scores.player_name`. **No:** guardar el nombre en la base de forma separada (no hay tabla de jugadores sin Auth), ni recordar el nombre antes de que se guarde con éxito.
- **Sí:** mensaje "Sé el primero en entrar al salón de la fama" cuando un ranking está vacío y `/salon` solo con juegos reales y jugables (decisión del usuario). **No:** filas de relleno ni podio vacío.
- **Sí:** nombre en mayúsculas, recortado, de 1 a 16 caracteres, forzado por un `check` en la base además de la validación de la acción. **No:** confiar solo en la validación de la aplicación.
- **Sí:** lecturas dinámicas bajo `<Suspense>`, sin `"use cache"`. El cliente de servidor usa `cookies()`, que no se puede llamar dentro de `"use cache"`; el ranking se ve actualizado al guardar. **No:** caché con etiquetas e invalidación: es una optimización para otra spec.
- **Sí:** quitar el bloque "TU MEJOR MARCA" falso de `/salon` y resaltar la fila del jugador de la sesión simulada si aparece en el top. **No:** inventar una posición fuera del top 10.
- **Sí:** los placeholders conservan `saveScore` en `localStorage`. **No:** escribir en la base puntuaciones simuladas aleatorias.
- **Sí:** aplicar la migración con el MCP y documentar el SQL en esta spec. **No:** carpeta `supabase/migrations/` (la SPEC 04 la dejó fuera y sigue sin haber CLI).
- **No:** Realtime, estadísticas reales ni landing con datos reales; cada uno tiene su propia spec.

---

## Riesgos

| Riesgo                                                                                                                                  | Mitigación                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sin RLS ni Auth, cualquiera con la clave publicable puede leer, insertar, modificar o borrar filas de `scores`, y falsear puntuaciones. | Aceptado temporalmente por decisión del usuario. La spec de RLS debe ser la siguiente que toque la base: activar RLS, política `SELECT` pública y mover la escritura a una vía de confianza. El `check` de la tabla limita nombre y rango. |
| Dos personas con el mismo nombre comparten marca y una puede "pisar" a la otra.                                                         | Aceptado: la identidad real llega con Auth. El nombre es la clave del ranking hasta entonces.                                                                                                                                              |
| `cookies()` en el cliente de servidor falla durante el prerenderizado con `cacheComponents`.                                            | Las lecturas van bajo `<Suspense>`; el paso 1 obliga a leer las guías de Next 16.4.                                                                                                                                                        |
| Un nombre guardado desde `localStorage` o el modal no cumple el `check` (minúsculas, más de 16).                                        | La acción normaliza antes de insertar y el campo del modal limita a 16 caracteres.                                                                                                                                                         |
| Un jugador con una sola fila rompe el podio de 3 posiciones.                                                                            | Los huecos vacíos del podio y el estado vacío tienen criterios de aceptación propios.                                                                                                                                                      |

---

## Lo que **no** entra en esta spec

- RLS, políticas y permisos de la base.
- Autenticación real, `user_id` y cambios en `/acceso` o `SessionProvider`.
- Catálogo completo de juegos en la base de datos (`games` solo guarda las referencias de los juegos con ranking) y estadísticas reales (`best`, `plays`).
- Landing con puntuaciones recientes y mejores jugadores reales.
- Realtime, caché de lecturas y rate limiting.
- Verificación anti-trampas de las puntuaciones.
- Edge Functions, CLI de Supabase y carpeta `supabase/`.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
