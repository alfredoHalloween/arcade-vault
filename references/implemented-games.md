# Juegos de Arcade Vault

Juegos disponibles actualmente en la base de datos (tabla `games` de Supabase), ordenados por fecha de alta. Los textos y categorías vienen del catálogo local (`app/data/games.ts`).

**Total: 4 juegos jugables, cada uno con su propio ranking.**

| #   | ID         | Título   | Categoría | Ruta de juego            | Alta en BD | Spec |
| --- | ---------- | -------- | --------- | ------------------------ | ---------- | ---- |
| 1   | `rocas`    | ROCAS    | SHOOTER   | `/juegos/rocas/jugar`    | 2026-10-28 | 05   |
| 2   | `tetris`   | TETRIS   | PUZZLE    | `/juegos/tetris/jugar`   | 2026-11-03 | 08   |
| 3   | `arkanoid` | ARKANOID | ARCADE    | `/juegos/arkanoid/jugar` | 2026-11-03 | 09   |
| 4   | `snake`    | SNAKE    | ARCADE    | `/juegos/snake/jugar`    | 2026-11-05 | 10   |

## Detalle

### ROCAS (`rocas`)

- **Categoría:** SHOOTER
- **Resumen:** Pulveriza asteroides en gravedad cero.
- **Descripción:** Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Recoge el power-up de disparo triple y sobrevive nivel tras nivel.
- **Controles:** teclado (flechas y espacio para disparar).

### TETRIS (`tetris`)

- **Categoría:** PUZZLE
- **Resumen:** Encaja las piezas antes de que el techo te aplaste.
- **Descripción:** Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.
- **Controles:** teclado (← → ↓, ↑/X para rotar, espacio para caída rápida).

### ARKANOID (`arkanoid`)

- **Categoría:** ARCADE
- **Resumen:** Rebota la pelota y destruye muros de neón.
- **Descripción:** Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles.
- **Controles:** teclado (← →) o ratón sobre el canvas. 5 niveles y 3 vidas.

### SNAKE (`snake`)

- **Categoría:** ARCADE
- **Resumen:** Come frutas, crece y no te choques.
- **Descripción:** Una serpiente de luz recorre la grilla buscando frutas. Cada bocado la alarga y, cada pocas frutas, sube el nivel y acelera. Un choque contra el muro o contra tu propio cuerpo y se acabó.
- **Controles:** flechas o WASD.

## Ranking actual (BD)

| Juego    | Partidas guardadas | Mejor puntuación |
| -------- | ------------------ | ---------------- |
| ROCAS    | 1                  | 3,360            |
| TETRIS   | 1                  | 1,698            |
| ARKANOID | 1                  | 530              |
| SNAKE    | 1                  | 140              |

## Notas

- El catálogo local incluye además juegos _placeholder_ (`gloton`, `invasores`, `ranaria`, `duelo-pixel`) que **no** están en la BD, por lo que no aparecen en `/biblioteca` ni tienen ranking.
- Consulta realizada a la base de datos el 2026-11-10.
