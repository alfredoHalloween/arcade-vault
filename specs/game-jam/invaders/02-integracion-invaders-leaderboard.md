# SPEC INVADERS-02 — Integración de INVADERS (id `invaders`) con el leaderboard y la biblioteca

> **Estado:** Borrador
> **Depende de:** SPEC 06 (`specs/06-leaderboard-y-tabla-games.md`), SPEC 07 (`specs/07-biblioteca-juegos-en-base-de-datos.md`), `specs/game-jam/invaders/01-juego-invaders-oleadas-alienigenas-y-escudos.md`
> **Fecha:** 2026-11-10
> **Objetivo:** Dar de alta `invaders` en la tabla `games` de Supabase para que INVADERS guarde puntuaciones reales y tenga pestaña en `/salon`, top en `/juegos/invaders` y tarjeta en `/biblioteca`, y documentarlo.

---

## Por qué existe esta spec

**Tema recibido:** INVADERS, un shooter de oleadas alienígenas. La spec `specs/game-jam/invaders/01-juego-invaders-oleadas-alienigenas-y-escudos.md` deja el juego jugable en `/juegos/invaders/jugar`, pero sin fila en `games`. Sin esa fila, `submitScore` rechaza la puntuación (el modal muestra el error genérico), `/salon` no tiene pestaña y `/biblioteca` no muestra la tarjeta.

Según las SPEC 06 y 07, una sola fila en `games` da a la vez el permiso de guardado (FK de `scores.game_id`), la pestaña en `/salon`, el top en `/juegos/<id>` y la tarjeta en `/biblioteca`. Esta spec añade esa fila con el mismo patrón que `add_game_tetris`, `add_game_arkanoid` y `add_game_snake`, lo prueba de extremo a extremo y actualiza la documentación.

Estado leído el 2026-11-10: `games` tiene exactamente cuatro filas, `rocas`, `tetris`, `arkanoid` y `snake` (`CLAUDE.md` y `references/implemented-games.md`). `PLAYABLE_GAMES` registra `rocas`, `tetris`, `arkanoid` y `snake`; tras la spec 01 registra también `invaders`.

---

## Alcance

**Dentro:**

- Migración `add_game_invaders` con el MCP `apply_migration`: una fila en `games` (`invaders`, `INVADERS`). Sin cambio de esquema.
- Comprobar que, tras la migración, `games` tiene **exactamente** `rocas`, `tetris`, `arkanoid`, `snake` e `invaders`.
- Comprobar la pestaña INVADERS en `/salon`, el top real en `/juegos/invaders` y la tarjeta en `/biblioteca`. No se cambia código: `lib/leaderboard.ts`, `lib/games.ts`, `HallOfFame`, `Leaderboard` y `LibraryBrowser` ya leen `games`.
- Prueba de extremo a extremo: jugar, perder, guardar, ver la fila en `scores`, en `/salon` y en `/juegos/invaders`. Después, limpieza con `delete from scores where game_id = 'invaders'`.
- Actualizar `CLAUDE.md` (juego jugable, carpeta `invaders/`, `games` con cinco filas, migración nueva, placeholders restantes).
- Actualizar `references/implemented-games.md` (5 juegos, fila y detalle de INVADERS, nota de placeholders sin `invasores`).
- Mover la sugerencia S-01 de `references/game-suggestions-todo.md` a _Hechos_ con `[x]`.

**Fuera de alcance (para futuras specs):**

- Cualquier cambio en el motor o en las reglas de INVADERS (spec 01).
- Sembrar placeholders (`gloton`, `ranaria`, `duelo-pixel`) en `games`.
- Cambios de esquema, vistas, RLS, Auth, anti-trampas, rate limiting y moderación de nombres.
- Regenerar `lib/supabase/database.types.ts` (no hay cambio de esquema).
- Estadísticas reales (`best`, `plays` siguen mock) y landing con datos reales.
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Migración `add_game_invaders` (aplicada con `apply_migration`; el SQL queda documentado aquí porque no existe carpeta `supabase/`):

```sql
insert into public.games (id, title) values ('invaders', 'INVADERS');
```

Estado esperado de `games` tras la migración (orden por `created_at`):

| id         | title    |
| ---------- | -------- |
| `rocas`    | ROCAS    |
| `tetris`   | TETRIS   |
| `arkanoid` | ARKANOID |
| `snake`    | SNAKE    |
| `invaders` | INVADERS |

- No hay cambios de esquema, así que no se regenera `database.types.ts`.
- La entrada `invaders` ya existe en `app/data/games.ts` (spec 01), así que `/biblioteca` la mostrará en el orden del catálogo local.
- La puntuación de INVADERS es entera, como mucho 1.200 por oleada, y el motor la limita a 9.999.999, así que cabe en el `check` de `scores.score` (0–9.999.999).
- Las vistas `game_leaderboard` y `global_leaderboard` incluyen el juego nuevo sin cambios: GLOBAL suma la mejor marca por jugador de los cinco juegos.

Consultas de verificación (con `execute_sql`):

```sql
select id, title from public.games order by created_at;
select game_id, player_name, score from public.scores where game_id = 'invaders' order by created_at desc;
select * from public.global_leaderboard where player_name = '<NOMBRE_DE_PRUEBA>';
```

No se añade ninguna variable de entorno.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Comprobar los requisitos previos. `specs/game-jam/invaders/01-juego-invaders-oleadas-alienigenas-y-escudos.md` debe estar implementada: `PLAYABLE_GAMES` contiene `invaders` y `/juegos/invaders/jugar` es jugable. Con `list_tables` / `execute_sql`, `games` tiene exactamente `rocas`, `tetris`, `arkanoid` y `snake`. Verificación: si algo no coincide, parar y avisar antes de migrar. Sin cambios en el repo.
2. Aplicar la migración `add_game_invaders` con `apply_migration`. Verificación: `select id, title from public.games order by created_at` devuelve exactamente las cinco filas de la tabla del _Modelo de datos_; `list_migrations` muestra `add_game_invaders` al final.
3. Comprobar las pantallas sin tocar código. Verificación: `/salon` muestra las pestañas GLOBAL, ROCAS, TETRIS, ARKANOID, SNAKE e INVADERS; `/juegos/invaders` muestra "Sé el primero en entrar al salón de la fama" (lista vacía, no "SIN PUNTUACIONES REALES TODAVÍA"); `/biblioteca` muestra cinco tarjetas y el filtro SHOOTER muestra ROCAS e INVADERS.
4. Prueba de extremo a extremo. Jugar `/juegos/invaders/jugar`, sumar puntos (por ejemplo, destruir varios aliens), perder las 3 vidas y guardar con un nombre de prueba en minúsculas (por ejemplo `jam test`). Verificación: el modal pasa a "PUNTUACIÓN GUARDADA" con el enlace VER SALÓN DE LA FAMA; `scores` tiene una fila con `game_id = 'invaders'`, `player_name = 'JAM TEST'` y la puntuación final del modal; la fila aparece en la pestaña INVADERS de `/salon` y en el top de `/juegos/invaders`; en GLOBAL, el total de ese jugador incluye su mejor marca de INVADERS.
5. Limpieza: `delete from scores where game_id = 'invaders';`. Verificación: la consulta de `scores` para `invaders` devuelve 0 filas; `/juegos/invaders` vuelve a mostrar "Sé el primero en entrar al salón de la fama"; las filas de los otros juegos siguen intactas.
6. Actualizar `CLAUDE.md`. Mencionar la spec de game-jam de INVADERS en _Project_. En _Architecture_: añadir `invaders` a las rutas jugables, a `PLAYABLE_GAMES` y a las filas de `games` (cinco); añadir `add_game_invaders` a la lista de migraciones; añadir un párrafo "Invaders engine" con la carpeta `app/_components/games/invaders/`, sus archivos y las reglas clave (formación 5×10, puntos 30/20/10, un disparo propio, 4 escudos, nave de 150, 3 vidas, nivel = oleada, invasión = fin, sin assets ni sonido); sustituir `invasores` por `invaders` donde aparezca. Verificación: `grep -n "invasores" CLAUDE.md` no devuelve nada y el documento describe el juego.
7. Actualizar `references/implemented-games.md`: total 5 juegos, fila `invaders` / INVADERS / SHOOTER / `/juegos/invaders/jugar` / fecha de alta real / spec `game-jam/invaders`, sección de detalle con `short`, `long` y controles, fila del ranking (0 partidas y `—` tras la limpieza), nota de placeholders con `gloton`, `ranaria` y `duelo-pixel`, y fecha de consulta. Verificación: el documento coincide con `select id, created_at from games`.
8. Mover S-01 · INVADERS de _Pendientes_ a _Hechos_ con `[x]` en `references/game-suggestions-todo.md`, sin tocar las demás sugerencias. Verificación: S-01 aparece una sola vez, en _Hechos_.

---

## Criterios de aceptación

- [ ] La migración `add_game_invaders` solo inserta la fila (`invaders`, `INVADERS`) en `games`, sin cambio de esquema; `database.types.ts` no cambia.
- [ ] `games` contiene exactamente `rocas`, `tetris`, `arkanoid`, `snake` e `invaders`, sin filas de relleno de placeholders.
- [ ] GUARDAR PUNTUACIÓN en INVADERS inserta en `scores` una fila con `game_id = 'invaders'`, la puntuación final mostrada en el modal y el nombre en mayúsculas, y el modal muestra el enlace VER SALÓN DE LA FAMA a `/salon`.
- [ ] `/salon` muestra la pestaña INVADERS con su top 10 y las pestañas de los otros cuatro juegos siguen igual.
- [ ] La pestaña GLOBAL de `/salon` suma, por jugador, su mejor marca de `rocas`, `tetris`, `arkanoid`, `snake` e `invaders`.
- [ ] `/juegos/invaders` muestra el top real de INVADERS ("Sé el primero en entrar al salón de la fama" si está vacío).
- [ ] `/biblioteca` responde 200 y muestra la tarjeta de INVADERS junto a ROCAS, TETRIS, ARKANOID y SNAKE; el filtro SHOOTER muestra ROCAS e INVADERS; `gloton`, `ranaria` y `duelo-pixel` no aparecen.
- [ ] `/juegos/rocas/jugar`, `/juegos/tetris/jugar`, `/juegos/arkanoid/jugar` y `/juegos/snake/jugar` siguen guardando puntuación con su `game_id`.
- [ ] Al terminar las pruebas no quedan filas en `scores` con `game_id = 'invaders'` y las filas de los demás juegos no cambian.
- [ ] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores (esta spec no cambia código).
- [ ] Ningún archivo bajo `app/` importa de `references/` ni `createClient` de `@supabase/supabase-js`.
- [ ] `CLAUDE.md` documenta INVADERS como juego jugable, la carpeta `invaders/`, la migración `add_game_invaders` y `games` con cinco filas, y no menciona `invasores`.
- [ ] `references/implemented-games.md` lista 5 juegos jugables con INVADERS y ya no nombra `invasores` como placeholder.
- [ ] `references/game-suggestions-todo.md` tiene S-01 · INVADERS en _Hechos_ marcada con `[x]`.

---

## Decisiones

- **Sí:** una fila en `games` define ranking, pestaña en `/salon`, top y tarjeta en `/biblioteca` (SPEC 06 y 07). **No:** tocar `lib/leaderboard.ts`, `lib/games.ts` ni componentes, que ya leen `games`.
- **Sí:** migración con nombre `add_game_invaders` y solo un `insert`, siguiendo `add_game_tetris`, `add_game_arkanoid` y `add_game_snake`. **No:** carpeta `supabase/` ni CLI (el proyecto no las usa).
- **Sí:** título en la base `INVADERS`, idéntico al del catálogo (decisión del usuario).
- **Sí:** separar esta spec de la del juego (decisión del flujo game-jam), para poder probar el juego antes de abrirle el ranking. **No:** insertar la fila antes de registrar el canvas, que crearía una pestaña en `/salon` de un juego no jugable.
- **Sí:** nombre de prueba en minúsculas (`jam test`) para comprobar que se guarda en mayúsculas (supuesto del agente).
- **Sí:** borrar todas las filas de `invaders` al terminar con `delete from scores where game_id = 'invaders'` (supuesto del agente). Justo tras la migración solo existen las filas de prueba. **No:** borrar por nombre, que podría dejar restos si se prueba con varios nombres.
- **Sí:** actualizar `references/implemented-games.md` (indicado por el flujo game-jam) y mover S-01 a _Hechos_ en `references/game-suggestions-todo.md` (supuesto del agente), para que `game-planner` no vuelva a proponer INVADERS. **No:** editar la memoria de `game-planner` en `.claude/agent-memory/`.
- **Sí:** no sembrar placeholders en `games`. Cada fila nueva crea una pestaña en `/salon` y una tarjeta en `/biblioteca`.

---

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                             |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Aplicar la migración antes de implementar la spec 01 crea una pestaña de un juego no jugable. | El paso 1 comprueba `PLAYABLE_GAMES` y `/juegos/invaders/jugar` antes de migrar.                       |
| `games` ya no tiene exactamente las cuatro filas esperadas (alguien sembró placeholders).     | El paso 1 lo comprueba y se para antes de migrar; un criterio exige exactamente cinco filas.           |
| Sin RLS ni anti-trampas cualquiera con la clave publicable puede escribir `scores` y `games`. | Aceptado temporalmente (SPEC 06): la spec de RLS debe ser la siguiente que toque la base.              |
| Los datos de prueba quedan en `scores` y ensucian GLOBAL.                                     | El paso 5 los borra y hay un criterio que lo verifica.                                                 |
| El borrado se lanza por error sobre otro `game_id`.                                           | El `delete` filtra por `game_id = 'invaders'` y un criterio comprueba que los demás juegos no cambian. |
| `CLAUDE.md` o `references/implemented-games.md` quedan desfasados respecto a la base.         | Pasos 6 y 7 con verificación contra `select id, created_at from games`.                                |
| `best` y `plays` mock (54.190) no son realistas para un juego de 1.200 puntos por oleada.     | Aceptado: siguen siendo mock en todo el catálogo; las estadísticas reales van en su propia spec.       |

---

## Lo que **no** entra en esta spec

- Cambios en el motor, las reglas o el catálogo de INVADERS (spec 01).
- Sembrar `gloton`, `ranaria` o `duelo-pixel` en `games`.
- Cambios de esquema, vistas, RLS, Auth, anti-trampas, rate limiting y moderación.
- Regenerar `database.types.ts`.
- Estadísticas reales y landing con datos reales.
- Cualquier otro juego.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
