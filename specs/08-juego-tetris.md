# SPEC 08 — Juego real: TETRIS (id `tetris`) con leaderboard y entrada en la biblioteca

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (`05-juego-rocas-asteroides.md`), SPEC 06 (`06-leaderboard-y-tabla-games.md`), SPEC 07 (`07-biblioteca-juegos-en-base-de-datos.md`)
> **Fecha:** 2026-11-03
> **Objetivo:** Portar el Tetris de `references/started-games/03-tetris/` como el juego real de la entrada `caida`, renombrada a `tetris`, jugable en `/juegos/tetris/jugar` dentro de `GamePlayer`, con su fila en `games` para que tenga ranking en `/salon`, top en `/juegos/tetris` y tarjeta en `/biblioteca`.

---

## Por qué existe esta spec

La entrada `caida` es hoy un placeholder con puntuación simulada. Es el segundo juego real tras `rocas` y el primero que no encaja del todo en el contrato de la SPEC 05: **no tiene vidas** y su tablero es **vertical (10×20)** dentro de un marco 4:3. Por eso esta spec, además de portar el juego, hace opcional `onLives` en el contrato y fija cómo se encaja un juego vertical. El original es JavaScript plano con globales, DOM propio (HUD, overlay de PAUSA/GAME OVER, toggle de tema) y `localStorage` propio, así que no se puede copiar tal cual.

Inventario del original (`game.js`, 332 líneas):

- Tablero 10×20, bloque de 30 px (canvas 300×600) y un canvas aparte de 120×120 para la pieza siguiente.
- **8 piezas** sorteadas con `Math.floor(Math.random() * 8) + 1`: las 7 clásicas (I, O, T, S, Z, J, L) más la **N (tuerca)**, una matriz 3×3 hueca en el centro que el README no menciona. Sin bolsa de 7: sorteo uniforme con repetición.
- Rotación horaria con _wall kicks_ `[0, −1, +1, −2, +2]` en columnas.
- Caída automática cada `dropInterval = max(100, 1000 − (nivel − 1) × 90)` ms; nivel = `floor(líneas / 10) + 1`.
- Puntos: líneas `[0, 100, 300, 500, 800] × nivel` (con el nivel previo a subir), soft drop +1 por fila, hard drop +2 por celda recorrida.
- Pieza fantasma con `globalAlpha = 0.2`.
- Sin vidas; fin de partida cuando la pieza nueva colisiona al aparecer.
- Controles: ← → mover, ↓ soft drop, ↑ o X rotar, Espacio hard drop, P pausa (sustituida por el botón de `GamePlayer`).

---

## Alcance

**Dentro:**

- Portar a TypeScript la jugabilidad del original sin cambiar sus reglas: las 8 piezas (incluida la N), rotación con los mismos _wall kicks_, caída por intervalo, limpieza de líneas, pieza fantasma, soft/hard drop, puntuación y niveles tal y como figuran en el inventario.
- Estilo con los **colores originales** de las piezas (`#4dd0e1`, `#ffd54f`, `#ba68c8`, `#81c784`, `#e57373`, `#90caf9`, `#ffb74d`, `#9e9e9e`) y su brillo superior de 4 px; sin glow. Fondo y líneas de la rejilla transparentes/tenues sobre la pantalla CRT de la plataforma (la rejilla usa un color fijo con baja opacidad, porque el original lo tomaba de la variable CSS `--grid-line` de su propio tema).
- Código en `app/_components/games/tetris/`: `engine.ts`, `entities.ts` (piezas y tablero), `input.ts`, `constants.ts`, `utils.ts` y `tetris-canvas.tsx`. Nada se importa de `references/`.
- Encaje 4:3: coordenadas lógicas **800×600**. El tablero ocupa 300×600 (bloque de 30) a la izquierda-centro; a su derecha el canvas dibuja un panel con la pieza siguiente (rejilla 4×4 de bloques de 30) y el contador de **LÍNEAS**. Puntuación y nivel van al HUD de React. Posiciones exactas: se definen en `constants.ts` y se comprueban a ojo en el paso 8.
- Registrar `tetris: TetrisCanvas` en `app/_components/games/registry.ts`.
- Contrato: `onLives` pasa a ser **opcional** en `GameCanvasProps`; `GamePlayer` muestra `—` en vidas cuando el juego real no las reporta, sin cambiar el aspecto del HUD de `rocas` (vidas siguen como `♥ ♥ ♥`).
- Migración `add_game_tetris` en Supabase con el MCP: una fila en `games` (`tetris`, `TETRIS`). Sin cambios de esquema.
- Renombrar la entrada `caida` de `app/data/games.ts`: `id` de `caida` a `tetris` y `title` de `CAÍDA` a `TETRIS` (las rutas pasan a `/juegos/tetris`; `cover-tetro` y el resto de campos no cambian), buscando y actualizando cualquier otra referencia al `id` antiguo en `app/`, y ajustar `long`/`short` solo si prometen algo que el port no tiene (hoy dicen "cada 10 líneas", que coincide; ver paso 2).
- Actualizar `CLAUDE.md`.

**Fuera de alcance (para futuras specs):**

- Pausa por teclado (la `P` del original se elimina; solo el botón PAUSA/REANUDAR) y auto-pausa al perder foco.
- Controles táctiles y gamepad.
- Sonido y música.
- Mecánicas nuevas: bolsa de 7, _hold_, rotación SRS, bloqueo con retardo, repetición de tecla propia (DAS/ARR), animación de limpieza de líneas, niveles con más puntuación.
- El toggle de tema claro/oscuro del original y su `localStorage` (`tetris-theme`): lo gobierna la plataforma.
- Sembrar los demás juegos en `games`, RLS, Auth, anti-trampas, rate limiting, estadísticas reales (`best`, `plays` siguen mock).
- Portar Arkanoid (`04-arkanoid`).
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Migración `add_game_tetris` (aplicada con `apply_migration`; el SQL queda documentado aquí porque no existe carpeta `supabase/`):

```sql
insert into public.games (id, title) values ('tetris', 'TETRIS');
```

La entrada ya existe en `app/data/games.ts` (como `caida` hasta el paso 2, luego `tetris`), así que `/biblioteca` la mostrará. No hay cambios de esquema, por lo que no se regenera `database.types.ts`.

Contrato (cambio en `app/_components/games/types.ts`):

```ts
export type GameCanvasProps = {
  paused: boolean;
  onScore: (score: number) => void;
  /** Opcional: los juegos sin vidas (Tetris) no lo llaman y el HUD muestra "—". */
  onLives?: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
};
```

Motor (sin React):

```ts
// app/_components/games/tetris/engine.ts
export function createTetrisGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void };
```

Estado interno:

```ts
type Piece = { type: number; shape: number[][]; x: number; y: number }; // type 1–8
// board: number[][] de 20×10; 0 = vacío, 1–8 = índice de color
// score, lines, level, dropInterval, dropAccum, current, next, gameOver
```

Convenciones:

- Coordenadas lógicas 800×600, origen arriba a la izquierda; `draw()` aplica `setTransform(canvas.width / 800, …)` cada frame.
- `dt` se limita a 50 ms para el acumulador de caída (el original no lo limitaba; evita una caída múltiple tras volver de una pausa o de otra pestaña). Al reanudar se reinicia `lastTime`.
- La pieza que aparece colisionando termina la partida: el motor llama a `onGameOver(score)` una sola vez y no dibuja ningún "GAME OVER".
- `onScore` se llama solo cuando cambia la puntuación; `onLevel` solo cuando cambia el nivel (inicial: 1). `onLives` no se llama nunca.
- La puntuación se limita a 9.999.999 (tope de `scores.score`) antes de notificarla.
- Las líneas se muestran dibujadas en el canvas (no hay campo para ellas en `GamePlayer`).
- No se añade ninguna variable de entorno.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` la guía de Client Components, y en `app/globals.css` los estilos `.crt`, `.crt-screen` y `.game-arena`. Releer `app/_components/game-player.tsx` por dentro. Sin cambios en el repo.
2. Contrato opcional: `onLives?` en `types.ts` y ajustar `GamePlayer` para que, con un juego real que no reporta vidas, el HUD muestre `—` (distinguiéndolo de 0 vidas) y siga mostrando `♥ ♥ ♥` en `rocas`. Renombrar en `app/data/games.ts` el `id` de `caida` a `tetris` y el `title` de `CAÍDA` a `TETRIS` (y cualquier otro texto fijo que lo nombre; `grep -rn "caida" app lib` no debe dejar referencias) y revisar `long`/`short`, ajustándolos solo si prometen algo que el port no tiene. Verificación: `npx tsc --noEmit`; `/juegos/rocas/jugar` se ve igual y `/juegos/tetris` muestra el título TETRIS y el texto vigente.
3. Crear `tetris/constants.ts` (`COLS`, `ROWS`, `BLOCK`, ancho/alto lógico, `COLORS`, `PIECES`, `LINE_SCORES`, tope de puntuación, posiciones del panel) y `tetris/utils.ts` (`createBoard`, `rotateCW`). Verificación: `npx tsc --noEmit`.
4. Crear `tetris/entities.ts`: `randomPiece`, `collide`, `tryRotate` (kicks `[0,−1,1,−2,2]`), `merge`, `clearLines` y `ghostY`, como funciones puras sobre el estado del tablero. Verificación: `npx tsc --noEmit` y `npx eslint app`.
5. Crear `tetris/input.ts`: `createInput(onKey)` que escucha `keydown` (con `e.repeat` nativo) y expone `setActive(boolean)`/`destroy()`. Teclas: ← → ↓ ↑ X Espacio. `preventDefault` solo de ← → ↓ ↑ y Espacio y solo con el juego activo (no en pausa) y el foco fuera de `input`/`textarea`/`select`. Sin `P` ni `Esc`. Verificación: `npx tsc --noEmit` y `npx eslint app`.
6. Crear `tetris/engine.ts` con `createTetrisGame`: bucle `requestAnimationFrame`, acumulador de caída, `lockPiece`, `spawn` con fin de partida, puntuación y nivel, dibujo (rejilla, bloques con brillo, fantasma a 0,2, pieza actual, panel de siguiente y líneas), `setPaused` (la lógica se congela pero se sigue dibujando) y `destroy` (cancela el bucle y quita listeners). Callbacks solo al cambiar el valor. Verificación: `npx tsc --noEmit` y `npx eslint app`.
7. Crear `tetris/tetris-canvas.tsx` copiando el patrón de `asteroids-canvas.tsx` (refs para `paused` y callbacks, motor creado una vez, `ResizeObserver` con 800×600 y `devicePixelRatio`, `aria-label="Juego TETRIS"`). Verificación: `npx tsc --noEmit`.
8. Registrar `tetris` en `registry.ts`. Verificación: `/juegos/tetris/jugar` es jugable dentro del CRT; `/juegos/serpentina/jugar` sigue con el placeholder; a 375 px no hay scroll horizontal.
9. Aplicar la migración `add_game_tetris` con el MCP. Verificación: `execute_sql` muestra `games` con exactamente `rocas` y `tetris`; `/biblioteca` muestra ROCAS y TETRIS; `/salon` muestra las pestañas GLOBAL, ROCAS y TETRIS.
10. Prueba de extremo a extremo y limpieza: jugar `tetris`, perder, guardar, ver la fila en `scores` y en `/salon` y `/juegos/tetris`, y borrar después las filas de prueba (`delete from scores where game_id = 'tetris'`). Verificación: `scores` sin filas de prueba de `tetris`.
11. Actualizar `CLAUDE.md` (juego jugable, carpeta `tetris/`, `onLives?` opcional y HUD `—`, `games` con dos filas, qué sigue siendo placeholder). Verificación: el documento refleja todo lo anterior.

---

## Criterios de aceptación

- [ ] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores.
- [ ] `/juegos/tetris/jugar` responde 200, muestra el canvas dentro de la pantalla CRT y la consola no muestra errores ni avisos de hidratación.
- [ ] El tablero es de 10×20 y caen las 8 piezas (I, O, T, S, Z, J, L y la N hueca de 3×3), sorteadas de forma uniforme con repetición, con los colores originales del inventario.
- [ ] ← y → mueven la pieza una columna sin atravesar paredes ni bloques; mantener pulsada la tecla repite con la repetición nativa del teclado.
- [ ] ↑ y X rotan en sentido horario; junto a una pared la rotación intenta los desplazamientos `0, −1, +1, −2, +2` y se descarta si ninguno cabe.
- [ ] ↓ baja una fila y suma 1 punto; si la pieza no puede bajar, se fija.
- [ ] Espacio deja caer la pieza al instante y suma 2 puntos por celda recorrida.
- [ ] Se dibuja la pieza fantasma en la posición de aterrizaje con opacidad 0,2.
- [ ] Limpiar 1, 2, 3 o 4 líneas suma 100, 300, 500 u 800 puntos multiplicados por el nivel vigente antes de subir.
- [ ] El nivel es `floor(líneas / 10) + 1`, el HUD de React lo muestra y el intervalo de caída es `max(100, 1000 − (nivel − 1) × 90)` ms (1000 ms en nivel 1, 100 ms desde el nivel 11).
- [ ] El canvas dibuja la pieza siguiente y el contador de líneas a la derecha del tablero y se actualizan al fijar piezas.
- [ ] El HUD de React muestra puntuación y nivel reales del juego; las vidas muestran `—`; el HUD de `rocas` sigue mostrando `♥ ♥ ♥` y su nivel.
- [ ] El botón PAUSA congela por completo el juego (caída, entrada, dibujo del estado), muestra "EN PAUSA" y REANUDAR continúa sin que la pieza caiga varias filas de golpe.
- [ ] La tecla P y Esc no pausan el juego y cambiar de pestaña no lo pausa.
- [ ] Con el juego en marcha, las flechas y Espacio no hacen scroll en la página (incluso con el botón PAUSA o REANUDAR pulsado antes) y Espacio hace hard drop en lugar de activar ese botón; en pausa o con el modal abierto el juego no responde a las teclas y se puede escribir (con espacios) en el campo de nombre.
- [ ] Cuando la pieza nueva colisiona al aparecer se abre el modal "FIN DEL JUEGO" con la puntuación final correcta y no hay ningún "GAME OVER" dibujado en el canvas; el botón FIN abre el mismo modal con la puntuación actual.
- [ ] JUGAR DE NUEVO reinicia desde puntuación 0, nivel 1 y tablero vacío sin duplicar bucles ni listeners (la pieza no cae el doble de rápido tras reiniciar).
- [ ] SALIR detiene el bucle y quita los listeners: tras volver a `/biblioteca`, las flechas y Espacio vuelven a hacer scroll.
- [ ] A 375 px el canvas ocupa el ancho disponible, mantiene la proporción 4:3 sin scroll horizontal y los bloques se ven nítidos con `devicePixelRatio` alto.
- [ ] La puntuación notificada nunca supera 9.999.999.
- [ ] La migración `add_game_tetris` solo inserta la fila de `tetris` en `games`; `games` contiene exactamente `rocas` y `tetris`, sin filas de relleno de otros juegos.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` una fila con `game_id = 'tetris'`, la puntuación final y el nombre en mayúsculas, y el modal muestra el enlace a `/salon`.
- [ ] `/salon` muestra la pestaña TETRIS con su top y GLOBAL suma por jugador su mejor marca de `rocas` y de `tetris`.
- [ ] `/juegos/tetris` muestra el top real de TETRIS y `/biblioteca` muestra la tarjeta de TETRIS junto a ROCAS.
- [ ] El resto de placeholders (`serpentina`, etc.) siguen con puntuación simulada y sin tarjeta en `/biblioteca`.
- [ ] Al terminar las pruebas no quedan filas de prueba en `scores` para `tetris`.
- [ ] Ningún archivo bajo `app/` importa de `references/` ni `createClient` de `@supabase/supabase-js`.
- [ ] `CLAUDE.md` documenta TETRIS como juego jugable, la carpeta `tetris/` y que `onLives` es opcional.

---

## Decisiones

- **Sí:** reutilizar la entrada `caida` del catálogo, renombrando su `id` a `tetris` y su `title` a `TETRIS` (decisión del usuario). Conserva portada y demás campos; el `id` pasa a coincidir con el juego y las rutas con `/juegos/tetris`. **No:** crear una entrada nueva, que duplicaría Tetris; **No:** mantener `caida` como `id`, que ya no describe el juego. crear una entrada nueva, que duplicaría Tetris.
- **Sí:** las 8 piezas del código, incluida la N (decisión del usuario). Es el comportamiento real del original. **No:** limitarse a las 7 del README ni sustituir el sorteo por una bolsa de 7: cambia la jugabilidad.
- **Sí:** colores originales de las piezas (decisión del usuario). **No:** neón con los tokens del tema ni glow; es la excepción respecto a `rocas`, aceptada porque las 8 piezas necesitan 8 colores distinguibles.
- **Sí:** hacer opcional `onLives` y mostrar `—` en el HUD (decisión del usuario). **No:** reportar una vida falsa, que mostraría un corazón engañoso; **No:** tocar el motor de `rocas`.
- **Sí:** lógico 800×600 con el tablero de 300×600 y un panel dibujado en el canvas con la pieza siguiente y las líneas (decisión del usuario). Aprovecha el marco 4:3 sin deformar los bloques. **No:** tablero solo centrado, que oculta la pieza siguiente; **No:** ampliar `GamePlayer` con un campo de líneas.
- **Sí:** repetición de tecla nativa del navegador y sin `P` (decisión del usuario). La pausa es solo del botón, como en la SPEC 05. **No:** repetición propia (DAS/ARR) ni pausa por teclado.
- **Sí:** `dt` limitado a 50 ms en el acumulador de caída. **No:** copiar el original sin límite, que dejaría caer varias filas tras una pausa larga.
- **Sí:** descartar el toggle de tema del original (decisión del usuario). El tema lo gobierna la plataforma. **No:** conservar `tetris-theme` en `localStorage`.
- **Sí:** un único fin de partida, el modal de `GamePlayer`; el overlay "GAME OVER" del original se elimina.
- **Sí:** motor TS sin React + componente delgado; reiniciar remontando con `key`, sin `reset()`. Callbacks solo al cambiar el valor.
- **Sí:** una fila en `games` define ranking, pestaña en `/salon` y tarjeta en `/biblioteca` (SPEC 06 y 07). **No:** sembrar los demás placeholders.
- **Sí:** sin sonido ni controles táctiles (decisión del usuario): el original no los tiene y cada uno merece su spec.

---

## Riesgos

| Riesgo                                                                                                                | Mitigación                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Cambiar `types.ts` y `GamePlayer` rompe el HUD o el flujo de `rocas`.                                                 | Paso 2 aislado con verificación y criterio de regresión del HUD de `rocas`.                                               |
| Doble montaje de `useEffect` (Strict Mode) duplica bucles y listeners.                                                | `destroy()` cancela `requestAnimationFrame` y quita listeners; criterio sobre la velocidad tras reiniciar.                |
| Espacio o las flechas activan el botón enfocado o hacen scroll.                                                       | `GamePlayer` desenfoca el botón de pausa y `preventDefault` solo con el juego activo y el foco fuera de campos editables. |
| La repetición nativa de ↓ puede hacer que mantener la tecla fije piezas más rápido de lo deseado.                     | Es el comportamiento del original; se acepta y se verifica en el paso 8.                                                  |
| La pieza N (3×3 hueca) y los _wall kicks_ simples pueden dejar al jugador sin rotación posible.                       | Aceptado: es la mecánica del original.                                                                                    |
| El panel dibujado en el canvas queda borroso o desalineado al escalar.                                                | La lógica y el dibujo usan siempre 800×600 con `setTransform`; criterio de nitidez a distintos `devicePixelRatio`.        |
| Sin RLS ni anti-trampas cualquiera con la clave publicable puede escribir `scores` y `games`.                         | Aceptado temporalmente (SPEC 06): la spec de RLS debe ser la siguiente que toque la base.                                 |
| Insertar `tetris` en `games` crea la pestaña en `/salon` antes de que el juego sea jugable si se aplica en otro orden. | El paso 9 va después de registrar el canvas (paso 8).                                                                     |
| Los datos de prueba quedan en `scores`.                                                                               | El paso 10 los borra y hay un criterio que lo verifica.                                                                   |

---

## Lo que **no** entra en esta spec

- Pausa por teclado, auto-pausa, controles táctiles, gamepad y sonido.
- Mecánicas nuevas (bolsa de 7, _hold_, SRS, DAS/ARR, animación de líneas).
- Toggle de tema del original.
- Sembrar otros juegos en `games`, RLS, Auth, anti-trampas y rate limiting.
- Estadísticas reales (`best`, `plays`), landing con datos reales y cambios en `/juegos/[id]` fuera del top.
- Arkanoid (`04-arkanoid`) y cualquier otro juego.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
