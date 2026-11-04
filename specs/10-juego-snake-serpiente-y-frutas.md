# SPEC 10 — Juego real: SNAKE (id `snake`) con leaderboard y entrada en la biblioteca

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (`05-juego-rocas-asteroides.md`), SPEC 06 (`06-leaderboard-y-tabla-games.md`), SPEC 07 (`07-biblioteca-juegos-en-base-de-datos.md`), SPEC 08 (`08-juego-tetris.md`, que hizo `onLives` opcional)
> **Fecha:** 2026-11-04
> **Objetivo:** Crear el clásico Snake como cuarto juego real de la plataforma, a partir de la entrada `serpentina` renombrada a `snake`, jugable en `/juegos/snake/jugar` dentro de `GamePlayer`, con serpiente neón, frutas del spritesheet aportado y su fila en `games` para que tenga ranking en `/salon`, top en `/juegos/snake` y tarjeta en `/biblioteca`.

---

## Por qué existe esta spec

`serpentina` es hoy un placeholder con puntuación simulada. A diferencia de `rocas`, `tetris` y `arkanoid`, **no hay juego original que portar**: `references/started-games/` no contiene Snake. Solo hay unos assets en `references/source-assets/snake-assets/` (`fruits.png` y `sprites.js`) y la indicación de que el juego "funciona igual que el clásico". Por eso esta spec **define las reglas** (el usuario las confirmó al crearla) en lugar de inventariarlas desde un `game.js`.

Inventario de los assets:

- `fruits.png`: 3790×442 px, fondo transparente, tres filas del mismo conjunto de 22 frutas en tres estilos (plano arriba, **pixel-art en el medio**, realista abajo). Origen: spriters-resource (Google Snake Game).
- `sprites.js`: global `window.SPRITE_ATLAS` con el recorte (`x`, `y`, `w`, `h`) de 22 frutas de la **fila del medio** (`y = 136`, `h = 160`). Es JavaScript de navegador con global, así que no se importa: se porta a TypeScript.
- **Los nombres del atlas no son fiables.** Por ejemplo, `apple` está en `x = 2786`, donde la hoja dibuja una frambuesa/tomate, y `banana` en `x = 34`, donde la hoja dibuja una manzana. Solo se confía en las coordenadas; el paso 3 las verifica recortándolas a ojo.
- El estilo de la fila del medio es pixel-art, que además encaja con la estética retro de la plataforma.

Decisiones de reglas confirmadas por el usuario: cuadrícula 20×15, muro mortal, una sola vida, serpiente neón vectorial con frutas del PNG, flechas + WASD, sin sonido.

---

## Alcance

**Dentro:**

- Motor de Snake en TypeScript sin React, en `app/_components/games/snake/`: `engine.ts`, `entities.ts` (funciones puras sobre la serpiente y la comida), `input.ts`, `constants.ts` (incluye el recorte de frutas portado de `sprites.js`), `snake-canvas.tsx`. Nada se importa de `references/`.
- Coordenadas lógicas **800×600**: cuadrícula de **20 columnas × 15 filas**, celda de **40×40 px**, que llena el canvas sin márgenes y cabe en el marco 4:3.
- Reglas:
  - La serpiente empieza con **3 segmentos**, cabeza en la celda (col 9, fila 7), moviéndose a la derecha.
  - Avanza una celda por paso. Intervalo inicial **140 ms**; a mayor nivel, menor intervalo (ver Modelo de datos).
  - Comer una fruta suma **10 puntos** y alarga la serpiente **1** segmento. Siempre hay exactamente una fruta, en una celda libre al azar.
  - Chocar con **un muro** o con **el propio cuerpo** termina la partida. Entrar en la celda que la cola libera en ese mismo paso **no** es colisión (comportamiento clásico).
  - Si la serpiente llena las 300 celdas no queda sitio para fruta: la partida termina como victoria con `onGameOver(score)`.
  - El **nivel** es `floor(frutas / 5) + 1` y reduce el intervalo hasta un mínimo de 60 ms.
- Sin vidas: el juego **no llama a `onLives`** y el HUD muestra `—` (contrato de la SPEC 08). Sí llama a `onScore` y `onLevel` (`onLevel(1)` al empezar).
- Controles: **← ↑ → ↓** y **W A S D**. Cola de entrada de **hasta 2 giros** pendientes; se ignora el giro de 180° y repetir la dirección actual (calculado contra el último giro de la cola, o la dirección actual si está vacía).
- Estilo: serpiente y cuadrícula **vectoriales neón** con los tokens `--green` (cuerpo), `--cyan` (cabeza) y un trazo tenue de cuadrícula (hex de respaldo si no existen), leídos con `getComputedStyle` al montar; fondo transparente sobre la pantalla CRT. La comida es un **sprite** de `fruits.png`.
- Assets: copiar `fruits.png` a `public/games/snake/fruits.png` y cargarlo con `/games/snake/fruits.png`. El motor espera a que la imagen cargue antes de arrancar el bucle; si falla, dibuja la comida como un círculo `--magenta` y el juego sigue funcionando.
- Registrar `snake: SnakeCanvas` en `app/_components/games/registry.ts`.
- Migración `add_game_snake` en Supabase con el MCP: una fila en `games` (`snake`, `SNAKE`). Sin cambios de esquema.
- Renombrar la entrada `serpentina` de `app/data/games.ts`: `id` a `snake` y `title` de `SERPENTINA` a `SNAKE` (portada `cover-snake`, `cat`, `color`, `best` y `plays` no cambian), actualizar cualquier otra referencia en `app/` y `lib/`, y reescribir `long`/`short` para no prometer "núcleos magenta" ni que se "hace más veloz" con cada bocado si no coincide con el port.
- Actualizar `CLAUDE.md`.

**Fuera de alcance (para futuras specs):**

- Sonido y música (el usuario decidió prescindir de ellos).
- Controles táctiles (swipe) y gamepad.
- Pausa por teclado (P / Esc), auto-pausa al perder foco.
- Mecánicas nuevas: varios tipos de fruta con puntos distintos, power-ups, obstáculos, modo wrap (atravesar muros), modos de dificultad, varias vidas.
- Animaciones (crecimiento, muerte, partículas) y sprites para la serpiente.
- Los estilos plano y realista del spritesheet.
- Sembrar los demás juegos en `games`, RLS, Auth, anti-trampas, rate limiting, estadísticas reales (`best`, `plays` siguen mock).
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Migración `add_game_snake` (aplicada con `apply_migration`; el SQL queda documentado aquí porque no existe carpeta `supabase/`):

```sql
insert into public.games (id, title) values ('snake', 'SNAKE');
```

La entrada ya existe en `app/data/games.ts` (como `serpentina` hasta el paso 2, luego `snake`), así que `/biblioteca` la mostrará. No hay cambios de esquema, por lo que no se regenera `database.types.ts`. La puntuación máxima posible (297 frutas × 10 = 2.970) cabe de sobra en `scores.score` (0–9.999.999); aun así el motor aplica el tope de 9.999.999 antes de notificar.

El contrato `GameCanvasProps` no cambia (`onLives?` ya es opcional; Snake no lo llama).

Motor (sin React):

```ts
// app/_components/games/snake/engine.ts
export function createSnakeGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void };
```

Estado y constantes:

```ts
type Dir = "up" | "down" | "left" | "right";
type Cell = { col: number; row: number }; // 0..19, 0..14
// state: snake: Cell[] (cabeza en [0]), dir: Dir, queue: Dir[] (máx. 2),
//        food: { cell: Cell; fruit: number }, fruitsEaten, score, ended

const COLS = 20,
  ROWS = 15,
  CELL = 40; // 800×600
const START_LENGTH = 3,
  START_HEAD = { col: 9, row: 7 };
const POINTS_PER_FRUIT = 10,
  FRUITS_PER_LEVEL = 5;
const START_STEP_MS = 140,
  MIN_STEP_MS = 60,
  STEP_DECREMENT_MS = 10;
// intervalo del nivel L: max(60, 140 - (L - 1) * 10) ms → nivel 9 o más = 60 ms

// recorte portado de sprites.js (solo coordenadas; fila del medio de fruits.png)
type FruitCrop = { x: number; y: number; w: number; h: number };
const FRUIT_CROPS: FruitCrop[]; // subconjunto de 6 frutas elegido en el paso 3
```

Convenciones:

- Coordenadas lógicas 800×600, origen arriba a la izquierda; `draw()` aplica `setTransform(canvas.width / 800, …)` cada frame.
- La lógica avanza con un acumulador de `dt` (limitado a 50 ms, así que con 60 ms de intervalo mínimo hay como mucho un paso por frame). Al reanudar se reinicia `lastTime`.
- El sprite se dibuja manteniendo su proporción, centrado dentro de la celda con 2 px de margen (no se estira).
- `onScore` y `onLevel` se llaman solo cuando el valor cambia; `onGameOver(score)` una sola vez, sin dibujar "GAME OVER".
- Al pausar se vacía la cola de giros y se ignora la entrada hasta reanudar.
- No se añade ninguna variable de entorno.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` la guía de Client Components y de assets estáticos de `public/`, y en `app/globals.css` los estilos `.crt`, `.crt-screen` y `.game-arena`. Releer `app/_components/game-player.tsx`, `app/_components/games/types.ts`, `registry.ts` y `tetris/tetris-canvas.tsx`. Sin cambios en el repo.
2. Renombrar en `app/data/games.ts` el `id` de `serpentina` a `snake` y el `title` a `SNAKE`; reescribir `long`/`short`. Actualizar cualquier otra referencia (`grep -rn "serpentina" app lib` no debe dejar nada, p. ej. `app/data/activity.ts`). Verificación: `npx tsc --noEmit`; `/juegos/snake` muestra SNAKE y `/juegos/snake/jugar` sigue con el placeholder.
3. Copiar `fruits.png` a `public/games/snake/fruits.png` (solo el PNG; `sprites.js` no se copia ni se enlaza). Elegir 6 recortes del atlas **por coordenadas, no por nombre**, comprobándolos recortando la imagen (p. ej. con Playwright o una página temporal) para que cada uno muestre una fruta completa y reconocible; anotarlos en `constants.ts` en el paso siguiente. Verificación: `/games/snake/fruits.png` se sirve y los 6 recortes elegidos se ven bien.
4. Crear `snake/constants.ts` (cuadrícula, tiempos, colores de respaldo, ruta de la imagen, `FRUIT_CROPS`, tope de puntuación). Verificación: `npx tsc --noEmit`.
5. Crear `snake/entities.ts` con funciones puras: `createSnake()`, `nextHead(head, dir)`, `isOpposite(a, b)`, `hitsWall(cell)`, `hitsBody(snake, cell, willGrow)`, `spawnFood(snake, rng)` (celda libre al azar o `null` si el tablero está lleno), `stepInterval(level)`. Verificación: `npx tsc --noEmit` y `npx eslint app`.
6. Crear `snake/input.ts`: `createInput(onDir)` con `keydown` para ← ↑ → ↓ y W A S D; expone `setActive(boolean)` y `destroy()`. `preventDefault` solo de esas teclas y solo con el juego activo y el foco fuera de `input`/`textarea`/`select`. Sin P ni Esc. Verificación: `npx tsc --noEmit` y `npx eslint app`.
7. Crear `snake/engine.ts` con `createSnakeGame`: carga de la imagen antes de arrancar el bucle (con respaldo si falla), bucle `requestAnimationFrame` con acumulador, cola de giros (máx. 2, sin 180°), colisiones, comida y crecimiento, puntos, nivel, fin de partida (muro, cuerpo, tablero lleno), dibujo neón de cuadrícula, serpiente y sprite de la fruta, `setPaused` (la lógica se congela, se sigue dibujando) y `destroy` (cancela el bucle, quita listeners, ignora una carga de imagen que llegue después). Callbacks solo al cambiar el valor. Verificación: `npx tsc --noEmit` y `npx eslint app`.
8. Crear `snake/snake-canvas.tsx` copiando el patrón de `asteroids-canvas.tsx` (refs para `paused` y callbacks, motor creado una vez, `ResizeObserver` con 800×600 y `devicePixelRatio`, `aria-label="Juego SNAKE"`). Verificación: `npx tsc --noEmit`.
9. Registrar `snake` en `registry.ts`. Verificación: `/juegos/snake/jugar` es jugable dentro del CRT; `/juegos/gloton/jugar` sigue con el placeholder; `/juegos/rocas/jugar`, `/juegos/tetris/jugar` y `/juegos/arkanoid/jugar` se comportan igual; a 375 px no hay scroll horizontal.
10. Aplicar la migración `add_game_snake` con el MCP. Verificación: `execute_sql` muestra `games` con exactamente `rocas`, `tetris`, `arkanoid` y `snake`; `/biblioteca` muestra las cuatro tarjetas; `/salon` muestra las pestañas GLOBAL, ROCAS, TETRIS, ARKANOID y SNAKE.
11. Prueba de extremo a extremo y limpieza: jugar `snake`, perder, guardar, ver la fila en `scores`, en `/salon` y en `/juegos/snake`, y borrar después las filas de prueba (`delete from scores where game_id = 'snake'`). Verificación: `scores` sin filas de prueba de `snake`.
12. Actualizar `CLAUDE.md` (juego jugable, carpeta `snake/`, asset en `public/games/snake/`, `games` con cuatro filas, qué sigue siendo placeholder). Verificación: el documento refleja todo lo anterior.

---

## Criterios de aceptación

- [ ] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores.
- [ ] `/juegos/snake/jugar` responde 200, muestra el canvas dentro de la pantalla CRT y la consola no muestra errores ni avisos de hidratación.
- [ ] La partida empieza con una serpiente de 3 segmentos, cabeza en la celda (9, 7), moviéndose a la derecha, y exactamente una fruta en una celda que no ocupa la serpiente.
- [ ] La cuadrícula es de 20×15 celdas de 40 px y llena el área lógica de 800×600.
- [ ] ← ↑ → ↓ y W A S D cambian la dirección; el giro de 180° y repetir la dirección actual se ignoran; pulsar dos giros dentro del mismo paso los ejecuta en pasos consecutivos (cola de 2) y un tercero se descarta.
- [ ] La serpiente avanza una celda cada 140 ms en el nivel 1.
- [ ] Comer una fruta suma exactamente 10 puntos, alarga la serpiente en 1 segmento y genera otra fruta en una celda libre.
- [ ] El nivel es `floor(frutas / 5) + 1` y el intervalo baja 10 ms por nivel hasta un mínimo de 60 ms (nivel 2 = 130 ms, nivel 9 y superiores = 60 ms).
- [ ] Chocar con cualquiera de los cuatro muros termina la partida.
- [ ] Chocar con el propio cuerpo termina la partida; entrar en la celda que la cola libera en ese paso no la termina.
- [ ] Si la serpiente llena las 300 celdas se llama a `onGameOver(score)` sin errores.
- [ ] La comida se dibuja con un recorte de `fruits.png` sin estirarse; si la imagen no carga, se dibuja un círculo y el juego sigue funcionando sin errores en consola.
- [ ] El HUD de React muestra puntuación y nivel reales y `—` en vidas (el juego no llama a `onLives`).
- [ ] El botón PAUSA congela por completo el juego, muestra "EN PAUSA" y REANUDAR continúa sin saltos ni pasos extra; los giros pulsados durante la pausa no se aplican.
- [ ] La tecla P y Esc no pausan el juego y cambiar de pestaña no pausa.
- [ ] Con el juego en marcha, las flechas no hacen scroll (incluso con el botón PAUSA o REANUDAR pulsado antes); en pausa o con el modal abierto el juego no responde a las teclas y se puede escribir (con espacios y letras W A S D) en el campo de nombre.
- [ ] Al terminar la partida se abre el modal "FIN DEL JUEGO" con la puntuación final correcta y no hay ningún "GAME OVER" dibujado en el canvas; el botón FIN abre el mismo modal con la puntuación actual.
- [ ] JUGAR DE NUEVO reinicia desde puntuación 0, nivel 1 y 3 segmentos sin duplicar bucles ni listeners (la serpiente no va el doble de rápido tras reiniciar).
- [ ] SALIR detiene el bucle y quita los listeners: tras volver a `/biblioteca`, las flechas vuelven a hacer scroll.
- [ ] A 375 px el canvas ocupa el ancho disponible, mantiene la proporción 4:3 sin scroll horizontal y los trazos y sprites se ven nítidos con `devicePixelRatio` alto.
- [ ] La puntuación notificada nunca supera 9.999.999.
- [ ] La migración `add_game_snake` solo inserta la fila de `snake` en `games`; `games` contiene exactamente `rocas`, `tetris`, `arkanoid` y `snake`, sin filas de relleno de otros juegos.
- [ ] GUARDAR PUNTUACIÓN inserta en `scores` una fila con `game_id = 'snake'`, la puntuación final y el nombre en mayúsculas, y el modal muestra el enlace a `/salon`.
- [ ] `/salon` muestra la pestaña SNAKE con su top y GLOBAL suma por jugador su mejor marca de `rocas`, `tetris`, `arkanoid` y `snake`.
- [ ] `/juegos/snake` muestra el top real de SNAKE y `/biblioteca` muestra su tarjeta junto a ROCAS, TETRIS y ARKANOID.
- [ ] `/juegos/rocas/jugar`, `/juegos/tetris/jugar` y `/juegos/arkanoid/jugar` funcionan igual que antes (HUD de vidas y nivel incluido) y el resto de placeholders (`gloton`, etc.) siguen con puntuación simulada y sin tarjeta en `/biblioteca`.
- [ ] `grep -rn "serpentina" app lib` no devuelve resultados.
- [ ] Al terminar las pruebas no quedan filas de prueba en `scores` para `snake`.
- [ ] Ningún archivo bajo `app/` importa de `references/` ni `createClient` de `@supabase/supabase-js`, y ningún archivo enlaza `references/source-assets/`.
- [ ] `CLAUDE.md` documenta SNAKE como juego jugable, la carpeta `snake/` y el asset de `public/games/snake/`.

---

## Decisiones

- **Sí:** renombrar la entrada `serpentina` a `snake` (id y título) (decisión del usuario), como se hizo con `caida` → `tetris` y `bloque-buster` → `arkanoid`. Conserva portada y demás campos. **No:** reutilizar `serpentina` como id, que no coincide con el nombre que el usuario le da al juego; **No:** crear una entrada nueva, que duplicaría el concepto.
- **Sí:** serpiente y cuadrícula neón vectoriales con los tokens del tema y fruta con sprite del PNG (decisión del usuario). Coherente con los otros juegos y aprovecha los assets aportados. **No:** todo vectorial, que dejaría sin uso los assets; **No:** sprites también para la serpiente, que el spritesheet no incluye.
- **Sí:** usar la **fila del medio (pixel-art)** de `fruits.png`, que es la que cubre `sprites.js`. Al preguntar describí la fila superior como el estilo elegido, pero el atlas aportado solo recorta la del medio; se mantiene el atlas del usuario y encaja con la estética retro. Cambiar de fila exige recalcular los recortes (otra spec).
- **Sí:** fiarse de las coordenadas del atlas y no de los nombres (verificado en la hoja: p. ej. `apple` y `banana` no apuntan a esas frutas), y elegir 6 recortes a mano en el paso 3. **No:** portar los 22 recortes con nombres engañosos.
- **Sí:** muro mortal, una vida, cuadrícula 20×15 de 40 px (decisión del usuario). Es el clásico y 800/20 = 600/15 = 40 llena el canvas sin márgenes ni escalado raro. **No:** modo wrap ni cuadrícula 25×19, que cambian la dificultad y el ranking.
- **Sí:** sin vidas, el HUD muestra `—` usando el contrato opcional de la SPEC 08. **No:** inventar vidas para llenar el HUD.
- **Sí:** puntos +10 por fruta y nivel cada 5 frutas con intervalo `max(60, 140 − 10 × (nivel − 1))`. Son reglas de diseño definidas al crear la spec (el original no tiene código); el mínimo de 60 ms garantiza como mucho un paso por frame con `dt` limitado a 50 ms.
- **Sí:** entrar en la celda que libera la cola no cuenta como colisión y se descartan los giros de 180°, como en el Snake clásico; la cola de 2 giros evita perder pulsaciones rápidas. **No:** cola ilimitada, que acumula giros viejos.
- **Sí:** flechas + WASD (decisión del usuario) y sin sonido ni táctil. **No:** swipe, que abre complejidad táctil que las demás specs dejaron fuera.
- **Sí:** tablero lleno = victoria con `onGameOver(score)`. Un único fin de partida; sin overlay dibujado.
- **Sí:** `GamePlayer` es dueño de pausa, HUD, fin de partida y guardado; motor TS sin React + componente delgado; reiniciar remontando con `key`, sin `reset()`. Callbacks solo al cambiar el valor.
- **Sí:** una fila en `games` define ranking, pestaña en `/salon` y tarjeta en `/biblioteca` (SPEC 06 y 07). **No:** sembrar los demás placeholders.
- **Sí:** copiar solo `fruits.png` a `public/games/snake/`; el código se porta, no se enlaza. **No:** importar ni enlazar nada de `references/` (incluida `references/source-assets/`).

---

## Riesgos

| Riesgo                                                                                          | Mitigación                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Los nombres del atlas no corresponden a las frutas reales.                                      | Elegir recortes por coordenadas y verificarlos visualmente en el paso 3.                                                     |
| `fruits.png` pesa y retrasa el arranque, o no carga.                                            | El bucle espera a la imagen; si falla, comida como círculo y el juego sigue. Un criterio lo verifica.                        |
| Los recortes tienen proporciones distintas (110–170 px de ancho) y se ven deformados.           | El sprite se dibuja manteniendo la proporción, centrado en la celda; criterio de "sin estirarse".                            |
| Giros rápidos se pierden o permiten un 180° que mata a la serpiente.                            | Cola de 2 giros y comprobación del 180° contra el último giro encolado; criterio específico.                                 |
| Doble montaje de `useEffect` (Strict Mode) duplica bucles y listeners, o la imagen llega tarde. | `destroy()` cancela `requestAnimationFrame`, quita listeners e ignora la carga tardía; criterio de velocidad tras reiniciar. |
| Las flechas activan el botón enfocado o hacen scroll; W A S D impiden escribir el nombre.       | `GamePlayer` desenfoca el botón de pausa; `preventDefault` solo con el juego activo y el foco fuera de campos editables.     |
| Partidas largas con un intervalo de 60 ms vuelven el juego muy difícil.                         | Aceptado: es la curva de dificultad del clásico; se puede ajustar en una spec posterior sin tocar el contrato.               |
| Renombrar `serpentina` deja referencias huérfanas (landing, actividad mock).                    | Paso 2 con `grep` y criterio que exige cero resultados.                                                                      |
| Sin RLS ni anti-trampas cualquiera con la clave publicable puede escribir `scores` y `games`.   | Aceptado temporalmente (SPEC 06): la spec de RLS debe ser la siguiente que toque la base.                                    |
| Insertar `snake` en `games` crea la pestaña en `/salon` antes de que el juego sea jugable.      | El paso 10 va después de registrar el canvas (paso 9).                                                                       |
| Los datos de prueba quedan en `scores`.                                                         | El paso 11 los borra y hay un criterio que lo verifica.                                                                      |

---

## Lo que **no** entra en esta spec

- Sonido, música y volumen.
- Controles táctiles y gamepad.
- Pausa por teclado, auto-pausa.
- Mecánicas nuevas (wrap, varias frutas con puntos distintos, power-ups, obstáculos, vidas, dificultades).
- Animaciones, partículas y sprites para la serpiente; los estilos plano y realista del spritesheet.
- Cambios en `types.ts` o `GamePlayer`.
- Sembrar otros juegos en `games`, RLS, Auth, anti-trampas y rate limiting.
- Estadísticas reales (`best`, `plays`), landing con datos reales y cambios en `/juegos/[id]` fuera del top.
- Cualquier otro juego.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
