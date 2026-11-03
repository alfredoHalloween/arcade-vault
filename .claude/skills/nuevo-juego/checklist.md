# Contrato de integración de un juego en Arcade Vault

Referencia para `/nuevo-juego`. Destila las specs 05 (juego + contrato), 06 (leaderboard) y 07 (biblioteca). Vuélcalo en la spec adaptándolo al juego; verifica contra el código actual por si el contrato ha cambiado.

## 1. Archivos que crea el juego

Carpeta `app/_components/games/<slug>/` (nunca importar de `references/`):

- `engine.ts` — motor **sin React**: `create<X>Game(canvas, callbacks: Omit<GameCanvasProps, "paused">) → { setPaused(paused), destroy() }`.
  - Bucle con `requestAnimationFrame`; `dt` limitado (p. ej. 50 ms).
  - `setPaused` congela la lógica pero sigue dibujando (redimensionar un canvas lo borra); al reanudar se reinicia `lastTime` para evitar saltos.
  - Callbacks (`onScore`, `onLives`, `onLevel`) solo cuando el valor cambia. `onGameOver(finalScore)` una sola vez. El juego **no dibuja** pantalla de game over.
  - `destroy()` cancela el bucle y quita todos los listeners (Strict Mode monta dos veces).
  - Paleta leída de los tokens con `getComputedStyle` al montar, con hex de respaldo.
  - Lógica en coordenadas lógicas fijas; `draw()` aplica `setTransform(canvas.width / W, …)` cada frame.
- `input.ts` — teclado; `preventDefault` solo de las teclas del juego, solo si el juego está activo (no en pausa) y el foco no está en `input`/`textarea`/`select`. Sin P/Esc ni auto-pausa.
- `constants.ts`, `utils.ts`, `entities.ts` (o equivalentes según el juego).
- `<slug>-canvas.tsx` (`"use client"`, export default): copia el patrón de `app/_components/games/asteroids/asteroids-canvas.tsx` — refs para `paused` y callbacks, motor creado una vez en `useEffect`, `ResizeObserver` + `devicePixelRatio`, `setPaused` en otro efecto, `<canvas className="absolute inset-0 block h-full w-full" aria-label="Juego …">`. Proporción 4:3 del marco; si el original es vertical, la spec decide el encaje (márgenes laterales, panel de pieza siguiente dibujado en el canvas).

## 2. Registro

`app/_components/games/registry.ts` → añadir `"<id>": <X>Canvas` a `PLAYABLE_GAMES`. El `id` es el del catálogo `app/data/games.ts`. `GamePlayer` ya se ocupa de pausa, HUD, modal, guardado y reinicio por `key`; no se modifica salvo el contrato opcional.

## 3. Base de datos (leaderboard y biblioteca)

- Una fila en `games` da, a la vez: pestaña en `/salon`, top en `/juegos/<id>`, tarjeta en `/biblioteca` y permiso para `submitScore` (FK).
- Migración con el MCP `apply_migration`, nombre `add_game_<id>`: `insert into public.games (id, title) values ('<id>', '<TÍTULO>');`. Sin cambios de esquema → no hay que regenerar `database.types.ts`. Documentar el SQL en la spec (no existe carpeta `supabase/`).
- El `id` debe existir ya en `app/data/games.ts` (si no, `/biblioteca` lo ignora). No sembrar los demás placeholders.
- La puntuación debe caber en `scores.score` (0–9.999.999, entero); si el juego puede superarlo, la spec define el tope.
- Verificar con `list_tables` / `execute_sql`; los datos de prueba se borran al terminar.

## 4. Contrato opcional de vidas y nivel (solo si el juego no los tiene)

Hoy `GameCanvasProps` exige `onLives` y `onLevel`. Para juegos como Tetris (sin vidas), la primera spec que lo necesite incluye:

- `app/_components/games/types.ts`: `onLives?` y `onLevel?` opcionales.
- `app/_components/game-player.tsx`: si el juego real no reporta vidas, el HUD muestra `—` (ya existe el fallback `"—"` para 0 vidas; ajustar para distinguir "sin vidas" de "0 vidas") y el nivel `—` si no reporta nivel.
- Los motores existentes (`asteroids`) no cambian. Verificar que el HUD de `rocas` queda igual.

Si ya está hecho por una spec anterior, solo se usa.

## 5. Assets y sonido

- Copiar a `public/games/<id>/` (imágenes, sonidos); cargar con rutas absolutas `/games/<id>/…` (`new Image()`, `new Audio()`); el original no se enlaza desde `references/`.
- Esperar a que carguen los assets antes de arrancar el bucle (o dibujar sin ellos con tolerancia).
- Sonido: se detiene o silencia con `setPaused(true)`, se libera en `destroy()`, y un fallo al reproducir (autoplay bloqueado) no rompe el juego.
- Si se decide prescindir de assets, ir vectorial con los tokens del tema.

## 6. Catálogo y documentación

- `app/data/games.ts`: ajustar `long`/`short` de la entrada para no prometer mecánicas que el port no tiene.
- `CLAUDE.md`: añadir el juego a los jugables, su carpeta y, si cambia el contrato, la nueva firma.

## 7. Criterios de aceptación base (adaptar y concretar con reglas y puntos del original)

- [ ] `npx tsc --noEmit` y `npx eslint app lib` sin errores.
- [ ] `/juegos/<id>/jugar` responde 200, muestra el canvas dentro de la pantalla CRT, sin errores ni avisos de hidratación en consola.
- [ ] Controles, reglas y puntos del original (listar cada uno con valores concretos).
- [ ] El HUD de React muestra puntuación (y vidas/nivel si aplica) reales del juego.
- [ ] PAUSA congela todo y REANUDAR continúa sin saltos; P y Esc no pausan; cambiar de pestaña no pausa; el sonido se detiene en pausa.
- [ ] Con el juego en marcha, las teclas del juego no hacen scroll (incluso tras pulsar PAUSA/REANUDAR) y se puede escribir en el campo de nombre del modal.
- [ ] Al perder se abre el modal "FIN DEL JUEGO" con la puntuación final correcta, sin "GAME OVER" dibujado en el canvas; el botón FIN abre el mismo modal.
- [ ] JUGAR DE NUEVO reinicia desde cero sin duplicar bucles ni listeners.
- [ ] SALIR detiene el bucle y quita los listeners (las flechas vuelven a hacer scroll en `/biblioteca`).
- [ ] A 375 px el canvas ocupa el ancho disponible sin scroll horizontal y mantiene su proporción; trazos nítidos con `devicePixelRatio`.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` una fila con `game_id = '<id>'` y la puntuación final, nombre en mayúsculas.
- [ ] `/salon` muestra la pestaña del juego y GLOBAL suma su mejor marca por jugador.
- [ ] `/juegos/<id>` muestra el top real; `/biblioteca` muestra la tarjeta del juego.
- [ ] El resto de placeholders siguen con puntuación simulada y `games` no contiene filas de relleno.
- [ ] Ningún archivo bajo `app/` importa de `references/` ni `createClient` de `@supabase/supabase-js`.
- [ ] `CLAUDE.md` documenta el juego.

## 8. Decisiones base (incluir con justificación)

- `GamePlayer` es dueño de pausa, HUD, fin de partida y guardado; el canvas no tiene pausa ni HUD propios.
- Motor TS sin React + componente delgado; reiniciar remontando con `key`, sin `reset()`.
- Un único fin de partida (el modal), nunca el game over del original.
- Callbacks solo al cambiar el valor; nada por frame hacia React.
- Pausa solo por botón; sin táctil, gamepad ni sonido salvo decisión explícita.
- Ranking por nombre de jugador, sin Auth; la fila en `games` define qué juegos tienen ranking.

## 9. Riesgos base

- Sin RLS ni anti-trampas, cualquiera con la clave publicable puede escribir `scores` (aceptado hasta la spec de RLS).
- Doble montaje de `useEffect` en desarrollo (Strict Mode) → `destroy()` completo.
- Espacio/flechas activan el botón enfocado o hacen scroll → desenfocar el botón de pausa (ya lo hace `GamePlayer`) y `preventDefault` condicionado.
- Móvil sin controles táctiles (aceptado).
- Cambios en `types.ts`/`game-player.tsx` pueden afectar a `rocas` → criterio de regresión.
- Assets que no cargan o autoplay bloqueado → el juego sigue funcionando.
