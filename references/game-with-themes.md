# Juegos con skins (clásico · neon · retro)

Lista de control del subagente `skin-designer`. Tú decides qué juego recibe skins:
añade una línea en **Pendientes** con `- [ ] \`<id>\``. El agente procesa **uno por ejecución**
y solo juegos de esta lista; al terminar lo mueve a **Con skins** con `[x]`, fecha y resumen.

Ids jugables: `rocas`, `tetris`, `arkanoid`, `snake`.

## Infraestructura

- [x] Sistema de skins (`skins.ts`, `use-skin.ts`, prop `skin`, selector en `GamePlayer`)

## Pendientes

<!-- - [ ] `snake` -->

## Con skins

- [x] `rocas` — 2026-11-10 · neon: nave magenta, asteroides cian y balas verdes con glow intenso, trazo fino con núcleo blanco y rejilla tenue sobre `--bg` · retro: fósforo verde de 4 tonos sin glow, render a 1/3 de resolución cuantizado y reescalado sin suavizado, balas y partículas cuadradas, power-up como caja con 3 píxeles y barrido CRT
- [x] `arkanoid` — 2026-11-10 · neon: bloques como contornos finos con glow intenso, relleno tenue y núcleo blanco, paleta magenta con línea cian, pelota como aro amarillo con núcleo blanco y rejilla tenue sobre `--bg` · retro: 4 colores CGA (negro, cian, magenta, blanco) sin glow, todo ajustado a rejilla de 4 px, ladrillos con bisel y remache cuadrados, pelota pixelada y scanlines CRT
- [x] `snake` — 2026-11-10 · neon: serpiente como trazo continuo verde con glow y núcleo blanco, cabeza como cuadrado magenta trazado, fruta como rombo amarillo que late (sin sprite) y rejilla magenta tenue sobre `--bg` · retro: LCD verde de 4 tonos fijos sin glow, segmentos de bloques 6×6 píxeles con hueco central, cabeza maciza con ojos según la dirección, fruta pixel-art 8×8, rejilla de puntos y scanlines

<!-- - [x] `snake` — 2026-11-10 · neon: … · retro: … -->
