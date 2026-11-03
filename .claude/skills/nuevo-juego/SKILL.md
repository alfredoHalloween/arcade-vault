---
name: nuevo-juego
description: Genera la spec para portar un juego (p. ej. de references/started-games/) a Arcade Vault con canvas real, registro en PLAYABLE_GAMES, fila en `games` y leaderboard. Solo escribe la spec, no código.
disable-model-invocation: true
argument-hint: "carpeta de references/started-games o descripción del juego"
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(grep:*)
---

# /nuevo-juego — Spec para integrar un juego con leaderboard

## Contexto de sesión

Fecha de hoy (úsala en la cabecera de la spec, nunca la adivines):
!`date +%F`

Specs existentes:
!`ls specs/ 2>/dev/null || echo "No existe la carpeta specs/"`

Juegos de referencia disponibles:
!`ls references/started-games/ 2>/dev/null`

Juegos jugables ya registrados:
!`cat app/_components/games/registry.ts`

Ids del catálogo local:
!`grep -n '^    id:' app/data/games.ts`

---

Esta skill convierte un juego (normalmente JavaScript plano de `references/started-games/`) en **una spec** que sigue el patrón de las specs 05 (juego + contrato), 06 (leaderboard) y 07 (biblioteca). **No escribes código, migraciones ni tocas `app/`**: tu único entregable es `specs/NN-….md`. Se implementa después con `/spec-impl`.

Las respuestas deben ir en español, igual que las specs existentes.

## Fase 1 — Entender el contexto

1. Lee `CLAUDE.md`, `checklist.md` (en esta carpeta) y `.agents/skills/spec/template.md` (forma de la spec).
2. Lee `specs/05-juego-rocas-asteroides.md`, `specs/06-leaderboard-y-tabla-games.md` y `specs/07-biblioteca-juegos-en-base-de-datos.md`: son el modelo de estilo, idioma, estados (`Borrador`, `Implementado`…) y rigor de los criterios.
3. Lee `app/_components/games/types.ts`, `registry.ts` y `app/_components/games/asteroids/asteroids-canvas.tsx` para ver el estado real del contrato (puede haber cambiado desde las specs).
4. Si `$ARGUMENTS` apunta a una carpeta de `references/started-games/`, léela: `CLAUDE.md`, `README.md`, `game.js` y los extras (`levels.js`, `assets/`, `specs/`, `style.css`). Si es solo una descripción, pregunta de dónde sale el código. Si va vacío, pregunta qué juego.
5. Haz un **inventario** del original antes de preguntar: reglas, puntuación, vidas, niveles, controles, resolución lógica, assets (imágenes, sonidos), y qué HUD, pausa y pantalla de game over trae por su cuenta (todo eso lo sustituye `GamePlayer`).

Si el usuario pide más de un juego, genera una spec por juego, empezando por el primero.

## Fase 2 — Preguntar

Usa `AskUserQuestion` en bloques de 3 a 4 preguntas, con tu recomendación primero. No preguntes lo que ya responden el inventario o las specs 05–07. Banco de preguntas (elige las que apliquen):

- **Entrada del catálogo.** ¿Reutiliza una existente en `app/data/games.ts` (mapea por concepto: Tetris → `caida`, Arkanoid → `bloque-buster`) o crea una nueva (título, cat, cover, color)? Ajustar `long`/`short` para no prometer mecánicas que no existen.
- **Estilo.** Neón vectorial con tokens del tema (`--cyan`, `--magenta`, `--yellow`, `--green`) o sprites originales.
- **Vidas y nivel.** ¿Qué reporta el juego? Si no tiene vidas o niveles, aplica el contrato opcional (ver `checklist.md`).
- **Resolución y proporción.** Coordenadas lógicas, si cabe en el marco 4:3 de `crt-screen`, y qué se dibuja en el canvas (p. ej. la pieza siguiente) frente al HUD de React.
- **Controles.** Teclas, cuáles se bloquean con `preventDefault`, repetición de tecla.
- **Assets y sonido.** Copiar a `public/games/<id>/` o prescindir de ellos; el sonido debe respetar la pausa.
- **Mecánicas recortadas.** Qué del original se queda fuera (y va a "no entra").

Detente cuando puedas responder sin asumir: qué archivos cambian, cuál es el primer y el último paso, y cómo se verifica. Si algo abre otra spec (táctil, RLS, Auth), proponlo como fuera de alcance.

## Fase 3 — Escribir la spec

**Antes de crear el archivo, lee la skill `/spec`**: `.agents/skills/spec/SKILL.md` completo (Fases 3 y 4, reglas duras, formato de cabecera y estados) y `.agents/skills/spec/template.md`. Léelos con `Read` aunque ya los hayas visto en la Fase 1: no están invocables como skill (`disable-model-invocation`), así que se leen como archivos. Sus reglas de redacción y guardado mandan sobre lo que aquí no se especifique; si algo choca con esta skill, gana esta (p. ej. aquí no se pregunta por secciones ni se propone `/spec-impl` más allá del aviso final). Si el archivo no existe, avisa al usuario y sigue con `template.md` de las specs 05–07 como modelo.

Con la Fase 2 cerrada, escribe la spec completa sin pedir confirmación por secciones. Estructura (igual que 05–07): cabecera en blockquote (`Estado`, `Depende de`, `Fecha`, `Objetivo` en **una** frase), _Por qué existe_, _Alcance_ (dentro / fuera), _Modelo de datos_, _Plan de implementación_ (pasos que dejan la app ejecutable, cada uno con su verificación), _Criterios de aceptación_ (checklist booleana), _Decisiones_ (Sí/No con justificación), _Riesgos_ y _Lo que no entra_.

Rellena el contenido a partir de `checklist.md` (archivos, registro, migración de `games`, criterios base, decisiones y riesgos base) y adáptalo al juego: reglas, puntos y controles concretos del original en los criterios. Los criterios deben ser verificables, no aspiracionales.

## Fase 4 — Guardar

1. Número: el mayor de `specs/` + 1, con dos dígitos. Slug: `NN-juego-<id>-<slug-corto>.md`.
2. Fecha: la del contexto de sesión. Estado: `Borrador`.
3. `Depende de`: SPEC 05, 06 y 07 (comprueba que existen en `specs/`) más cualquier otra spec de juego que cambie el contrato (p. ej. la que haga opcionales `onLives`/`onLevel`).
4. Escribe el archivo sin pedir permiso (pregunta solo si ya existe).
5. Confirma: ruta creada, que está en `Borrador` y que el siguiente paso es revisarla y ejecutar `/spec-impl NN-slug`. **Para ahí.**

## Reglas duras

- Nunca crees el archivo de la spec sin haber leído antes `.agents/skills/spec/SKILL.md` y `template.md` en esta ejecución.
- Nunca escribas código, migraciones ni edites `app/`, `lib/` o `CLAUDE.md`: solo el `.md` de la spec.
- Nunca propongas implementar la spec tras guardarla.
- La spec debe prohibir importar de `references/` (se porta, no se enlaza) y no sembrar juegos placeholder en `games`.
- Un juego por spec.
- No asumas decisiones que el usuario no confirmó.
