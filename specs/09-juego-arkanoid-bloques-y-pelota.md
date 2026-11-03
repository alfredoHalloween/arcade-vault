# SPEC 09 — Juego real: ARKANOID (id `arkanoid`) con leaderboard y entrada en la biblioteca

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (`05-juego-rocas-asteroides.md`), SPEC 06 (`06-leaderboard-y-tabla-games.md`), SPEC 07 (`07-biblioteca-juegos-en-base-de-datos.md`), SPEC 08 (`08-juego-tetris.md`, que hizo `onLives` opcional)
> **Fecha:** 2026-11-03
> **Objetivo:** Portar el Arkanoid de `references/started-games/04-arkanoid/` como el juego real de la entrada `bloque-buster`, renombrada a `arkanoid`, jugable en `/juegos/arkanoid/jugar` dentro de `GamePlayer`, con su fila en `games` para que tenga ranking en `/salon`, top en `/juegos/arkanoid` y tarjeta en `/biblioteca`.

---

## Por qué existe esta spec

`bloque-buster` es hoy un placeholder con puntuación simulada. Es el tercer juego real tras `rocas` y `tetris`, y el primero que **usa sonido** y **ratón**, dos cosas que los anteriores dejaron fuera. El original es JavaScript plano con globales, un spritesheet PNG, `Audio` global, listeners sobre `document` y overlays propios de PAUSA, GAME OVER y victoria, así que no se puede copiar tal cual.

Inventario del original (`game.js` 268 líneas, `levels.js` 50, `assets/spritesheet.js` 66):

- Canvas **800×600** (cabe tal cual en el marco 4:3). Cuadrícula de bloques de 10 columnas × 6 filas, bloque de 64×24 px, origen en x = 80, y = 80.
- Paleta 81×14 px en y = 560, velocidad 400 px/s con ← →, o seguimiento del ratón (`mousemove` sobre el canvas, centrada en el cursor y limitada a los bordes).
- Pelota 16×16 px. Velocidad base `vx = 200`, `vy = −300` px/s, multiplicada por la velocidad del nivel. Nace pegada al centro de la paleta y **sale al instante** (sin esperar saque).
- Rebotes: paredes izquierda, derecha y techo; paleta (solo si `vy > 0` y la base de la pelota está entre `paddle.y` y `paddle.y + 14 + 8`), que fija `vy = −|vy|` **sin cambiar `vx`** (el ángulo no depende de dónde golpea). Bloque: AABB, destruye **un bloque por frame**, invierte solo `vy`.
- Puntos: **+10 por bloque**, acumulados entre niveles. **3 vidas**; al caer la pelota bajo y > 600 se pierde una y se recoloca la pelota (la paleta y los bloques no se reinician); con 0 vidas, `gameover`.
- **5 niveles** (`levels.js`), el siguiente se carga al destruir el último bloque; al terminar el 5 se muestra "¡Completaste el juego!". Velocidades ×1,00 / ×1,10 / ×1,21 / ×1,33 / ×1,46:

| Nivel | Patrón                                                     | Bloques |
| ----- | ---------------------------------------------------------- | ------- |
| 1     | Parrilla completa 10×6                                     | 60      |
| 2     | Pirámide (filas de 2, 4, 6, 8, 10 y 10 bloques, centradas) | 40      |
| 3     | Tablero de ajedrez (`(col + fila)` par)                    | 30      |
| 4     | Filas con huecos (`gaps4`)                                 | 39      |
| 5     | Marco + cruz central (fila 2 y columna 4)                  | 39      |

Total 208 bloques → **puntuación máxima posible 2.080**.

- Explosión de bloque: 4 frames del spritesheet durante 150 ms.
- Sonido: `ball-bounce.mp3` (paredes y paleta) y `break-sound.mp3` (bloque), reproducidos con `cloneNode().play()`.
- HUD dibujado en el canvas (score, nivel, pelotas) → lo sustituye el HUD de React de `GamePlayer`.
- P / Esc pausan; en la pausa hay 5 botones dibujados en el canvas para **saltar de nivel** → se eliminan.
- No hay `localStorage` propio ni tema.

---

## Alcance

**Dentro:**

- Portar a TypeScript la jugabilidad del original sin cambiar sus reglas: paleta, pelota, física de rebote (incluido que la paleta no cambia `vx`), un bloque por frame, 5 niveles con sus patrones y velocidades, 3 vidas y +10 por bloque, tal como figura en el inventario.
- Estilo **neón vectorial sin sprites**: paleta, pelota y bloques como rectángulos con glow (`shadowBlur`). Los colores `cyan`, `magenta`, `yellow` y `green` de `levels.ts` salen de los tokens `--cyan`, `--magenta`, `--yellow`, `--green` (leídos con `getComputedStyle` al montar, con hex de respaldo); `red`, `hotpink` y `gray` usan hex fijos en `constants.ts` (`#ff4d4d`, `#ff69b4`, `#8a8fa3`) porque el tema no tiene tokens equivalentes. Fondo transparente sobre la pantalla CRT.
- Código en `app/_components/games/arkanoid/`: `engine.ts`, `entities.ts` (colisiones y movimiento como funciones puras), `levels.ts` (los 5 niveles generados con la misma lógica que `levels.js`), `input.ts`, `audio.ts`, `constants.ts` y `arkanoid-canvas.tsx`. Nada se importa de `references/`.
- Coordenadas lógicas **800×600**, idénticas a las del original; no se dibuja HUD en el canvas, así que la banda superior (y < 80) queda libre para la pelota. Puntuación, vidas y nivel van al HUD de React.
- Controles: **← →** (400 px/s) y **ratón**. El ratón escucha `mousemove` solo sobre el canvas, convierte la posición a coordenadas lógicas (`(clientX − rect.left) × 800 / rect.width`) y se ignora en pausa o con el modal abierto. Sin P ni Esc; sin salto de nivel.
- Vidas y nivel reales: `onLives(3)` al empezar y cada vez que cambian; `onLevel(1)` al empezar y en cada cambio de nivel.
- Victoria: al destruir el último bloque del nivel 5 el motor llama a `onGameOver(score)` (se abre el modal "FIN DEL JUEGO", sin overlay dibujado en el canvas).
- Sonido: copiar los dos mp3 a `public/games/arkanoid/sounds/` y cargarlos con rutas absolutas `/games/arkanoid/sounds/…`. La pausa detiene los efectos en curso; `destroy()` los libera; un fallo de `play()` (autoplay bloqueado) se ignora sin romper el juego.
- Registrar `arkanoid: ArkanoidCanvas` en `app/_components/games/registry.ts`.
- Migración `add_game_arkanoid` en Supabase con el MCP: una fila en `games` (`arkanoid`, `ARKANOID`). Sin cambios de esquema.
- Renombrar la entrada `bloque-buster` de `app/data/games.ts`: `id` a `arkanoid` y `title` de `BLOQUE BUSTER` a `ARKANOID` (portada `cover-bricks` y demás campos no cambian), buscando y actualizando cualquier otra referencia al `id` antiguo en `app/` y `lib/`, y ajustar `long`/`short` solo si prometen algo que el port no tiene.
- Actualizar `CLAUDE.md`.

**Fuera de alcance (para futuras specs):**

- Explosión animada de bloques y spritesheet (el port es vectorial).
- Salto de nivel desde la pausa y pausa por teclado (P / Esc); auto-pausa al perder foco.
- Controles táctiles y gamepad.
- Música y volumen/silenciar (solo se portan los dos efectos).
- Mecánicas nuevas: ángulo de rebote según el punto de la paleta, power-ups, bloques de varios golpes, saque manual, partidas infinitas tras el nivel 5.
- Cambios de `types.ts` o de `GamePlayer` (el contrato actual ya sirve).
- Sembrar los demás juegos en `games`, RLS, Auth, anti-trampas, rate limiting, estadísticas reales (`best`, `plays` siguen mock).
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Migración `add_game_arkanoid` (aplicada con `apply_migration`; el SQL queda documentado aquí porque no existe carpeta `supabase/`):

```sql
insert into public.games (id, title) values ('arkanoid', 'ARKANOID');
```

La entrada ya existe en `app/data/games.ts` (como `bloque-buster` hasta el paso 2, luego `arkanoid`), así que `/biblioteca` la mostrará. No hay cambios de esquema, por lo que no se regenera `database.types.ts`. La puntuación máxima (2.080) cabe de sobra en `scores.score` (0–9.999.999); aun así el motor aplica el tope de 9.999.999 antes de notificar.

El contrato `GameCanvasProps` no cambia (`onLives?` ya es opcional desde la SPEC 08; Arkanoid sí lo llama).

Motor (sin React):

```ts
// app/_components/games/arkanoid/engine.ts
export function createArkanoidGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void };
```

Estado interno:

```ts
type Paddle = { x: number; y: number; w: number; h: number }; // y = 560, w = 81, h = 14
type Ball = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}; // 16×16
type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
};
type BlockColor =
  "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";
type Level = {
  speed: number;
  blocks: { col: number; row: number; color: BlockColor }[];
};
// state: score, lives, levelIndex, blocks, ended
```

Convenciones:

- Coordenadas lógicas 800×600, origen arriba a la izquierda; `draw()` aplica `setTransform(canvas.width / 800, …)` cada frame.
- Constantes del original: `PADDLE_SPEED = 400`, `BLOCK_W = 64`, `BLOCK_H = 24`, `BLOCKS_ORIGIN_X = 80`, `BLOCKS_ORIGIN_Y = 80`, `BASE_BALL_VX = 200`, `BASE_BALL_VY = −300`.
- `dt` se limita a 50 ms (el original no lo limitaba; evita que la pelota atraviese bloques o la paleta tras volver de una pausa o de otra pestaña). Al reanudar se reinicia `lastTime`.
- Al cambiar de nivel la pelota se recoloca sobre la paleta con la velocidad del nivel nuevo; la paleta, la puntuación y las vidas se conservan.
- Fin de partida (una sola vez): vidas = 0, o último bloque del nivel 5 destruido. El motor llama a `onGameOver(score)` y no dibuja ningún "GAME OVER" ni "¡Completaste el juego!".
- `onScore`, `onLives` y `onLevel` se llaman solo cuando el valor cambia.
- Teclas retenidas (`ArrowLeft`/`ArrowRight`) se vacían al pausar para que la paleta no quede "pegada".
- No se añade ninguna variable de entorno.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` la guía de Client Components, y en `app/globals.css` los estilos `.crt`, `.crt-screen` y `.game-arena`. Releer `app/_components/game-player.tsx`, `app/_components/games/types.ts`, `registry.ts` y `tetris/tetris-canvas.tsx` por dentro. Sin cambios en el repo.
2. Renombrar en `app/data/games.ts` el `id` de `bloque-buster` a `arkanoid` y el `title` a `ARKANOID`; revisar `long`/`short`. Actualizar cualquier otra referencia (`grep -rn "bloque-buster" app lib` no debe dejar nada). Verificación: `npx tsc --noEmit`; `/juegos/arkanoid` muestra el título ARKANOID y `/juegos/arkanoid/jugar` sigue con el placeholder.
3. Copiar `ball-bounce.mp3` y `break-sound.mp3` a `public/games/arkanoid/sounds/`. Verificación: los dos archivos se sirven en `/games/arkanoid/sounds/ball-bounce.mp3` y `/games/arkanoid/sounds/break-sound.mp3`.
4. Crear `arkanoid/constants.ts` (dimensiones, velocidades, colores de respaldo, rutas de audio, tope de puntuación) y `arkanoid/levels.ts` (los 5 niveles con la misma generación que `levels.js`: `rowColors1/2/4`, pirámide `pyStart`/`pyEnd`, ajedrez, `gaps4`, marco + cruz). Verificación: `npx tsc --noEmit`.
5. Crear `arkanoid/entities.ts`: `buildBlocks(level)`, `placeBall(paddle, level)`, `collideAABB(ball, block)`, `movePaddle`, `stepBall` (paredes, paleta, un bloque por frame) como funciones puras. Verificación: `npx tsc --noEmit` y `npx eslint app`.
6. Crear `arkanoid/input.ts`: `createInput(canvas, …)` con `keydown`/`keyup` para ← → y `mousemove` sobre el canvas; expone `setActive(boolean)`, `getAxis()` y `destroy()`. `preventDefault` solo de ← → y solo con el juego activo y el foco fuera de `input`/`textarea`/`select`. Sin P ni Esc. Verificación: `npx tsc --noEmit` y `npx eslint app`.
7. Crear `arkanoid/audio.ts`: `createSfx()` con `bounce()`, `breakBlock()`, `pause()` y `destroy()`; reproduce clones, ignora los errores de `play()`, y al pausar detiene y descarta los clones en curso. Verificación: `npx tsc --noEmit` y `npx eslint app`.
8. Crear `arkanoid/engine.ts` con `createArkanoidGame`: bucle `requestAnimationFrame`, actualización por pasos del original, cambio de nivel, vidas, puntuación, fin de partida, dibujo neón (bloques, paleta, pelota; colores de los tokens leídos al montar), `setPaused` (la lógica y el sonido se congelan, se sigue dibujando) y `destroy` (cancela el bucle, quita listeners y libera el audio). Callbacks solo al cambiar el valor. Verificación: `npx tsc --noEmit` y `npx eslint app`.
9. Crear `arkanoid/arkanoid-canvas.tsx` copiando el patrón de `asteroids-canvas.tsx` (refs para `paused` y callbacks, motor creado una vez, `ResizeObserver` con 800×600 y `devicePixelRatio`, `aria-label="Juego ARKANOID"`). Verificación: `npx tsc --noEmit`.
10. Registrar `arkanoid` en `registry.ts`. Verificación: `/juegos/arkanoid/jugar` es jugable dentro del CRT con teclado y ratón y con sonido; `/juegos/serpentina/jugar` sigue con el placeholder; `/juegos/rocas/jugar` y `/juegos/tetris/jugar` se comportan igual; a 375 px no hay scroll horizontal.
11. Aplicar la migración `add_game_arkanoid` con el MCP. Verificación: `execute_sql` muestra `games` con exactamente `rocas`, `tetris` y `arkanoid`; `/biblioteca` muestra las tres tarjetas; `/salon` muestra las pestañas GLOBAL, ROCAS, TETRIS y ARKANOID.
12. Prueba de extremo a extremo y limpieza: jugar `arkanoid`, perder, guardar, ver la fila en `scores`, en `/salon` y en `/juegos/arkanoid`, y borrar después las filas de prueba (`delete from scores where game_id = 'arkanoid'`). Verificación: `scores` sin filas de prueba de `arkanoid`.
13. Actualizar `CLAUDE.md` (juego jugable, carpeta `arkanoid/`, assets en `public/games/arkanoid/`, ratón y sonido, `games` con tres filas, qué sigue siendo placeholder). Verificación: el documento refleja todo lo anterior.

---

## Criterios de aceptación

- [ ] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores.
- [ ] `/juegos/arkanoid/jugar` responde 200, muestra el canvas dentro de la pantalla CRT y la consola no muestra errores ni avisos de hidratación.
- [ ] La partida empieza en el nivel 1 con 60 bloques (10×6) de 64×24 px, la paleta de 81×14 centrada en y = 560 y la pelota de 16×16 sobre la paleta, que sale al instante con `vx = 200`, `vy = −300`.
- [ ] ← y → mueven la paleta a 400 px/s sin salir de 0–800; el ratón sobre el canvas la centra bajo el cursor con el mismo límite; el ratón se ignora en pausa y con el modal abierto.
- [ ] La pelota rebota en las paredes izquierda y derecha y en el techo; al golpear la paleta sube (`vy = −|vy|`) y `vx` no cambia.
- [ ] Destruir un bloque suma exactamente 10 puntos, invierte `vy` y destruye como máximo un bloque por frame.
- [ ] Si la pelota cae bajo y = 600 se pierde una vida y la pelota vuelve a la paleta con la velocidad del nivel actual; la paleta y los bloques restantes no se reinician.
- [ ] Al destruir el último bloque de un nivel se carga el siguiente con la pelota sobre la paleta, conservando puntuación y vidas, y la velocidad cambia a ×1,10 / ×1,21 / ×1,33 / ×1,46 (niveles 2 a 5).
- [ ] Los 5 niveles tienen 60, 40, 30, 39 y 39 bloques con los patrones del inventario.
- [ ] Al destruir el último bloque del nivel 5 se abre el modal "FIN DEL JUEGO" con la puntuación final (2.080 si no se ha fallado ninguno); no se dibuja "¡Completaste el juego!" en el canvas.
- [ ] El HUD de React muestra puntuación, vidas (`♥ ♥ ♥` al empezar, una menos por cada pelota perdida) y nivel reales del juego.
- [ ] Los rebotes en pared y paleta reproducen `ball-bounce.mp3` y los bloques `break-sound.mp3`; si el navegador bloquea el audio el juego sigue funcionando sin errores en consola.
- [ ] El botón PAUSA congela por completo el juego (pelota, paleta, sonido en curso), muestra "EN PAUSA" y REANUDAR continúa sin saltos de la pelota ni de la paleta; no se oye ningún sonido nuevo durante la pausa.
- [ ] Si una flecha está pulsada al pausar y se suelta durante la pausa, la paleta no queda moviéndose al reanudar.
- [ ] La tecla P y Esc no pausan el juego, no existe salto de nivel y cambiar de pestaña no pausa.
- [ ] Con el juego en marcha, ← → no hacen scroll (incluso con el botón PAUSA o REANUDAR pulsado antes); en pausa o con el modal abierto el juego no responde a las teclas y se puede escribir (con espacios) en el campo de nombre.
- [ ] Cuando se pierde la última vida se abre el modal "FIN DEL JUEGO" con la puntuación final correcta y no hay ningún "GAME OVER" dibujado en el canvas; el botón FIN abre el mismo modal con la puntuación actual.
- [ ] JUGAR DE NUEVO reinicia desde puntuación 0, nivel 1, 3 vidas y bloques completos sin duplicar bucles, listeners ni sonidos (la pelota no va el doble de rápido tras reiniciar).
- [ ] SALIR detiene el bucle, quita los listeners y libera el audio: tras volver a `/biblioteca`, las flechas vuelven a hacer scroll.
- [ ] A 375 px el canvas ocupa el ancho disponible, mantiene la proporción 4:3 sin scroll horizontal, el ratón sigue alineado con la paleta y los trazos se ven nítidos con `devicePixelRatio` alto.
- [ ] La puntuación notificada nunca supera 9.999.999.
- [ ] La migración `add_game_arkanoid` solo inserta la fila de `arkanoid` en `games`; `games` contiene exactamente `rocas`, `tetris` y `arkanoid`, sin filas de relleno de otros juegos.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` una fila con `game_id = 'arkanoid'`, la puntuación final y el nombre en mayúsculas, y el modal muestra el enlace a `/salon`.
- [ ] `/salon` muestra la pestaña ARKANOID con su top y GLOBAL suma por jugador su mejor marca de `rocas`, `tetris` y `arkanoid`.
- [ ] `/juegos/arkanoid` muestra el top real de ARKANOID y `/biblioteca` muestra su tarjeta junto a ROCAS y TETRIS.
- [ ] `/juegos/rocas/jugar` y `/juegos/tetris/jugar` funcionan igual que antes (HUD de vidas y nivel incluido) y el resto de placeholders (`serpentina`, etc.) siguen con puntuación simulada y sin tarjeta en `/biblioteca`.
- [ ] `grep -rn "bloque-buster" app lib` no devuelve resultados.
- [ ] Al terminar las pruebas no quedan filas de prueba en `scores` para `arkanoid`.
- [ ] Ningún archivo bajo `app/` importa de `references/` ni `createClient` de `@supabase/supabase-js`.
- [ ] `CLAUDE.md` documenta ARKANOID como juego jugable, la carpeta `arkanoid/`, los assets de sonido y el control por ratón.

---

## Decisiones

- **Sí:** renombrar la entrada `bloque-buster` a `arkanoid` (id y título) (decisión del usuario), como se hizo con `caida` → `tetris`; el `id` pasa a coincidir con el juego y las rutas con `/juegos/arkanoid`. Conserva portada y demás campos. **No:** reutilizar `bloque-buster` como id, que no describe el juego; **No:** crear una entrada nueva, que duplicaría el concepto.
- **Sí:** neón vectorial sin spritesheet (decisión del usuario), con los tokens `--cyan`, `--magenta`, `--yellow`, `--green` y hex fijos para `red`, `hotpink` y `gray`. Coherente con `rocas` y evita cargar y esperar un PNG. **No:** copiar el spritesheet; **No:** portar la explosión animada, que depende de él y va en otra spec si se quiere.
- **Sí:** portar los dos mp3 a `public/games/arkanoid/sounds/` (decisión del usuario), con pausa que detiene los efectos, liberación en `destroy()` y tolerancia al autoplay bloqueado. **No:** enlazar los archivos desde `references/`; **No:** música ni control de volumen.
- **Sí:** ← → y ratón sobre el canvas, sin P / Esc ni salto de nivel (decisión del usuario). El salto de nivel permitiría ir directo a bloques de los niveles altos y falsearía el ranking; la pausa es solo del botón, como en la SPEC 05. **No:** `mousemove` en toda la ventana, que movería la paleta con el cursor fuera del marco.
- **Sí:** la victoria del nivel 5 llama a `onGameOver(score)` y abre el modal (decisión del usuario). Un único fin de partida; el overlay "¡Completaste el juego!" y el "GAME OVER" del original se eliminan. **No:** reiniciar en bucle desde el nivel 1, que cambia la mecánica.
- **Sí:** conservar la física del original tal cual (la paleta no cambia `vx`, un bloque por frame, solo se invierte `vy`, la pelota sale al instante). Es el comportamiento real y cambiarlo altera el juego. **No:** rebote según el punto de impacto.
- **Sí:** `dt` limitado a 50 ms. **No:** copiar el original sin límite, que dejaría atravesar bloques o la paleta tras una pausa larga.
- **Sí:** mantener las coordenadas 800×600 y las posiciones del original aunque el HUD salga del canvas; la banda superior queda libre. **No:** desplazar los bloques, que cambiaría la geometría de los niveles.
- **Sí:** `GamePlayer` es dueño de pausa, HUD, fin de partida y guardado; motor TS sin React + componente delgado; reiniciar remontando con `key`, sin `reset()`. Callbacks solo al cambiar el valor.
- **Sí:** una fila en `games` define ranking, pestaña en `/salon` y tarjeta en `/biblioteca` (SPEC 06 y 07). **No:** sembrar los demás placeholders.
- **Sí:** sin controles táctiles ni gamepad: el ratón es el único puntero soportado; táctil merece su spec.

---

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Doble montaje de `useEffect` (Strict Mode) duplica bucles, listeners y audio.                 | `destroy()` cancela `requestAnimationFrame`, quita listeners y libera los sonidos; criterio sobre la velocidad tras reiniciar. |
| Autoplay bloqueado o mp3 que no carga rompe el juego.                                         | `play()` con captura de errores; el juego no depende del audio; criterio específico.                                           |
| Los sonidos siguen sonando durante la pausa o tras SALIR.                                     | `setPaused(true)` detiene y descarta los clones en curso; `destroy()` los libera; criterios de pausa y de salida.              |
| Las flechas activan el botón enfocado o hacen scroll.                                         | `GamePlayer` desenfoca el botón de pausa y `preventDefault` solo con el juego activo y el foco fuera de campos editables.      |
| El ratón queda desalineado al escalar el canvas o en móvil.                                   | Conversión con `getBoundingClientRect()` y 800 lógicos en cada evento; criterio a 375 px.                                      |
| La pelota atraviesa bloques con `dt` grande.                                                  | `dt` limitado a 50 ms (≈ 15 px a la velocidad máxima, menor que el bloque).                                                    |
| `vx` constante puede dejar la pelota en trayectorias repetitivas o casi verticales.           | Aceptado: es la mecánica del original (sin rebote por ángulo).                                                                 |
| Renombrar `bloque-buster` deja referencias huérfanas (landing, actividad mock).               | Paso 2 con `grep` y criterio que exige cero resultados.                                                                        |
| Sin RLS ni anti-trampas cualquiera con la clave publicable puede escribir `scores` y `games`. | Aceptado temporalmente (SPEC 06): la spec de RLS debe ser la siguiente que toque la base.                                      |
| Insertar `arkanoid` en `games` crea la pestaña en `/salon` antes de que el juego sea jugable. | El paso 11 va después de registrar el canvas (paso 10).                                                                        |
| Los datos de prueba quedan en `scores`.                                                       | El paso 12 los borra y hay un criterio que lo verifica.                                                                        |

---

## Lo que **no** entra en esta spec

- Spritesheet, explosiones animadas y cualquier asset gráfico.
- Salto de nivel, pausa por teclado, auto-pausa, controles táctiles y gamepad.
- Música, control de volumen y silenciado.
- Mecánicas nuevas (rebote por ángulo, power-ups, bloques resistentes, saque manual, niveles extra).
- Cambios en `types.ts` o `GamePlayer`.
- Sembrar otros juegos en `games`, RLS, Auth, anti-trampas y rate limiting.
- Estadísticas reales (`best`, `plays`), landing con datos reales y cambios en `/juegos/[id]` fuera del top.
- Cualquier otro juego.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
