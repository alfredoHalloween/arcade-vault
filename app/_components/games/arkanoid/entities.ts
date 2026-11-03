import {
  BALL_SIZE,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  BLOCK_H,
  BLOCK_W,
  H,
  PADDLE_BOUNCE_MARGIN,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_Y,
  W,
  type BlockColor,
} from "./constants";
import type { Level } from "./levels";
export type Paddle = { x: number; y: number; w: number; h: number };
export type Ball = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
};
export type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
};
/** Qué ocurrió en un paso de la pelota (sin efectos fuera de `ball` y del bloque roto). */
export type StepResult = {
  /** Rebote en pared o paleta (suena `ball-bounce`). */
  bounced: boolean;
  /** Bloque destruido en este paso, si lo hubo (suena `break-sound`). */
  broken: Block | null;
  /** La pelota salió por debajo del campo. */
  lost: boolean;
};
export function createPaddle(): Paddle {
  return {
    x: (W - PADDLE_W) / 2,
    y: PADDLE_Y,
    w: PADDLE_W,
    h: PADDLE_H,
  };
}
export function buildBlocks(level: Level): Block[] {
  return level.blocks.map((b) => ({
    x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: b.color,
    alive: true,
  }));
}
/** Pelota pegada al centro de la paleta y lanzada con la velocidad del nivel. */
export function placeBall(paddle: Paddle, level: Level): Ball {
  return {
    x: paddle.x + (paddle.w - BALL_SIZE) / 2,
    y: paddle.y - BALL_SIZE,
    w: BALL_SIZE,
    h: BALL_SIZE,
    vx: BASE_BALL_VX * level.speed,
    vy: BASE_BALL_VY * level.speed,
  };
}
/** `dir`: −1 izquierda, 0 quieta, 1 derecha. */
export function movePaddle(paddle: Paddle, dir: -1 | 0 | 1, dt: number) {
  paddle.x = clampPaddle(paddle, paddle.x + dir * PADDLE_SPEED * dt);
}
/** Centra la paleta en `centerX` (coordenadas lógicas), dentro del campo. */
export function setPaddleCenter(paddle: Paddle, centerX: number) {
  paddle.x = clampPaddle(paddle, centerX - paddle.w / 2);
}
function clampPaddle(paddle: Paddle, x: number) {
  return Math.max(0, Math.min(W - paddle.w, x));
}
export function collideAABB(ball: Ball, block: Block) {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  );
}
/**
 * Avanza la pelota `dt` segundos con las reglas del original: rebote en
 * paredes y techo, rebote en la paleta (fija `vy` hacia arriba sin tocar `vx`)
 * y como máximo un bloque destruido por paso (solo se invierte `vy`).
 * Muta `ball` y el bloque destruido.
 */
export function stepBall(
  ball: Ball,
  paddle: Paddle,
  blocks: Block[],
  dt: number,
): StepResult {
  let bounced = false;
  let broken: Block | null = null;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    bounced = true;
  }
  if (ball.x + ball.w >= W) {
    ball.x = W - ball.w;
    ball.vx = -Math.abs(ball.vx);
    bounced = true;
  }
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    bounced = true;
  }
  if (
    ball.vy > 0 &&
    ball.x + ball.w > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.h >= paddle.y &&
    ball.y + ball.h <= paddle.y + paddle.h + PADDLE_BOUNCE_MARGIN
  ) {
    ball.y = paddle.y - ball.h;
    ball.vy = -Math.abs(ball.vy);
    bounced = true;
  }
  for (const block of blocks) {
    if (!block.alive) continue;
    if (collideAABB(ball, block)) {
      block.alive = false;
      ball.vy = -ball.vy;
      broken = block;
      break;
    }
  }
  return { bounced, broken, lost: ball.y > H };
}
