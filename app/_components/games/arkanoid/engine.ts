import { DEFAULT_SKIN, type SkinId } from "../skins";
import type { GameCanvasProps } from "../types";
import { createSfx } from "./audio";
import {
  H,
  INITIAL_LIVES,
  MAX_DT,
  MAX_SCORE,
  PALETTES,
  PIXEL_GRID,
  POINTS_PER_BLOCK,
  W,
  type BlockColor,
  type Palette,
  type SkinColor,
} from "./constants";
import {
  buildBlocks,
  createPaddle,
  movePaddle,
  placeBall,
  setPaddleCenter,
  stepBall,
  type Block,
} from "./entities";
import { createInput } from "./input";
import { LEVELS } from "./levels";

/** Paleta de una skin con los colores ya resueltos a cadenas CSS. */
type Look = {
  style: Palette["style"];
  bg: string | null;
  grid: string | null;
  blocks: Record<BlockColor, string>;
  paddle: string;
  paddleAccent: string;
  ball: string;
  detail: string;
  glow: Palette["glow"];
};

/** Resuelve las paletas de todas las skins una vez (tokens del tema con hex de respaldo). */
function readLooks(): Record<SkinId, Look> {
  const root = getComputedStyle(document.documentElement);
  const color = (c: SkinColor) =>
    (c.token && root.getPropertyValue(c.token).trim()) || c.hex;
  const looks = {} as Record<SkinId, Look>;
  for (const id of Object.keys(PALETTES) as SkinId[]) {
    const p = PALETTES[id];
    const blocks = {} as Record<BlockColor, string>;
    for (const key of Object.keys(p.blocks) as BlockColor[]) {
      blocks[key] = color(p.blocks[key]);
    }
    looks[id] = {
      style: p.style,
      bg: p.bg && color(p.bg),
      grid: p.grid && color(p.grid),
      blocks,
      paddle: color(p.paddle),
      paddleAccent: color(p.paddleAccent),
      ball: color(p.ball),
      detail: color(p.detail),
      glow: p.glow,
    };
  }
  return looks;
}

/** Ajusta una coordenada a la rejilla de la skin `pixel` (solo render). */
function snap(v: number): number {
  return Math.round(v / PIXEL_GRID) * PIXEL_GRID;
}

export function createArkanoidGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused" | "skin">,
  initialSkin: SkinId = DEFAULT_SKIN,
): {
  setPaused(paused: boolean): void;
  setSkin(skin: SkinId): void;
  destroy(): void;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const looks = readLooks();
  let skin = initialSkin;
  const sfx = createSfx();
  let paused = false;
  let destroyed = false;
  let gameOver = false;
  let rafId = 0;
  let lastTime: number | null = null;
  let score = 0;
  let lives = INITIAL_LIVES;
  let levelIndex = 0;
  const paddle = createPaddle();
  let blocks: Block[] = buildBlocks(LEVELS[levelIndex]);
  let ball = placeBall(paddle, LEVELS[levelIndex]);
  const input = createInput(canvas, (x) => {
    if (!paused && !gameOver) setPaddleCenter(paddle, x);
  });
  // Los callbacks solo se llaman cuando el valor cambia.
  const emitted = { score: NaN, lives: NaN, level: NaN };
  function emit() {
    const shown = Math.min(score, MAX_SCORE);
    if (emitted.score !== shown) {
      emitted.score = shown;
      callbacks.onScore(shown);
    }
    if (emitted.lives !== lives) {
      emitted.lives = lives;
      callbacks.onLives?.(lives);
    }
    const level = levelIndex + 1;
    if (emitted.level !== level) {
      emitted.level = level;
      callbacks.onLevel(level);
    }
  }
  function endGame() {
    gameOver = true;
    input.setActive(false);
    emit();
    callbacks.onGameOver(Math.min(score, MAX_SCORE));
  }
  function update(dt: number) {
    movePaddle(paddle, input.getAxis(), dt);
    const result = stepBall(ball, paddle, blocks, dt);
    if (result.bounced) sfx.bounce();
    if (result.broken) {
      sfx.breakBlock();
      score += POINTS_PER_BLOCK;
      if (blocks.every((b) => !b.alive)) {
        if (levelIndex < LEVELS.length - 1) {
          levelIndex++;
          blocks = buildBlocks(LEVELS[levelIndex]);
          ball = placeBall(paddle, LEVELS[levelIndex]);
        } else {
          endGame();
        }
        emit();
        return;
      }
    }
    if (result.lost) {
      lives--;
      if (lives <= 0) {
        lives = 0;
        endGame();
      } else {
        ball = placeBall(paddle, LEVELS[levelIndex]);
      }
    }
    emit();
  }
  function glowRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    blur: number,
  ) {
    const c = ctx!;
    c.shadowColor = color;
    c.shadowBlur = blur;
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }
  // CLÁSICO: render original exacto (bloques rellenos con glow sobre fondo transparente).
  function drawGlow(look: Look) {
    const c = ctx!;
    for (const block of blocks) {
      if (!block.alive) continue;
      const color = look.blocks[block.color];
      c.globalAlpha = 0.9;
      glowRect(
        block.x + 1,
        block.y + 1,
        block.w - 2,
        block.h - 2,
        color,
        look.glow.block,
      );
      c.shadowBlur = 0;
      c.fillStyle = look.detail;
      c.fillRect(block.x + 1, block.y + 1, block.w - 2, 4);
    }
    c.globalAlpha = 1;
    glowRect(
      paddle.x,
      paddle.y,
      paddle.w,
      paddle.h,
      look.paddle,
      look.glow.paddle,
    );
    glowRect(ball.x, ball.y, ball.w, ball.h, look.ball, look.glow.ball);
  }

  // NEON: contornos finos con glow intenso, núcleo claro y rejilla tenue.
  function drawOutline(look: Look) {
    const c = ctx!;
    if (look.grid) {
      c.globalAlpha = 0.07;
      c.strokeStyle = look.grid;
      c.lineWidth = 1;
      c.beginPath();
      for (let x = 0; x <= W; x += 40) {
        c.moveTo(x + 0.5, 0);
        c.lineTo(x + 0.5, H);
      }
      for (let y = 0; y <= H; y += 40) {
        c.moveTo(0, y + 0.5);
        c.lineTo(W, y + 0.5);
      }
      c.stroke();
      c.globalAlpha = 1;
    }
    for (const block of blocks) {
      if (!block.alive) continue;
      const color = look.blocks[block.color];
      const x = block.x + 3;
      const y = block.y + 3;
      const w = block.w - 6;
      const h = block.h - 6;
      c.shadowBlur = 0;
      c.globalAlpha = 0.14;
      c.fillStyle = color;
      c.fillRect(x, y, w, h);
      c.globalAlpha = 1;
      c.shadowColor = color;
      c.shadowBlur = look.glow.block;
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.strokeRect(x, y, w, h);
      c.shadowBlur = 0;
      c.globalAlpha = 0.45;
      c.strokeStyle = look.detail;
      c.lineWidth = 0.5;
      c.strokeRect(x, y, w, h);
      c.globalAlpha = 1;
    }
    // Paleta: contorno con glow y línea central de acento.
    c.shadowColor = look.paddle;
    c.shadowBlur = look.glow.paddle;
    c.strokeStyle = look.paddle;
    c.lineWidth = 2;
    c.strokeRect(paddle.x + 1, paddle.y + 1, paddle.w - 2, paddle.h - 2);
    c.shadowColor = look.paddleAccent;
    c.strokeStyle = look.paddleAccent;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(paddle.x + 8, paddle.y + paddle.h / 2);
    c.lineTo(paddle.x + paddle.w - 8, paddle.y + paddle.h / 2);
    c.stroke();
    // Pelota: aro brillante con núcleo blanco (la hitbox sigue siendo el cuadrado).
    const cx = ball.x + ball.w / 2;
    const cy = ball.y + ball.h / 2;
    c.shadowColor = look.ball;
    c.shadowBlur = look.glow.ball;
    c.strokeStyle = look.ball;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, cy, ball.w / 2 - 1, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = look.detail;
    c.beginPath();
    c.arc(cx, cy, 3, 0, Math.PI * 2);
    c.fill();
  }

  // RETRO: 4 colores CGA en rejilla de PIXEL_GRID px, sin glow, con scanlines.
  function drawPixel(look: Look) {
    const c = ctx!;
    const g = PIXEL_GRID;
    for (const block of blocks) {
      if (!block.alive) continue;
      const x = snap(block.x);
      const y = snap(block.y);
      const w = snap(block.w) - g;
      const h = snap(block.h) - g;
      c.fillStyle = look.blocks[block.color];
      c.fillRect(x, y, w, h);
      // Bisel cuadrado: sombra de un "píxel" abajo y a la derecha, remache central.
      c.fillStyle = look.detail;
      c.fillRect(x + g, y + h - g, w - g, g);
      c.fillRect(x + w - g, y + g, g, h - g);
      c.fillRect(x + w / 2 - g, y + g * 2, g * 2, g);
    }
    // Paleta: cuerpo blanco con extremos de acento.
    const px = snap(paddle.x);
    const py = snap(paddle.y);
    const pw = snap(paddle.w);
    const ph = snap(paddle.h);
    c.fillStyle = look.paddle;
    c.fillRect(px, py, pw, ph);
    c.fillStyle = look.paddleAccent;
    c.fillRect(px, py, g * 3, ph);
    c.fillRect(px + pw - g * 3, py, g * 3, ph);
    // Pelota: "círculo" pixelado (cuadrado con esquinas recortadas).
    const bx = snap(ball.x);
    const by = snap(ball.y);
    const bs = snap(ball.w);
    c.fillStyle = look.ball;
    c.fillRect(bx + g, by, bs - g * 2, bs);
    c.fillRect(bx, by + g, bs, bs - g * 2);
    // Scanlines CRT.
    c.globalAlpha = 0.22;
    c.fillStyle = "#000000";
    for (let y = 0; y < H; y += g) c.fillRect(0, y, W, g / 2);
    c.globalAlpha = 1;
  }

  function draw() {
    const c = ctx!;
    const look = looks[skin];
    c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    c.clearRect(0, 0, W, H);
    if (look.bg) {
      c.fillStyle = look.bg;
      c.fillRect(0, 0, W, H);
    }
    if (look.style === "outline") drawOutline(look);
    else if (look.style === "pixel") drawPixel(look);
    else drawGlow(look);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  }

  function loop(ts: number) {
    if (destroyed) return;
    if (!paused && !gameOver) {
      const dt =
        lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
      update(dt);
    }
    lastTime = ts;
    draw();
    rafId = requestAnimationFrame(loop);
  }
  emit();
  rafId = requestAnimationFrame(loop);
  return {
    setPaused(next: boolean) {
      paused = next;
      // Al reanudar (o pausar) se descarta el tiempo transcurrido: sin saltos.
      lastTime = null;
      input.setActive(!paused && !gameOver);
      if (paused) sfx.pause();
    },
    // Solo cambia el render: el estado de la partida no se toca.
    setSkin(next: SkinId) {
      skin = next;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.destroy();
      sfx.destroy();
    },
  };
}
