# SPEC INVADERS-01 — Juego real: INVADERS (id `invaders`), oleadas alienígenas y escudos

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (`specs/05-juego-rocas-asteroides.md`), SPEC 07 (`specs/07-biblioteca-juegos-en-base-de-datos.md`), SPEC 08 (`specs/08-juego-tetris.md`, que hizo `onLives` opcional), SPEC 10 (`specs/10-juego-snake-serpiente-y-frutas.md`, último juego con reglas definidas por spec)
> **Fecha:** 2026-11-10
> **Objetivo:** Convertir el placeholder `invasores` en INVADERS (id `invaders`), un shooter original de oleadas alienígenas en neón vectorial, jugable con teclado en `/juegos/invaders/jugar` dentro de `GamePlayer` y registrado en `PLAYABLE_GAMES`.

---

## Por qué existe esta spec

**Tema recibido:** INVADERS, un shooter de oleadas de alienígenas en formación (sugerencia S-01 de `references/game-suggestions-todo.md`, pendiente y recomendada, que justifica usar el id `invaders`).

`invasores` es hoy un placeholder con puntuación simulada. Como en SNAKE, **no hay juego original que portar**: `references/started-games/` solo contiene `02-asteroids`, `03-tetris` y `04-arkanoid`. Esta spec **define las reglas**. Del tema se toma solo la idea de género (formación que marcha y baja, cañón en la base, escudos, nave de bonificación). No se recrea ningún juego comercial concreto: ni su nombre, ni sus personajes, ni sus sprites. Los aliens son figuras geométricas vectoriales propias.

Reglas fijadas por el usuario (no son supuestos):

- Oleadas de aliens vectoriales en formación que se desplazan lateralmente, bajan al tocar el borde y aceleran al bajar el número de vivos y en cada oleada.
- Cañón del jugador con un solo disparo propio en pantalla a la vez.
- 4 escudos destructibles, dañados por disparos propios y enemigos.
- Nave misteriosa que cruza la parte superior y vale 150 puntos fijos.
- 3 vidas (reporta `onLives`) y nivel = oleada (reporta `onLevel`).
- Id `invaders`, título `INVADERS`, categoría `SHOOTER`; reemplaza el placeholder `invasores`.

Todo lo demás (números, teclas, colores, fin por invasión) lo decidió el agente y figura como **(supuesto del agente)** en _Decisiones_.

Esta spec deja el juego jugable pero **sin ranking**: la fila en `games`, la pestaña en `/salon` y la tarjeta en `/biblioteca` llegan con `specs/game-jam/invaders/02-integracion-invaders-leaderboard.md`.

---

## Alcance

**Dentro:**

- Motor en TypeScript sin React en `app/_components/games/invaders/`: `engine.ts`, `entities.ts` (funciones puras), `input.ts`, `constants.ts` e `invaders-canvas.tsx`. Nada se importa de `references/`.
- Coordenadas lógicas **800×600** (caben tal cual en el marco 4:3). No se dibuja HUD en el canvas: puntuación, vidas y nivel van al HUD de React.
- Reglas completas (todas las cifras en _Modelo de datos_):
  - **Formación** de **5 filas × 10 columnas = 50 aliens**, hitbox de 36×24 px, paso de rejilla 52×40 px. Fila 0 (arriba) vale **30**, filas 1–2 valen **20**, filas 3–4 valen **10**: **900 puntos por oleada**.
  - La formación **marcha a pasos**: cada `stepInterval` ms se desplaza **8 px** en horizontal. Si el paso sacaría a un alien vivo del margen 16–784, en lugar de moverse en horizontal **baja 20 px** e invierte la dirección. Los límites se calculan solo con los aliens vivos.
  - `stepInterval(vivos, oleada) = max(50, round(50 + (500 × 0,9^(oleada−1) − 50) × (vivos − 1) / 49))` ms: 500 ms con 50 vivos en la oleada 1, 50 ms con 1 vivo.
  - Cada oleada empieza más abajo: `y` inicial de la fila 0 = `90 + min(oleada − 1, 4) × 16` (90 en la oleada 1, 154 desde la 5).
  - **Cañón** de 44×20 px con la parte superior en y = 536, centrado en x = 400 al empezar, a **320 px/s**, con el centro limitado a 24–776.
  - **Un solo disparo propio** en pantalla (4×14 px, **600 px/s** hacia arriba). Mantener pulsada la tecla de disparo vuelve a disparar en cuanto el disparo anterior desaparece.
  - **Disparos enemigos** (4×12 px) desde el alien vivo más bajo de una columna. Velocidad `min(360, 240 + (oleada − 1) × 15)` px/s. Intervalo base `max(400, 1100 − (oleada − 1) × 100)` ms, multiplicado por un factor aleatorio de 0,75–1,25. Como máximo `min(5, 2 + floor((oleada − 1) / 2))` disparos enemigos simultáneos. Con probabilidad 1/3 dispara la columna más cercana al cañón; si no, una columna viva al azar.
  - Un disparo propio y uno enemigo que se cruzan se destruyen los dos (sin puntos).
  - **4 escudos** de 72×48 px (rejilla de 12×8 celdas de 6 px, 78 celdas con forma de arco), con el borde superior en y = 440 y centros en x = 160, 320, 480 y 640. Cualquier disparo que alcanza una celda viva la destruye junto con sus 4 vecinas ortogonales, y el disparo desaparece. Un alien que se solapa con un escudo borra las celdas que toca. Los escudos se **restauran completos al empezar cada oleada**.
  - **Nave misteriosa** de 48×20 px en y = 48, a **140 px/s**, entrando por la izquierda y por la derecha de forma alterna. Aparece por primera vez a los 15 s de empezar la oleada y después cada 20–30 s al azar, **máximo 2 por oleada** y solo si quedan **8 o más aliens vivos**. Vale **150 puntos fijos**.
  - **3 vidas.** Un disparo enemigo que toca el cañón quita una vida. Durante **1000 ms** todo se congela (formación, temporizadores, nave misteriosa), se eliminan todos los disparos y el cañón parpadea. Después reaparece centrado en x = 400. Con 0 vidas, fin de partida.
  - **Invasión:** si el borde inferior de cualquier alien vivo llega a y ≥ 536 (la línea del cañón), la partida termina al instante, queden las vidas que queden (`onLives(0)` y luego `onGameOver`).
  - **Oleada despejada:** al morir el último alien hay una transición de **1000 ms** con todo congelado (se eliminan disparos y nave misteriosa, sin puntos). Después empieza la oleada siguiente: nivel + 1, formación nueva y escudos restaurados. Las vidas y la puntuación se conservan. Las oleadas son infinitas.
  - Puntuación máxima **por oleada: 1.200** (900 de aliens + 2 × 150 de nave misteriosa). La puntuación se limita a 9.999.999 antes de notificarla.
- Controles: **← / A** y **→ / D** mueven, **Espacio / ↑ / W** disparan. Sin P ni Esc. Ratón, táctil y gamepad no se usan.
- Callbacks: `onLives(3)` y `onLevel(1)` al empezar; `onScore`, `onLives` y `onLevel` solo cuando el valor cambia; `onGameOver(score)` una sola vez. El canvas no dibuja "GAME OVER".
- Estilo **neón vectorial** sin assets: tokens `--cyan` (cañón y disparo propio), `--magenta` (aliens de la fila 0 y disparos enemigos), `--yellow` (aliens de las filas 1–2 y nave misteriosa), `--green` (aliens de las filas 3–4, escudos y línea de suelo). Se leen con `getComputedStyle` al montar, con hex de respaldo. Fondo transparente sobre la pantalla CRT. Nada se copia a `public/`.
- Catálogo: renombrar la entrada `invasores` de `app/data/games.ts` a `id: "invaders"`, `title: "INVADERS"`. Se reescriben `short`/`long`. Se conservan `cat: "SHOOTER"`, `color: "green"`, `cover: "cover-invaders"`, `best` y `plays`. Se actualiza `app/data/activity.ts` (`gameId: "invasores"` → `"invaders"`).
- Portada: **no hace falta CSS nuevo**. `cover-invaders` ya existe en `app/globals.css` (en el bloque `/* ===== cover art generators (pure CSS) ===== */` y también en la copia sin capa de la plantilla, hacia la línea 877) y ya dibuja aliens verdes y magenta sobre un cañón cian.
- Registrar `invaders: InvadersCanvas` en `app/_components/games/registry.ts`.

**Fuera de alcance (para futuras specs):**

- Fila en `games`, pestaña en `/salon`, top en `/juegos/invaders`, tarjeta en `/biblioteca`, prueba de extremo a extremo y documentación en `CLAUDE.md`. Todo eso va en `specs/game-jam/invaders/02-integracion-invaders-leaderboard.md`.
- Sonido y música.
- Controles táctiles, ratón y gamepad.
- Pausa por teclado (P / Esc) y auto-pausa al perder foco.
- Vidas extra, power-ups, varios tipos de disparo, aliens que bajan en picado, jefes, modos de dificultad.
- Puntuación variable de la nave misteriosa y bonus por oleada o por precisión.
- Animaciones complejas (partículas con física, temblor de pantalla). Solo hay un destello vectorial de 200 ms al destruir un alien.
- Cambios en `types.ts` o en `GamePlayer`.
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Esta spec **no toca la base de datos**: no hay migración ni cambio de esquema, y no se regenera `database.types.ts`. Hasta la spec 02, `invaders` no tiene fila en `games`.

Catálogo (`app/data/games.ts`, entrada que hoy es `invasores`):

```ts
{
  id: "invaders",
  title: "INVADERS",
  short: "Detén las oleadas alienígenas antes de que aterricen.",
  long: "Formaciones de aliens de neón marchan de lado a lado y bajan cada vez que tocan el borde, más rápido cuantos menos quedan. Tu cañón solo puede tener un disparo en el aire: cúbrete tras cuatro escudos que se desgastan y caza la nave misteriosa que cruza el cielo por 150 puntos. Tres vidas, oleadas sin fin.",
  cat: "SHOOTER",
  cover: "cover-invaders",
  color: "green",
  best: 54190, // mock, sin cambios
  plays: "18.0K", // mock, sin cambios
}
```

El contrato `GameCanvasProps` no cambia (INVADERS sí llama a `onLives`).

Motor (sin React):

```ts
// app/_components/games/invaders/engine.ts
export function createInvadersGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void };
```

Estado interno:

```ts
type Rect = { x: number; y: number; w: number; h: number };
type AlienKind = "top" | "mid" | "low"; // fila 0 | filas 1–2 | filas 3–4
type Alien = { col: number; row: number; kind: AlienKind; alive: boolean };
type Formation = {
  x: number; // esquina superior izquierda de la celda (col 0, fila 0)
  y: number;
  dir: 1 | -1; // empieza en 1 (derecha)
  frame: 0 | 1; // alterna en cada paso (animación de 2 cuadros)
  stepAccum: number; // ms
  aliens: Alien[]; // 50
};
type Shot = { x: number; y: number; prevY: number; vy: number }; // esquina sup. izq.
type Shield = { x: number; y: number; cells: boolean[] }; // 12×8, índice fila*12+col
type Mystery = { x: number; dir: 1 | -1 } | null;
type Burst = { x: number; y: number; color: string; t: number }; // destello 200 ms
type Popup = { x: number; y: number; t: number }; // "150" durante 800 ms
type Phase = "playing" | "dying" | "waveClear" | "ended";

// state: score, lives, wave, phase, phaseTimer, cannonX (centro), playerShot: Shot | null,
//        enemyShots: Shot[], fireAccum, nextFireMs, formation, shields: Shield[4],
//        mystery, mysteryTimer, mysteryCount, mysteryFromLeft, bursts, popups
```

Constantes (`constants.ts`):

```ts
const W = 800,
  H = 600;
const COLS = 10,
  ROWS = 5,
  ALIEN_W = 36,
  ALIEN_H = 24,
  CELL_X = 52,
  CELL_Y = 40;
const START_X = 148; // (800 − (9 × 52 + 36)) / 2: formación de 504 px centrada
const START_Y = 90,
  WAVE_Y_STEP = 16,
  WAVE_Y_MAX_STEPS = 4;
const MARGIN = 16,
  STEP_X = 8,
  STEP_Y = 20;
const BASE_STEP_MS = 500,
  MIN_STEP_MS = 50,
  WAVE_SPEEDUP = 0.9;
const ROW_POINTS = [30, 20, 20, 10, 10];
const CANNON_W = 44,
  CANNON_H = 20,
  CANNON_Y = 536,
  CANNON_SPEED = 320,
  CANNON_MIN_X = 24,
  CANNON_MAX_X = 776;
const SHOT_W = 4,
  SHOT_H = 14,
  SHOT_SPEED = 600;
const ENEMY_SHOT_W = 4,
  ENEMY_SHOT_H = 12,
  ENEMY_SHOT_BASE_SPEED = 240,
  ENEMY_SHOT_SPEED_STEP = 15,
  ENEMY_SHOT_MAX_SPEED = 360;
const FIRE_BASE_MS = 1100,
  FIRE_STEP_MS = 100,
  FIRE_MIN_MS = 400,
  FIRE_JITTER = [0.75, 1.25];
const ENEMY_SHOTS_BASE = 2,
  ENEMY_SHOTS_MAX = 5,
  AIMED_SHOT_CHANCE = 1 / 3;
const SHIELD_CENTERS = [160, 320, 480, 640],
  SHIELD_Y = 440,
  SHIELD_COLS = 12,
  SHIELD_ROWS = 8,
  SHIELD_CELL = 6;
// máscara: fila 0 → cols 2–9; fila 1 → cols 1–10; filas 2–4 → todas; filas 5–7 → todas menos cols 4–7 (78 celdas)
const MYSTERY_W = 48,
  MYSTERY_H = 20,
  MYSTERY_Y = 48,
  MYSTERY_SPEED = 140,
  MYSTERY_POINTS = 150;
const MYSTERY_FIRST_MS = 15000,
  MYSTERY_MIN_MS = 20000,
  MYSTERY_MAX_MS = 30000,
  MYSTERY_MAX_PER_WAVE = 2,
  MYSTERY_MIN_ALIVE = 8;
const START_LIVES = 3,
  DYING_MS = 1000,
  WAVE_CLEAR_MS = 1000,
  BURST_MS = 200,
  POPUP_MS = 800;
const INVASION_Y = 536,
  GROUND_Y = 572,
  MAX_DT_MS = 50,
  MAX_SCORE = 9_999_999;
const FALLBACK_COLORS = {
  cyan: "#00f5ff",
  magenta: "#ff006e",
  yellow: "#f5ff00",
  green: "#00ff88",
};
// ALIEN_SHAPES: polilíneas propias dentro de una caja 36×24, 2 cuadros por tipo:
//   top = rombo con dos antenas que cambian de ángulo; mid = hexágono aplanado con pinzas
//   que se abren y cierran; low = cúpula con tres patas que alternan. MYSTERY_SHAPE = disco con cúpula.
```

Curvas derivadas (funciones puras en `entities.ts`):

| Oleada | `y` inicial | Paso con 50 vivos | Paso con 25 vivos | Disparos enemigos máx. | Intervalo base de disparo | Velocidad disparo enemigo |
| ------ | ----------- | ----------------- | ----------------- | ---------------------- | ------------------------- | ------------------------- |
| 1      | 90          | 500 ms            | 270 ms            | 2                      | 1100 ms                   | 240 px/s                  |
| 2      | 106         | 450 ms            | 246 ms            | 2                      | 1000 ms                   | 255 px/s                  |
| 3      | 122         | 405 ms            | 224 ms            | 3                      | 900 ms                    | 270 px/s                  |
| 5      | 154         | 328 ms            | 186 ms            | 4                      | 700 ms                    | 300 px/s                  |
| 8      | 154         | 239 ms            | 143 ms            | 5                      | 400 ms                    | 345 px/s                  |
| 10+    | 154         | ≤ 194 ms          | ≤ 120 ms          | 5                      | 400 ms                    | 360 px/s                  |

Con 1 alien vivo el paso es siempre 50 ms (8 px cada 50 ms = 160 px/s).

Orden de actualización en la fase `playing` (un frame):

1. Mover el cañón según las teclas (← y → a la vez se anulan).
2. Si se pulsa disparo y no hay disparo propio, crearlo centrado sobre el cañón (`y = 536 − 14`).
3. Mover el disparo propio y resolver colisiones con un rectángulo **barrido** (de `prevY` a `y`), en este orden: escudos → disparos enemigos → un alien (como máximo) → nave misteriosa → techo (`y + h < 0`).
4. Si no quedan aliens vivos, pasar a `waveClear` y terminar el frame.
5. Acumular `dt` en `stepAccum`; si llega a `stepInterval`, dar **un** paso (horizontal o bajada + inversión), alternar `frame`, borrar las celdas de escudo que toque un alien y comprobar la invasión.
6. Acumular `dt` en `fireAccum`; si llega a `nextFireMs`, disparar si hay hueco y sortear el siguiente intervalo.
7. Mover los disparos enemigos con rectángulo barrido: escudos → cañón (pasa a `dying`) → suelo (`y ≥ 572`).
8. Temporizador y movimiento de la nave misteriosa; desaparece al salir por el lado opuesto.

Convenciones:

- Coordenadas lógicas 800×600, origen arriba a la izquierda; `draw()` aplica `setTransform(canvas.width / 800, 0, 0, canvas.height / 600, 0, 0)` cada frame.
- `dt` se limita a 50 ms. Como `MIN_STEP_MS = 50`, hay como mucho un paso de formación por frame. Con `dt` = 50 ms el disparo propio recorre 30 px, más que la altura de un alien (24 px): por eso las colisiones de disparos usan el rectángulo barrido. Al reanudar se reinicia `lastTime`.
- Al pausar se vacían las teclas retenidas y se ignora la entrada hasta reanudar. La lógica se congela y el dibujo continúa.
- `rng: () => number` se pasa a las funciones de `entities.ts` que sortean (columna que dispara, intervalos), por defecto `Math.random`.
- Los escudos se dibujan con `fillRect` por celda **sin** `shadowBlur` (312 celdas); aliens, cañón, disparos y nave usan trazo de 2 px con `shadowBlur` 8.
- Fin de partida (una sola vez): 0 vidas, o invasión. `phase = "ended"`, se llama a `onGameOver(score)` y se sigue dibujando el estado final sin texto.
- No se añade ninguna variable de entorno.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` la guía de Client Components, y en `app/globals.css` los estilos `.crt`, `.crt-screen`, `.game-arena` y `.cover-invaders`. Releer `app/_components/game-player.tsx`, `app/_components/games/types.ts`, `registry.ts`, `asteroids/input.ts` y `snake/snake-canvas.tsx`. Sin cambios en el repo.
2. Renombrar en `app/data/games.ts` la entrada `invasores` a `id: "invaders"` y `title: "INVADERS"`, y reescribir `short`/`long` como en _Modelo de datos_. Cambiar `gameId: "invasores"` por `"invaders"` en `app/data/activity.ts`. Verificación: `npx tsc --noEmit`; `grep -rn "invasores" app lib` no devuelve nada; `/juegos/invaders` muestra INVADERS con la portada `cover-invaders`; `/juegos/invaders/jugar` sigue con el placeholder.
3. Crear `invaders/constants.ts` con todas las constantes, la máscara de los escudos, `ALIEN_SHAPES`, `MYSTERY_SHAPE` y `FALLBACK_COLORS`. Verificación: `npx tsc --noEmit`.
4. Crear `invaders/entities.ts`, parte de la formación: `createFormation(wave)`, `alienRect(formation, alien)`, `aliveBounds(formation)`, `stepFormation(formation)` (paso horizontal o bajada + inversión), `stepInterval(alive, wave)`, `waveStartY(wave)`, `reachedInvasion(formation)`. Verificación: `npx tsc --noEmit` y `npx eslint app`.
5. Ampliar `entities.ts` con disparos y escudos: `createShields()`, `hitShield(shield, rect, fromBelow)` (devuelve la celda viva más cercana al origen del disparo o `-1`), `damageShield(shield, cell)` (celda + 4 vecinas), `eraseShieldUnder(shield, rect)`, `sweptRect(shot, w, h)`, `overlaps(a, b)`, `pickShooter(formation, cannonX, rng)`, `maxEnemyShots(wave)`, `fireInterval(wave, rng)`, `enemyShotSpeed(wave)`, `nextMysteryDelay(rng)`. Verificación: `npx tsc --noEmit` y `npx eslint app`.
6. Crear `invaders/input.ts`: `createInput(isActive)` con estado de teclas retenidas (patrón de `asteroids/input.ts`), `clear()` y `destroy()`. Teclas `ArrowLeft`, `ArrowRight`, `ArrowUp`, `Space`, `KeyA`, `KeyD`, `KeyW`. `preventDefault` solo de esas teclas, solo con el juego activo y el foco fuera de `input`/`textarea`/`select`/`contentEditable`. Sin P ni Esc. Verificación: `npx tsc --noEmit` y `npx eslint app`.
7. Crear `invaders/engine.ts`, parte 1: lectura de colores, bucle `requestAnimationFrame` con `dt` ≤ 50 ms, cañón, disparo propio, marcha de la formación, impactos en aliens con puntos por fila, escudos, dibujo vectorial, `setPaused` y `destroy` (cancela el bucle y quita listeners). Verificación: `npx tsc --noEmit` y `npx eslint app`.
8. `engine.ts`, parte 2: disparos enemigos, choque entre disparos, vidas y fase `dying`, invasión, fin de partida con `onGameOver` una sola vez. Verificación: `npx tsc --noEmit` y `npx eslint app`.
9. `engine.ts`, parte 3: nave misteriosa (temporizador, máximo 2, mínimo 8 vivos, 150 puntos, popup), fase `waveClear` y oleada siguiente, destellos de 200 ms, tope de 9.999.999 y callbacks solo al cambiar. Verificación: `npx tsc --noEmit` y `npx eslint app`.
10. Crear `invaders/invaders-canvas.tsx` copiando el patrón de `asteroids-canvas.tsx` (refs para `paused` y callbacks, incluido `onLives?.(v)`, motor creado una vez, `ResizeObserver` con 800×600 y `devicePixelRatio`, `aria-label="Juego INVADERS"`). Verificación: `npx tsc --noEmit`.
11. Registrar `invaders: InvadersCanvas` en `registry.ts`. Verificación: `/juegos/invaders/jugar` es jugable dentro del CRT con el HUD de vidas y nivel; `/juegos/gloton/jugar` sigue con el placeholder; `rocas`, `tetris`, `arkanoid` y `snake` se comportan igual; a 375 px no hay scroll horizontal.

---

## Criterios de aceptación

- [ ] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores.
- [ ] `/juegos/invaders/jugar` responde 200, muestra el canvas dentro de la pantalla CRT y la consola no muestra errores ni avisos de hidratación.
- [ ] La oleada 1 empieza con 50 aliens en 5 filas × 10 columnas, la fila 0 en y = 90 y la formación centrada (x de 148 a 652), con 4 escudos completos y el cañón centrado en x = 400.
- [ ] La formación avanza 8 px a la derecha cada 500 ms con los 50 aliens vivos en la oleada 1.
- [ ] Cuando un alien vivo tocaría el margen (x < 16 o x > 784), la formación baja 20 px en lugar de avanzar e invierte la dirección; si mueren las columnas de un extremo, la formación llega más lejos hacia ese lado.
- [ ] El intervalo de paso sigue `stepInterval`: 270 ms con 25 vivos y 50 ms con 1 vivo en la oleada 1; 450 ms con 50 vivos en la oleada 2.
- [ ] La oleada 2 empieza con la fila 0 en y = 106 y desde la oleada 5 en y = 154.
- [ ] ← / A y → / D mueven el cañón a 320 px/s y su centro no sale de 24–776; pulsar ← y → a la vez lo deja quieto.
- [ ] Espacio, ↑ y W disparan; nunca hay más de un disparo propio en pantalla; manteniendo la tecla se dispara de nuevo en cuanto desaparece el anterior.
- [ ] Destruir un alien de la fila 0 suma exactamente 30 puntos, de las filas 1–2 suma 20 y de las filas 3–4 suma 10; un disparo destruye como máximo un alien; despejar una oleada suma 900 sin contar la nave.
- [ ] El disparo propio no atraviesa aliens ni escudos aunque el frame dure 50 ms.
- [ ] Los aliens disparan desde el alien vivo más bajo de su columna; en la oleada 1 nunca hay más de 2 disparos enemigos a la vez, en la 3 más de 3 y desde la 7 más de 5.
- [ ] Un disparo propio y uno enemigo que se cruzan desaparecen los dos sin sumar puntos.
- [ ] Un disparo propio o enemigo que alcanza un escudo destruye la celda alcanzada y sus vecinas ortogonales y desaparece; los aliens que se solapan con un escudo borran las celdas que tocan; al empezar cada oleada los 4 escudos vuelven a tener 78 celdas.
- [ ] La nave misteriosa aparece por primera vez a los 15 s de oleada, cruza en y = 48 a 140 px/s, alterna el lado de entrada, vale exactamente 150 puntos, muestra "150" durante 800 ms y no aparece más de 2 veces por oleada ni con menos de 8 aliens vivos.
- [ ] Un disparo enemigo que toca el cañón quita una vida, borra todos los disparos y congela el juego 1000 ms; el cañón reaparece en x = 400.
- [ ] El HUD de React muestra `♥ ♥ ♥` al empezar y un corazón menos por cada impacto, la puntuación real y el nivel = número de oleada (`01`, `02`, …).
- [ ] Al despejar una oleada se congela el juego 1000 ms y empieza la siguiente con el nivel + 1, conservando puntuación y vidas.
- [ ] Si un alien vivo llega con su borde inferior a y = 536, la partida termina al instante aunque queden vidas.
- [ ] Al perder la última vida o por invasión se abre el modal "FIN DEL JUEGO" con la puntuación final correcta, `onGameOver` se llama una sola vez y no hay ningún "GAME OVER" dibujado en el canvas; el botón FIN abre el mismo modal con la puntuación actual.
- [ ] Los aliens se dibujan como figuras vectoriales propias de 2 cuadros (rombo magenta, hexágono amarillo, cúpula verde), el cañón en cian, los escudos y el suelo en verde; los colores salen de los tokens del tema y, si faltan, de los hex de respaldo.
- [ ] El botón PAUSA congela por completo el juego (formación, disparos, nave, temporizadores), muestra "EN PAUSA" y REANUDAR continúa sin saltos; una tecla soltada durante la pausa no deja el cañón moviéndose.
- [ ] La tecla P y Esc no pausan el juego y cambiar de pestaña no pausa.
- [ ] Con el juego en marcha, las flechas y Espacio no hacen scroll (incluso con el botón PAUSA o REANUDAR pulsado antes) y Espacio dispara en lugar de activar ese botón; en pausa o con el modal abierto el juego no responde y se puede escribir (con espacios y las letras A, D y W) en el campo de nombre.
- [ ] JUGAR DE NUEVO reinicia desde puntuación 0, oleada 1, 3 vidas y escudos completos sin duplicar bucles ni listeners (la formación no marcha el doble de rápido tras reiniciar).
- [ ] SALIR detiene el bucle y quita los listeners: tras volver a `/biblioteca`, las flechas y Espacio vuelven a hacer scroll.
- [ ] A 375 px el canvas ocupa el ancho disponible, mantiene la proporción 4:3 sin scroll horizontal y los trazos se ven nítidos con `devicePixelRatio` alto.
- [ ] La puntuación notificada es siempre un entero y nunca supera 9.999.999.
- [ ] `grep -rn "invasores" app lib` no devuelve resultados; `/juegos/invaders` muestra INVADERS con los nuevos `short`/`long` y la portada `cover-invaders`, y `app/globals.css` no cambia.
- [ ] `/juegos/rocas/jugar`, `/juegos/tetris/jugar`, `/juegos/arkanoid/jugar` y `/juegos/snake/jugar` funcionan igual que antes (HUD incluido: `rocas` y `arkanoid` con corazones, `tetris` y `snake` con `—`).
- [ ] Los placeholders restantes (`gloton`, `ranaria`, `duelo-pixel`) siguen con puntuación simulada.
- [ ] Esta spec no inserta nada en `games`: GUARDAR PUNTUACIÓN en INVADERS muestra el error genérico hasta aplicar la spec 02, y `/biblioteca` aún no muestra su tarjeta.
- [ ] Ningún archivo bajo `app/` importa de `references/` ni `createClient` de `@supabase/supabase-js`, y no se añade nada a `public/`.

---

## Decisiones

- **Sí:** renombrar la entrada `invasores` a `invaders` (id y título `INVADERS`, categoría `SHOOTER`) en lugar de crear otra (decisión del usuario), como `caida` → `tetris` y `serpentina` → `snake`. **No:** mantener `invasores`; **No:** una entrada nueva que duplique el concepto.
- **Sí:** reglas fijas de oleadas que marchan, bajan y aceleran, un disparo propio, 4 escudos destructibles, nave misteriosa de 150 fijos, 3 vidas y nivel = oleada (decisión del usuario).
- **Sí:** juego de género original con figuras geométricas propias (rombo, hexágono, cúpula, disco) (supuesto del agente). **No:** reproducir sprites, nombres o personajes de ningún arcade comercial.
- **Sí:** formación de 5 × 10 = 50 aliens de 36×24 en rejilla de 52×40 (supuesto del agente). Ocupa 504 px de ancho y deja 132 px de holgura por lado en 800 px. **No:** 5 × 11, que deja muy poco recorrido lateral con este tamaño de alien.
- **Sí:** puntos 30 / 20 / 20 / 10 / 10 por fila, 900 por oleada (supuesto del agente). Es la convención del género y premia apuntar arriba. **No:** puntos por velocidad de despeje, que complican la comparación.
- **Sí:** marcha a pasos de 8 px con `stepInterval` lineal en los vivos y factor 0,9 por oleada, mínimo 50 ms (supuesto del agente). Cumple la aceleración pedida y el mínimo de 50 ms garantiza un paso por frame con `dt` ≤ 50 ms. **No:** movimiento continuo, que pierde el ritmo de marcha característico.
- **Sí:** bajada de 20 px y cada oleada empieza 16 px más abajo hasta 4 veces (supuesto del agente). En la oleada 1 hacen falta 14 bajadas para invadir; en la 5 bastan 10.
- **Sí:** invasión = fin inmediato aunque queden vidas (supuesto del agente). Es lo habitual del género y castiga no limpiar la formación. **No:** quitar una vida y reiniciar la oleada, que permitiría farmear la nave.
- **Sí:** cañón de 44×20 en y = 536 a 320 px/s; disparo propio a 600 px/s con autodisparo al mantener (supuesto del agente). El límite de un disparo en pantalla ya fija la cadencia, así que mantener la tecla no da ventaja injusta.
- **Sí:** disparos enemigos con intervalo `max(400, 1100 − 100 × (oleada − 1))` ms ±25 %, máximo `min(5, 2 + floor((oleada − 1)/2))` y velocidad `min(360, 240 + 15 × (oleada − 1))` px/s; 1/3 apuntados a la columna del cañón (supuesto del agente). Sube la presión por oleada sin hacer imposibles las primeras.
- **Sí:** choque entre disparos propio y enemigo destruye ambos (supuesto del agente). Añade una defensa activa. **No:** que se atraviesen.
- **Sí:** escudos de 12×8 celdas de 6 px (78 celdas, arco con muesca), daño en cruz de 5 celdas, borrado por contacto de aliens y restauración en cada oleada (supuesto del agente). **No:** escudos que persisten entre oleadas, que hacen las oleadas altas casi imposibles; **No:** daño por píxel, más caro y difícil de verificar.
- **Sí:** nave misteriosa a los 15 s y luego cada 20–30 s, máximo 2 por oleada y solo con 8 o más vivos (supuesto del agente). Evita el exploit de dejar un alien vivo y farmear naves; la puntuación máxima por oleada queda en 1.200 y es comparable entre partidas.
- **Sí:** al recibir un impacto, 1000 ms congelado, se borran los disparos y el cañón reaparece en x = 400 (supuesto del agente). Da tiempo a reaccionar y evita morir dos veces seguidas.
- **Sí:** 3 vidas sin vidas extra (supuesto del agente sobre las vidas extra; las 3 vidas son del usuario). El HUD muestra como mucho 3 corazones. **No:** vida extra por puntos.
- **Sí:** teclas ← / A, → / D para mover y Espacio / ↑ / W para disparar (supuesto del agente). Cubre flechas y WASD como SNAKE y Espacio como ROCAS. **No:** P / Esc, ratón ni táctil.
- **Sí:** colores: cañón `--cyan`, fila 0 y disparos enemigos `--magenta`, filas 1–2 y nave `--yellow`, filas 3–4, escudos y suelo `--green` (supuesto del agente). Coincide con la portada `cover-invaders` existente. **No:** colores fijos fuera del tema.
- **Sí:** reutilizar la portada `cover-invaders`, que ya existe en las dos copias de `app/globals.css` (supuesto del agente). **No:** crear una clase nueva, que duplicaría CSS sin necesidad.
- **Sí:** reescribir `short`/`long` y conservar `best` y `plays` mock (supuesto del agente), como en las specs 09 y 10. **No:** prometer power-ups o vidas extra que el juego no tiene.
- **Sí:** colisiones de disparos con rectángulo barrido (supuesto del agente). A 600 px/s y `dt` de 50 ms el disparo recorre 30 px, más que un alien.
- **Sí:** `GamePlayer` es dueño de pausa, HUD, fin de partida y guardado; motor TS sin React + componente delgado; reiniciar remontando con `key`, sin `reset()`; callbacks solo al cambiar el valor.
- **Sí:** separar el juego (esta spec) de la integración con `games` (spec 02) (decisión del flujo game-jam). **No:** insertar la fila aquí.

---

## Riesgos

| Riesgo                                                                                                            | Mitigación                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Hasta aplicar la spec 02, GUARDAR PUNTUACIÓN en INVADERS muestra el error genérico porque no hay fila en `games`. | Aceptado y cubierto por un criterio; la spec 02 inserta la fila justo después.                                               |
| El tema evoca un arcade con marca y el juego acaba pareciendo una copia.                                          | Solo mecánicas de género; figuras geométricas propias, nombre genérico y sin textos ni sprites de terceros.                  |
| Los disparos atraviesan aliens o escudos con frames largos.                                                       | `dt` ≤ 50 ms y colisión con rectángulo barrido; criterio específico.                                                         |
| La dificultad de las oleadas altas (50 ms por paso, 5 disparos a 360 px/s) es injusta o, al revés, trivial.       | Curva documentada en tabla; todas las cifras viven en `constants.ts` y se pueden ajustar en otra spec sin tocar el contrato. |
| Farmear la nave misteriosa dejando pocos aliens vivos.                                                            | Máximo 2 por oleada y solo con 8 o más vivos; la invasión sigue avanzando.                                                   |
| Dibujar 312 celdas de escudo con `shadowBlur` baja el rendimiento.                                                | Las celdas se dibujan sin `shadowBlur`; solo las figuras llevan glow.                                                        |
| Doble montaje de `useEffect` (Strict Mode) duplica bucles y listeners.                                            | `destroy()` cancela `requestAnimationFrame` y quita listeners; criterio sobre la velocidad tras reiniciar.                   |
| Espacio o las flechas activan el botón enfocado o hacen scroll; A, D y W impiden escribir el nombre.              | `GamePlayer` desenfoca el botón de pausa; `preventDefault` solo con el juego activo y el foco fuera de campos editables.     |
| Renombrar `invasores` deja referencias huérfanas (actividad mock de la landing).                                  | Paso 2 con `grep` y criterio que exige cero resultados.                                                                      |
| Móvil sin controles táctiles: a 375 px se ve pero no se puede jugar.                                              | Aceptado como en los demás juegos; táctil va en su propia spec.                                                              |

---

## Lo que **no** entra en esta spec

- Fila en `games`, ranking en `/salon` y `/juegos/invaders`, tarjeta en `/biblioteca`, prueba de extremo a extremo y `CLAUDE.md` (spec 02 de esta carpeta).
- Sonido, música, controles táctiles, ratón y gamepad.
- Pausa por teclado y auto-pausa.
- Vidas extra, power-ups, jefes, aliens en picado, nave misteriosa de puntos variables, bonus por oleada.
- Animaciones complejas y assets gráficos.
- Cambios en `types.ts`, `GamePlayer` o `app/globals.css`.
- Sembrar placeholders en `games`, RLS, Auth, anti-trampas y rate limiting.
- Cualquier otro juego.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
