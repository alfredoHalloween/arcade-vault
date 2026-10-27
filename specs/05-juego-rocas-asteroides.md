# SPEC 05 — Primer juego real: ROCAS (Asteroids) dentro del reproductor

> **Estado:** Implementado
> **Depende de:** SPEC 01 (`01-mvp-pantallas-visuales.md`)
> **Fecha:** 2026-10-27
> **Objetivo:** Adaptar el juego Asteroids de `references/started-games/02-asteroids/` como el juego real de la entrada `rocas`, jugable en `/juegos/rocas/jugar` dentro del marco de `GamePlayer`, que controla la pausa y el fin de partida.

---

## Por qué existe esta spec

Hasta ahora `/juegos/[id]/jugar` muestra un placeholder con puntuación simulada (`setInterval` con números aleatorios). Esta spec sustituye ese placeholder por un juego real para una sola entrada del catálogo y fija el contrato entre el marco (`GamePlayer`) y los juegos, para que los siguientes juegos (Tetris, Arkanoid) se enchufen igual. El original es JavaScript plano con globales, `document.getElementById` y su propio HUD, pausa y pantalla de game over, así que no se puede copiar tal cual.

---

## Alcance

**Dentro:**

- Portar a TypeScript la jugabilidad del original sin cambiar sus reglas: nave con rotación, empuje e inercia; disparo con cooldown de 0,2 s; asteroides de tamaño 3, 2 y 1 que se parten; power-up "3x" (disparo triple 5 s); partículas; envolvimiento toroidal; 3 vidas; invencibilidad de 3 s al reaparecer; nivel completado al limpiar asteroides (`3 + nivel` asteroides en el siguiente). Puntos: grande 20, mediano 50, pequeño 100.
- Estilo vectorial con neón de la plataforma: mismos trazos y geometría, con colores de los tokens del tema y `shadowBlur` como glow.
- Código del juego en `app/_components/games/asteroids/`, sin tocar `references/`.
- Registro de juegos jugables en `app/_components/games/registry.ts`: asocia un `id` del catálogo con su componente de canvas. Solo `rocas` está registrado; el resto de juegos conserva el placeholder actual.
- `GamePlayer` sigue siendo el marco y el dueño de:
  - el estado `paused`, controlado solo por el botón PAUSA/REANUDAR (sin P/Esc ni auto-pausa al perder foco) y con su overlay "EN PAUSA";
  - el estado `over` y el modal de guardar puntuación;
  - el HUD de React (jugador, puntuación, vidas, nivel).
- El juego notifica al marco por callbacks: puntuación, vidas, nivel y fin de partida.
- Fin de partida unificado: al quedarse sin vidas el juego avisa y `GamePlayer` abre el modal existente. El botón FIN hace lo mismo con la puntuación actual. JUGAR DE NUEVO reinicia el juego desde cero.
- Escalado responsive: coordenadas lógicas 800×600 escaladas al ancho disponible del contenedor, nítidas en pantallas de alta densidad.
- Evitar el scroll de la página con las flechas y Espacio mientras se juega.
- Ajustar el texto `long` de `rocas` en `app/data/games.ts` para quitar la mención a los OVNIs, que el juego no tiene.
- Guardar la puntuación con el `saveScore` actual de `useSession()` (`localStorage`), sin cambios.
- Actualizar `CLAUDE.md`.

**Fuera de alcance (para futuras specs):**

- Pausa por teclado (P/Esc) y auto-pausa al perder foco o cambiar de pestaña.
- Controles táctiles o gamepad (en móvil el juego se verá pero no se podrá controlar).
- Sonido y música.
- OVNIs o cualquier mecánica nueva que el original no tenga.
- Puntuaciones reales en Supabase, ranking compartido y estadísticas reales (`best`, `plays` siguen siendo mock).
- Portar Tetris (`03-tetris`) y Arkanoid (`04-arkanoid`).
- Reemplazar el placeholder del resto de juegos del catálogo.
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Esta feature no introduce datos persistentes ni cambia `SavedScore`. Define el contrato entre el marco y los juegos:

```ts
// app/_components/games/types.ts
export type GameCanvasProps = {
  /** true mientras el marco está en pausa o con el modal de fin abierto. */
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  /** Se llama una sola vez cuando el jugador se queda sin vidas. */
  onGameOver: (finalScore: number) => void;
};

// app/_components/games/registry.ts
export const PLAYABLE_GAMES: Record<
  string,
  React.ComponentType<GameCanvasProps>
>;
// { rocas: AsteroidsCanvas }
```

Motor del juego (sin React, testeable a mano):

```ts
// app/_components/games/asteroids/engine.ts
export function createAsteroidsGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void };
```

Estados del juego (internos): `'playing' | 'dead' | 'gameover'`, igual que el original. La pausa no es un estado del motor: es un parámetro que congela el bucle.

Convenciones:

- Coordenadas lógicas 800×600, origen arriba a la izquierda. Velocidades en px/s y `dt` limitado a 50 ms, como el original.
- El ciclo de vida lo gobierna `GamePlayer`: reiniciar es cambiar la `key` del componente de canvas, lo que destruye el motor y crea otro.
- Paleta: el motor lee los tokens `--cyan`, `--magenta`, `--yellow` y `--green` con `getComputedStyle` al montar, para no duplicar los hex.
- Paleta de entidades: nave cian, asteroides magenta, balas amarillas, power-up verde, llama del propulsor amarilla, partículas del color del asteroide destruido.
- El HUD de React muestra jugador, puntuación, vidas y nivel. El canvas solo dibuja la cuenta atrás del power-up "3x" (cambia en cada frame, no tiene sentido enviarla por React).
- El nivel y las vidas vienen del juego. Se elimina `POINTS_PER_LEVEL` del flujo de `rocas`.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` la guía de Client Components y `useEffect`/refs, y leer en `app/globals.css` los estilos `.crt`, `.crt-screen` y `.game-arena`. Sin cambios en el repo.
2. Quitar los OVNIs del `long` de `rocas` en `app/data/games.ts`. Verificación: `/juegos/rocas` muestra el texto nuevo.
3. Crear `app/_components/games/types.ts` con `GameCanvasProps` y `app/_components/games/asteroids/utils.ts` (`wrap`, `dist`, `rand`, `randInt`) y `constants.ts` (ancho, alto, radios, velocidades, puntos, constantes del power-up). Verificación: `npx tsc --noEmit`.
4. Crear `asteroids/input.ts`: `createInput()` que escucha `keydown`/`keyup`, expone `keys`, `pressed(code)` (un solo frame) y `clear()`. Hace `preventDefault` de las flechas y Espacio solo si el juego no está en pausa y el foco no está en un `input`, `textarea` o `select`. Verificación: `npx tsc --noEmit` y `npx eslint app`.
5. Crear `asteroids/entities.ts` con `Bullet`, `Asteroid`, `Particle`, tipadas, con `update(dt)` y `draw(ctx, palette)`. Verificación: `npx tsc --noEmit`.
6. Añadir a `entities.ts` `PowerUp` y `Ship` (empuje, arrastre, disparo simple y triple, parpadeo de invencibilidad). Verificación: `npx tsc --noEmit`.
7. Crear `asteroids/engine.ts` con `createAsteroidsGame`: estado, `spawnAsteroids`, `update`, colisiones, `nextLevel`, `killShip`, bucle con `requestAnimationFrame`, `setPaused` (al reanudar se reinicia `lastTime` para no saltar) y `destroy` (cancela el bucle y quita los listeners). Llama a los callbacks solo cuando el valor cambia. Verificación: `npx tsc --noEmit` y `npx eslint app`.
8. Crear `asteroids/asteroids-canvas.tsx` (`"use client"`): monta el `<canvas>`, crea el motor en `useEffect`, pasa `paused` con otro efecto y escala con `ResizeObserver` (lógico 800×600, `devicePixelRatio`). Verificación: `npx tsc --noEmit`.
9. Crear `games/registry.ts` y conectar `GamePlayer`: si el `id` está en `PLAYABLE_GAMES`, monta ese canvas dentro de `crt-screen` en lugar de `game-arena`, desactiva el `setInterval` simulado, recibe puntuación, vidas y nivel por callbacks, pasa `paused || over` y usa una `key` para reiniciar. El botón FIN abre el modal con la puntuación actual y el botón de pausa se desenfoca tras pulsarlo para que Espacio no lo active. Verificación: `/juegos/rocas/jugar` es jugable y `/juegos/serpentina/jugar` sigue con el placeholder.
10. Actualizar `CLAUDE.md` (rutas, contrato de juegos, registro, carpeta del motor, que solo `rocas` es real). Verificación: el documento refleja todo lo anterior.

---

## Criterios de aceptación

- [X] `npx tsc --noEmit` y `npx eslint app` terminan sin errores.
- [X] `/juegos/rocas/jugar` responde 200, muestra el canvas del juego dentro de la pantalla CRT y la consola no muestra errores ni avisos de hidratación.
- [X] La nave rota con ← y →, avanza con ↑ con inercia y dispara con Espacio, con un máximo de un disparo cada 0,2 s.
- [X] Un asteroide grande destruido suma 20 puntos y genera dos medianos; uno mediano suma 50 y genera dos pequeños; uno pequeño suma 100 y no genera nada.
- [X] La nave, las balas y los asteroides reaparecen por el lado opuesto al cruzar un borde.
- [X] Al chocar con un asteroide se pierde una vida y el HUD de React pasa de `♥ ♥ ♥` a `♥ ♥`; la nave reaparece a los 2 s en el centro, parpadea 3 s y no puede morir en ese tiempo.
- [X] Al limpiar todos los asteroides el HUD sube el nivel y aparecen `3 + nivel` asteroides.
- [X] El power-up "3x" se recoge al tocarlo y durante 5 s cada disparo lanza tres balas; la cuenta atrás se ve en el canvas.
- [X] El HUD muestra la puntuación, vidas y nivel reales del juego; ya no hay puntos aleatorios sumándose.
- [X] El botón PAUSA congela por completo el juego (nave, asteroides, balas, partículas), muestra el overlay "EN PAUSA" y REANUDAR continúa sin saltos bruscos de posición.
- [X] Las teclas P y Esc no pausan el juego y cambiar de pestaña no lo pausa.
- [X] Con el juego en marcha, ← → ↑ y Espacio no hacen scroll en la página, incluso con el botón PAUSA o REANUDAR pulsado antes, y Espacio dispara en lugar de activar ese botón.
- [X] En pausa o con el modal abierto, el juego no responde a las teclas, y se puede escribir (incluidos espacios) en el campo de iniciales del modal.
- [X] Al perder la última vida se abre el modal "FIN DEL JUEGO" con la puntuación final correcta y no aparece ningún "GAME OVER" dibujado en el canvas.
- [X] El botón FIN abre el mismo modal con la puntuación en ese momento y el juego queda congelado detrás.
- [X] GUARDAR PUNTUACIÓN guarda en `av_scores` una entrada con `game: "rocas"` y esa puntuación.
- [X] JUGAR DE NUEVO reinicia desde puntuación 0, 3 vidas y nivel 1, sin duplicar listeners ni bucles (la nave no se mueve el doble de rápido tras reiniciar).
- [X] Salir de la página (SALIR) deja de ejecutar el bucle y quita los listeners de teclado: tras volver a `/biblioteca`, las flechas y Espacio vuelven a hacer scroll.
- [X] A 375 px el canvas ocupa el ancho disponible, mantiene la proporción 4:3, sin scroll horizontal; a 1280 px no supera 800 px de ancho lógico escalado y sus trazos se ven nítidos.
- [X] Los trazos usan los colores de los tokens del tema (nave cian, asteroides magenta, balas amarillas, power-up verde) con glow.
- [X] `/juegos/serpentina/jugar` y el resto de juegos distintos de `rocas` siguen mostrando el placeholder y su puntuación simulada sin cambios.
- [X] El texto `long` de `rocas` ya no menciona OVNIs.
- [X] Ningún archivo bajo `app/` importa de `references/`.
- [X] `CLAUDE.md` documenta el registro de juegos jugables y el contrato `GameCanvasProps`.

---

## Decisiones

- **Sí:** reutilizar la entrada `rocas` del catálogo. Es el mismo concepto y conserva portada, id y rutas. **No:** crear una entrada nueva, que duplicaría el juego en la biblioteca.
- **Sí:** `GamePlayer` como marco que controla la pausa, el fin de partida y el HUD. **No:** que el canvas tenga su propia pausa o su propio HUD, porque cada juego futuro repetiría esa lógica.
- **Sí:** la pausa solo por el botón PAUSA/REANUDAR del marco (decisión del usuario). **No:** P/Esc ni auto-pausa al perder foco; se pueden añadir en otra spec sobre el mismo estado `paused`.
- **Sí:** registro de juegos jugables (`PLAYABLE_GAMES`) que mapea `id` a componente. **No:** reemplazar el placeholder para todos los juegos ni crear una ruta aparte solo para rocas.
- **Sí:** vectorial con neón de la plataforma (decisión del usuario): misma geometría y jugabilidad que el original, colores de los tokens y glow. **No:** blanco sobre negro idéntico al original.
- **Sí:** un único fin de partida, el modal de `GamePlayer` (decisión del usuario). **No:** conservar el overlay "GAME OVER" con reinicio por Espacio del original; son dos pantallas de fin para lo mismo.
- **Sí:** motor en TypeScript sin React (`createAsteroidsGame`) y un componente delgado que lo monta. Separa el bucle del ciclo de vida de React y permite destruirlo limpiamente. **No:** mover el estado del juego a `useState`, que re-renderizaría a 60 fps.
- **Sí:** callbacks de puntuación, vidas y nivel solo cuando cambian el valor. **No:** enviar a React cada frame; la cuenta atrás del power-up se dibuja en el canvas por esa razón.
- **Sí:** reiniciar con una `key` que remonta el componente. **No:** una función `reset()` expuesta al motor, que dejaría estado residual (balas, partículas, `justPressed`).
- **Sí:** escalado responsive con coordenadas lógicas 800×600 y `ResizeObserver` con `devicePixelRatio`. La lógica del juego no cambia con el tamaño. **No:** canvas de tamaño fijo, que se desbordaría en móvil, ni cambiar la lógica a coordenadas relativas.
- **Sí:** `preventDefault` de flechas y Espacio solo cuando el juego está activo y el foco no está en un campo editable. **No:** bloquearlas siempre, porque impediría escribir en el campo de iniciales y haría scroll imposible en el resto de la app.
- **Sí:** desenfocar el botón de pausa tras pulsarlo. Un botón enfocado se activa con Espacio y pausaría el juego al disparar. **No:** quitar el foco de forma global.
- **No:** controles táctiles ni sonido. Cada uno añade UI y assets propios y merece su spec.
- **Sí:** puntos del código del original (grande 20, mediano 50, pequeño 100), que coinciden con su README.

---

## Riesgos

| Riesgo                                                                                                       | Mitigación                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Doble montaje de `useEffect` en desarrollo (React Strict Mode) crea dos bucles y dos conjuntos de listeners. | `destroy()` cancela `requestAnimationFrame` y quita los listeners en la limpieza del efecto; criterio de aceptación sobre la velocidad tras reiniciar. |
| Espacio activa el botón de pausa enfocado o hace scroll.                                                     | Desenfocar el botón tras pulsarlo y `preventDefault` en `keydown` y `keyup` de Espacio mientras el juego está activo.                                  |
| `cacheComponents` y Next 16.4 más recientes que la documentación conocida.                                   | El paso 1 obliga a leer las guías; el canvas es un Client Component sin datos del servidor.                                                            |
| `getComputedStyle` de los tokens devuelve vacío si el CSS aún no cargó.                                      | Leer la paleta al montar el motor, con un valor de respaldo por color.                                                                                 |
| El canvas se redimensiona durante el juego y las coordenadas se desfasan.                                    | El escalado solo cambia la transformación del contexto; la lógica usa siempre 800×600.                                                                 |
| En móvil el juego no se puede controlar.                                                                     | Aceptado: los controles táctiles quedan fuera de esta spec.                                                                                            |
| `shadowBlur` en muchas entidades baja el rendimiento.                                                        | Aplicarlo por tipo de entidad, no por partícula, y comprobar visualmente que se mantiene fluido.                                                       |

---

## Lo que **no** entra en esta spec

- Pausa por teclado y auto-pausa por pérdida de foco.
- Controles táctiles, gamepad y sonido.
- OVNIs y mecánicas nuevas.
- Puntuaciones reales en Supabase, ranking compartido y estadísticas reales.
- Tetris, Arkanoid y cualquier otro juego.
- Cambios en el placeholder del resto de juegos.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
