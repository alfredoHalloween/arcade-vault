# To Do — Sugerencias de juegos (game-planner)

Lo mantiene el agente `game-planner`. Edita los estados a mano para darle feedback:
`[ ]` pendiente · `[~]` en curso (spec escrita) · `[x]` implementado · `~~tachado~~` + motivo = descartado.

## Pendientes

<!-- - [ ] **S-01 · TÍTULO** (`id`) — CATEGORÍA · esfuerzo M · 2026-11-10 ⭐ recomendado
  Concepto en una línea. Origen: placeholder `gloton`. Siguiente paso: `/nuevo-juego ...` -->

- [ ] **S-01 · INVADERS** (`invaders`) — SHOOTER · esfuerzo M · 2026-11-10 ⭐ recomendado
  Oleadas de aliens vectoriales en formación que bajan y aceleran; cañón con un disparo a la vez, 4 escudos destructibles, nave misteriosa de 150 fijos, 3 vidas, nivel = oleada. Origen: placeholder `invasores` (renombrar a `invaders`). Siguiente paso: `/nuevo-juego Shooter de oleadas de alienígenas "INVADERS" (id invaders, reemplaza el placeholder invasores), 3 vidas, oleadas como niveles, escudos destructibles, vectorial neón, solo teclado`
- [ ] **S-02 · HOPPER** (`hopper`) — ARCADE · esfuerzo M · 2026-11-10
  Rana de neón que cruza carriles de tráfico y un río de troncos hasta 5 nidos con tiempo límite; +10 por fila nueva, +50 por nido más el tiempo restante, 3 vidas. Origen: placeholder `ranaria` (renombrar a `hopper`). Siguiente paso: `/nuevo-juego Juego de cruzar carriles y río "HOPPER" (id hopper, reemplaza el placeholder ranaria), 3 vidas, temporizador por vida, vectorial neón, solo teclado`
- [ ] **S-03 · PADDLE DUEL** (`paddle-duel`) — VERSUS · esfuerzo S · 2026-11-10
  Duelo de paletas contra la CPU en modo un jugador: se puntúa por rallies y puntos ganados, y la CPU mejora por nivel. El modo de 2 jugadores no encaja con el ranking. Origen: placeholder `duelo-pixel`. Siguiente paso: `/nuevo-juego Duelo de paletas "PADDLE DUEL" contra CPU (id paddle-duel, reemplaza el placeholder duelo-pixel), sin modo 2 jugadores, vectorial neón, solo teclado`

### Acción / shooters (2026-11-10)

- [ ] **S-04 · CITY DEFENSE** (`city-defense`) — SHOOTER · esfuerzo M · 2026-11-10 ⭐ recomendado del grupo
  Defiendes 6 ciudades de misiles que caen: mira con flechas (ratón opcional) y antimisiles que estallan en círculos; bonus por ciudades vivas y munición sobrante, nivel = oleada. Siguiente paso: `/nuevo-juego Shooter de defensa antimisiles "CITY DEFENSE" (id city-defense), 6 ciudades, oleadas como niveles, mira con flechas y ratón opcional, vectorial neón, solo teclado`
- [ ] **S-05 · CHOMPER** (`chomper`) — ARCADE · esfuerzo L · 2026-11-10
  Laberinto de neón con 4 fantasmas y píldoras de poder (200/400/800/1600), 3 vidas, nivel = laberinto. Origen: placeholder `gloton` (renombrar a `chomper`). La IA de los fantasmas es lo difícil.
- [ ] **S-06 · CRAWLER** (`crawler`) — SHOOTER · esfuerzo M · 2026-11-10
  Un ciempiés de segmentos baja en zigzag entre setas; cada segmento abatido se vuelve seta y parte al ciempiés; araña de bonus, 3 vidas, nivel = oleada.
- [ ] **S-07 · NEON ARENA** (`neon-arena`) — SHOOTER · esfuerzo M · 2026-11-10
  Arena cerrada con oleadas sin fin de drones que persiguen: WASD para moverse y flechas para disparar en 8 direcciones; multiplicador de combo que se pierde al recibir daño, 3 vidas.
- [ ] **S-08 · CAVERN RUN** (`cavern-run`) — SHOOTER · esfuerzo L · 2026-11-10
  Shooter de scroll lateral por una caverna generada: dispara hacia delante, bombas hacia abajo, combustible que se recarga destruyendo depósitos, 3 vidas. Riesgo: generación del terreno y colisiones.

### Puzzle / lógica / estrategia (2026-11-10)

- [ ] **S-09 · TILE MERGE** (`tile-merge`) — PUZZLE · esfuerzo S · 2026-11-10 ⭐ recomendado del grupo
  Tablero 4×4 donde las flechas deslizan fichas y dos iguales se fusionan; puntuación = suma de fusiones, nivel = ficha máxima, sin vidas, fin sin movimientos. Siguiente paso: `/nuevo-juego Puzzle de fusionar fichas "TILE MERGE" (id tile-merge), tablero 4×4, flechas, puntuación = suma de fusiones, nivel = ficha máxima, sin vidas, game over sin movimientos, vectorial neón`
- [ ] **S-10 · NEON PAIRS** (`neon-pairs`) — PUZZLE · esfuerzo S · 2026-11-10
  Memoria de cartas con símbolos vectoriales contra el reloj; más cartas y menos tiempo por nivel, combo y bonus de tiempo. Riesgo: ocultar las cartas en pausa.
- [ ] **S-11 · COLOR FLOOD** (`color-flood`) — PUZZLE · esfuerzo S · 2026-11-10
  Cuadrícula de 6 colores: inundas desde la esquina con movimientos limitados; bonus por movimientos sobrantes, tableros generados, teclas 1–6 o cursor.
- [ ] **S-12 · MINE GRID** (`mine-grid`) — PUZZLE · esfuerzo M · 2026-11-10
  Buscaminas continuo: al despejar un tablero se pasa a otro con más minas, 3 vidas, cursor con flechas, Espacio revela y F marca. Riesgos: primer clic seguro, cascada y tableros que obligan a adivinar.
- [ ] **S-13 · CRATE PUSH** (`crate-push`) — PUZZLE · esfuerzo L · 2026-11-10
  Sokoban con tiempo global; base por nivel que baja con los movimientos, deshacer/reiniciar. Riesgo: hay que diseñar 10–20 niveles propios (sin copiar los clásicos).

### Deportes / carreras / arcade clásico (2026-11-10)

Requiere añadir las categorías `RACING` y/o `SPORTS` a `CATEGORIES` (`app/data/types.ts`, `app/data/games.ts`) en la spec del primer juego que las use.

- [ ] **S-14 · NEON RACER** (`neon-racer`) — RACING · esfuerzo S-M · 2026-11-10 ⭐ recomendado del grupo
  Carrera sin fin vista desde arriba esquivando tráfico que acelera; puntos por distancia y bonus por adelantar rozando, 3 vidas, nivel por tramos. Siguiente paso: `/nuevo-juego Carrera sin fin vista desde arriba "NEON RACER" (id neon-racer, nueva categoría RACING), 3 vidas, nivel por distancia, bonus por adelantamiento al límite, vectorial neón, solo teclado`
- [ ] **S-15 · NIGHT RUNNER** (`night-runner`) — ARCADE · esfuerzo S · 2026-11-10
  Corredor sin fin de scroll lateral: saltar y agacharse, orbes de bonus, una vida (HUD `—`), nivel por velocidad.
- [ ] **S-16 · HOOP SHOT** (`hoop-shot`) — SPORTS · esfuerzo M · 2026-11-10
  Tiro a canasta con medidor oscilante de ángulo y fuerza, 60 s, aro que se mueve más por nivel, multiplicador por aciertos seguidos. Riesgo: física pelota/aro.
- [ ] **S-17 · GOALKEEPER** (`goalkeeper`) — SPORTS · esfuerzo S · 2026-11-10
  Portero que para disparos cada vez más rápidos; 3 goles = 3 vidas, multiplicador por paradas seguidas, sin IA rival.
- [ ] **S-18 · LANDER** (`lander`) — ARCADE · esfuerzo M · 2026-11-10
  Aterrizaje lunar con rotación, empuje y combustible limitado; plataformas estrechas multiplican, combustible sobrante suma. Riesgo: afinar tolerancias de aterrizaje.

### Casuales / supervivencia / plataformas (2026-11-10)

Conviene añadir categorías `CASUAL`, `SURVIVAL` y/o `PLATFORM` (al menos una) para dar variedad; si no, quedarían casi todos en ARCADE.

- [ ] **S-19 · FLAPWING** (`flapwing`) — CASUAL · esfuerzo S · 2026-11-10 ⭐ recomendado del grupo
  Pájaro de neón que aletea con Espacio entre columnas; +10 por puerta, nivel cada 10, una vida (HUD `—`). Siguiente paso: `/nuevo-juego Juego casual de aleteo entre columnas "FLAPWING" (id flapwing, nuevo), 1 vida, +10 por puerta, nivel cada 10 puertas, vectorial neón, solo teclado (Espacio)`
- [ ] **S-20 · SKYCLIMB** (`skyclimb`) — PLATFORM · esfuerzo M · 2026-11-10
  Plataformas verticales con salto automático, ← →, plataformas fijas/móviles/frágiles, muelles; puntuación = altura. Riesgo: física y generador siempre alcanzable.
- [ ] **S-21 · KEYSTORM** (`keystorm`) — CASUAL · esfuerzo M · 2026-11-10
  Palabras que caen y se destruyen tecleándolas; letras × nivel con multiplicador de racha, 3 vidas. Riesgos: respetar el filtro de `input`, palabras sin tildes/ñ, política de idioma.
- [ ] **S-22 · GRID STRIKE** (`grid-strike`) — CASUAL · esfuerzo S · 2026-11-10
  Whack-a-mole de neón en rejilla 3×3 (Q W E / A S D / Z X C, ratón opcional), objetivos trampa magenta, 3 vidas, menos tiempo por nivel. Puede sustituirlo un tower defense mini (descartado por ahora: complejidad alta).
- [ ] **S-23 · PULSE RING** (`pulse-ring`) — SURVIVAL · esfuerzo M · 2026-11-10
  Nave que gira alrededor de un núcleo con ← → mientras anillos con huecos se cierran; +1 por 100 ms y +25 por anillo, una vida, nivel cada 30 s. Riesgo: colisiones polares y patrones justos.

## En curso

## Hechos

## Descartados
