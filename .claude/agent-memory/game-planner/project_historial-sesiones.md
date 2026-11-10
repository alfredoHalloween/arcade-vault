---
name: historial-sesiones
description: Resumen de cada sesión del game-planner (qué se propuso, qué se recomendó y por qué)
metadata:
  type: project
---

## 2026-11-10: primera sesión

- Estado: 4 jugables (rocas SHOOTER, tetris PUZZLE, arkanoid ARCADE, snake ARCADE). `references/started-games/` agotado (los 3 ya están portados). Placeholders: gloton, invasores, ranaria, duelo-pixel.
- Propuestos: S-01 INVADERS (`invaders`, SHOOTER, M) ⭐, S-02 HOPPER (`hopper`, ARCADE, M), S-03 PADDLE DUEL (`paddle-duel`, VERSUS, S).
- Recomendado INVADERS: mejor encaje con el contrato y el ranking, equilibra SHOOTER frente a ARCADE (que ya tiene 2), es 100 % vectorial y sin assets.
- Aparcado: gloton (esfuerzo L por la IA de fantasmas). PADDLE DUEL tiene un ranking débil (depende de la CPU) y su modo 2J no encaja.

**Why:** registro para no repetir propuestas y ver la evolución de las preferencias.
**How to apply:** compara con el To Do y con `registry.ts` en la siguiente sesión. Si INVADERS ya está registrado, la siguiente prioridad de variedad es VERSUS o un PUZZLE nuevo. Ver [[nombres-en-ingles]].

## 2026-11-10: segunda sesión (20 propuestas en paralelo, 4 instancias)

- Pedido del usuario: 20 juegos con nombre en inglés, lanzados en 4 agentes en paralelo por categoría. Registrados en el To Do como S-04 a S-23.
- Acción/shooters: S-04 CITY DEFENSE ⭐, S-05 CHOMPER (placeholder `gloton`), S-06 CRAWLER, S-07 NEON ARENA, S-08 CAVERN RUN.
- Puzzle/lógica: S-09 TILE MERGE ⭐, S-10 NEON PAIRS, S-11 COLOR FLOOD, S-12 MINE GRID, S-13 CRATE PUSH.
- Deportes/carreras: S-14 NEON RACER ⭐, S-15 NIGHT RUNNER, S-16 HOOP SHOT, S-17 GOALKEEPER, S-18 LANDER.
- Casuales/supervivencia: S-19 FLAPWING ⭐, S-20 SKYCLIMB, S-21 KEYSTORM, S-22 GRID STRIKE, S-23 PULSE RING.
- Recomendación global: TILE MERGE, FLAPWING y NEON RACER (menor esfuerzo, mejor ranking, NEON RACER estrena categoría).
- Decisión pendiente: añadir categorías `RACING`, `SPORTS`, `CASUAL`, `SURVIVAL`, `PLATFORM` (hoy solo ARCADE, PUZZLE, SHOOTER, VERSUS); va en la spec del primer juego que las necesite.
- Descartado: tower defense mini (complejidad alta, colocar torres solo con teclado es incómodo); clones de Pong/Breakout (ya cubiertos por PADDLE DUEL y arkanoid).

**Why:** no repetir estas 20 en futuras sesiones y recordar las recomendaciones.
**How to apply:** en la siguiente sesión, mira qué S-xx se implementaron (`registry.ts`) y no vuelvas a proponer los pendientes; sugiere elegir entre los ⭐.
