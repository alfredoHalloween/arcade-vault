/** Coordenadas lógicas del juego (el canvas escala con setTransform). */
export const W = 800;
export const H = 600;
export const PADDLE_SPEED = 400;
export const PADDLE_W = 81;
export const PADDLE_H = 14;
export const PADDLE_Y = 560;
export const BALL_SIZE = 16;
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;
export const BLOCK_COLS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_W = 64;
export const BLOCK_H = 24;
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
export const BLOCKS_ORIGIN_Y = 80;
export const INITIAL_LIVES = 3;
export const POINTS_PER_BLOCK = 10;
/** Tope de `scores.score` (SPEC 06). */
export const MAX_SCORE = 9_999_999;
/** Límite del paso de tiempo (s) para que la pelota no atraviese bloques. */
export const MAX_DT = 0.05;
/** Margen bajo la paleta en el que aún cuenta el rebote (px). */
export const PADDLE_BOUNCE_MARGIN = 8;
export type BlockColor =
  "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";
/** Hex de respaldo; los cuatro con token del tema se sustituyen al montar. */
export const FALLBACK_COLORS: Record<BlockColor, string> = {
  red: "#ff4d4d",
  yellow: "#f5ff00",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  hotpink: "#ff69b4",
  green: "#00ff88",
  gray: "#8a8fa3",
};
/** Colores que se leen de los tokens CSS del tema. */
export const THEME_TOKENS: Partial<Record<BlockColor, string>> = {
  cyan: "--cyan",
  magenta: "--magenta",
  yellow: "--yellow",
  green: "--green",
};
export const SOUND_BOUNCE = "/games/arkanoid/sounds/ball-bounce.mp3";
export const SOUND_BREAK = "/games/arkanoid/sounds/break-sound.mp3";
