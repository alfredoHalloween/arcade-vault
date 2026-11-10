import type { SkinId } from "../skins";
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
// ===== Skins (solo render; ninguna constante de jugabilidad depende de ellas) =====
/** Color de skin: token CSS opcional (leído con `getComputedStyle` al montar) y hex de respaldo. */
export type SkinColor = { token?: `--${string}`; hex: string };
/** Paleta y estilo de dibujo de una skin. */
export type Palette = {
  /**
   * `glow`: bloques rellenos con brillo (render original).
   * `outline`: vector neón, contornos finos con glow y núcleo claro.
   * `pixel`: rejilla de `PIXEL_GRID` px, sin glow, biseles cuadrados y scanlines.
   */
  style: "glow" | "outline" | "pixel";
  /** Fondo pintado en el canvas (null = transparente, se ve el marco). */
  bg: SkinColor | null;
  /** Rejilla de fondo (null = sin rejilla). */
  grid: SkinColor | null;
  blocks: Record<BlockColor, SkinColor>;
  paddle: SkinColor;
  /** Detalle de la paleta (extremos en `pixel`, núcleo en `outline`). */
  paddleAccent: SkinColor;
  ball: SkinColor;
  /** Sombra/bisel oscuro de `pixel` y núcleo claro de `outline`. */
  detail: SkinColor;
  glow: { block: number; paddle: number; ball: number };
};
const CYAN: SkinColor = { token: "--cyan", hex: "#00f5ff" };
const MAGENTA: SkinColor = { token: "--magenta", hex: "#ff006e" };
const YELLOW: SkinColor = { token: "--yellow", hex: "#f5ff00" };
const GREEN: SkinColor = { token: "--green", hex: "#00ff88" };
// Paleta CGA de 4 colores fijos para RETRO.
const CGA_BLACK: SkinColor = { hex: "#000000" };
const CGA_CYAN: SkinColor = { hex: "#55ffff" };
const CGA_MAGENTA: SkinColor = { hex: "#ff55ff" };
const CGA_WHITE: SkinColor = { hex: "#ffffff" };
/** Lado (px lógicos) de la rejilla de la skin `pixel`. */
export const PIXEL_GRID = 4;
export const PALETTES: Record<SkinId, Palette> = {
  // Render original exacto: tokens del tema (cyan/magenta/yellow/green) y hex fijos.
  clasico: {
    style: "glow",
    bg: null,
    grid: null,
    blocks: {
      red: { hex: "#ff4d4d" },
      yellow: YELLOW,
      cyan: CYAN,
      magenta: MAGENTA,
      hotpink: { hex: "#ff69b4" },
      green: GREEN,
      gray: { hex: "#8a8fa3" },
    },
    paddle: CYAN,
    paddleAccent: CYAN,
    ball: YELLOW,
    detail: { hex: "rgba(255,255,255,0.22)" },
    glow: { block: 8, paddle: 12, ball: 14 },
  },
  // Vector brillante: contornos finos con glow intenso sobre --bg y rejilla tenue.
  neon: {
    style: "outline",
    bg: { token: "--bg", hex: "#0a0a0f" },
    grid: CYAN,
    blocks: {
      red: { hex: "#ff2a6d" },
      yellow: YELLOW,
      cyan: CYAN,
      magenta: MAGENTA,
      hotpink: { hex: "#ff6ad5" },
      green: GREEN,
      gray: { hex: "#9d8cff" },
    },
    paddle: MAGENTA,
    paddleAccent: CYAN,
    ball: YELLOW,
    detail: { hex: "#ffffff" },
    glow: { block: 14, paddle: 20, ball: 22 },
  },
  // Pixel/CRT: 4 colores CGA, sin glow, rejilla de 4 px y scanlines.
  retro: {
    style: "pixel",
    bg: CGA_BLACK,
    grid: null,
    blocks: {
      red: CGA_MAGENTA,
      yellow: CGA_WHITE,
      cyan: CGA_CYAN,
      magenta: CGA_MAGENTA,
      hotpink: CGA_MAGENTA,
      green: CGA_CYAN,
      gray: CGA_WHITE,
    },
    paddle: CGA_WHITE,
    paddleAccent: CGA_CYAN,
    ball: CGA_WHITE,
    detail: CGA_BLACK,
    glow: { block: 0, paddle: 0, ball: 0 },
  },
};
export const SOUND_BOUNCE = "/games/arkanoid/sounds/ball-bounce.mp3";
export const SOUND_BREAK = "/games/arkanoid/sounds/break-sound.mp3";
