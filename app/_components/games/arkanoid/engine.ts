import type { GameCanvasProps } from "../types";
import { createSfx } from "./audio";
import {
  FALLBACK_COLORS,
  H,
  INITIAL_LIVES,
  MAX_DT,
  MAX_SCORE,
  POINTS_PER_BLOCK,
  THEME_TOKENS,
  W,
  type BlockColor,
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
type Palette = Record<BlockColor, string>;
/** Colores del tema leídos de los tokens CSS al montar; hex de respaldo si faltan. */
function readPalette(): Palette {
  const root = getComputedStyle(document.documentElement);
  const palette = { ...FALLBACK_COLORS };
  for (const [color, token] of Object.entries(THEME_TOKENS)) {
    const value = root.getPropertyValue(token).trim();
    if (value) palette[color as BlockColor] = value;
  }
  return palette;
}
export function createArkanoidGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void } {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const palette = readPalette();
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
  function draw() {
    const c = ctx!;
    c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    c.clearRect(0, 0, W, H);
    for (const block of blocks) {
      if (!block.alive) continue;
      const color = palette[block.color];
      c.globalAlpha = 0.9;
      glowRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2, color, 8);
      c.shadowBlur = 0;
      c.fillStyle = "rgba(255,255,255,0.22)";
      c.fillRect(block.x + 1, block.y + 1, block.w - 2, 4);
    }
    c.globalAlpha = 1;
    glowRect(paddle.x, paddle.y, paddle.w, paddle.h, palette.cyan, 12);
    glowRect(ball.x, ball.y, ball.w, ball.h, palette.yellow, 14);
    c.shadowBlur = 0;
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
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.destroy();
      sfx.destroy();
    },
  };
}
