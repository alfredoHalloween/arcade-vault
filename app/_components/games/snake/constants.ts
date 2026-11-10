import type { SkinId } from "../skins";
/** Coordenadas lógicas del canvas (proporción 4:3 del marco CRT). */
export const W = 800;
export const H = 600;
/** Cuadrícula 20×15 de celdas de 40 px: llena el canvas sin márgenes. */
export const COLS = 20;
export const ROWS = 15;
export const CELL = 40;
export const START_LENGTH = 3;
export const START_HEAD = { col: 9, row: 7 };
export const POINTS_PER_FRUIT = 10;
export const FRUITS_PER_LEVEL = 5;
export const MAX_SCORE = 9_999_999;
/** Intervalo entre pasos del nivel L: max(MIN, START - (L - 1) * DECREMENT). */
export const START_STEP_MS = 140;
export const MIN_STEP_MS = 60;
export const STEP_DECREMENT_MS = 10;
/** Máximo de giros pendientes en la cola de entrada. */
export const MAX_QUEUED_TURNS = 2;
/** Tope del acumulador por frame (con 60 ms de intervalo mínimo, como mucho un paso por frame). */
export const MAX_DT_MS = 50;
/** Margen en px entre el sprite de la fruta y el borde de su celda. */
export const FRUIT_MARGIN = 2;
// ===== Skins (solo render; ninguna constante de jugabilidad depende de ellas) =====
/** Color de skin: token CSS opcional (leído con `getComputedStyle`) y hex de respaldo. */
export type SkinColor = { token?: `--${string}`; hex: string };
/** Paleta y estilo de dibujo de una skin. */
export type Palette = {
  /**
   * `blocks`: segmentos rellenos con glow (render original).
   * `vector`: serpiente como trazo continuo con glow y núcleo claro.
   * `pixel`: bloques de rejilla sin glow, comida pixel-art y líneas CRT.
   */
  style: "blocks" | "vector" | "pixel";
  /** Fondo (null = transparente, se ve el fondo del marco). */
  bg: SkinColor | null;
  grid: SkinColor;
  body: SkinColor;
  head: SkinColor;
  /** Comida: en `blocks` es el círculo de respaldo si `fruits.png` no carga. */
  food: SkinColor;
  /** Núcleo claro sobre los trazos (null = sin núcleo). */
  core: SkinColor | null;
  /** Detalle oscuro (ojos y relleno interior en `pixel`). */
  ink: SkinColor;
  /** `shadowBlur` en px lógicos (0 = sin glow). */
  glow: number;
  /** Usa el sprite `fruits.png` para la comida (solo clásico). */
  sprite: boolean;
};
const CYAN: SkinColor = { token: "--cyan", hex: "#00f5ff" };
const MAGENTA: SkinColor = { token: "--magenta", hex: "#ff006e" };
const YELLOW: SkinColor = { token: "--yellow", hex: "#f5ff00" };
const GREEN: SkinColor = { token: "--green", hex: "#00ff88" };
// 4 tonos fijos de LCD verde para RETRO (de oscuro a claro).
const LCD_0: SkinColor = { hex: "#0f380f" };
const LCD_1: SkinColor = { hex: "#306230" };
const LCD_2: SkinColor = { hex: "#8bac0f" };
const LCD_3: SkinColor = { hex: "#9bbc0f" };
/** Lado (px lógicos) de cada "píxel" en la skin `pixel`: 8 por celda. */
export const PIXEL_SIZE = CELL / 8;
export const PALETTES: Record<SkinId, Palette> = {
  // Render original exacto: cuerpo `--green`, cabeza `--cyan`, glow 8 y sprite de frutas.
  clasico: {
    style: "blocks",
    bg: null,
    grid: { hex: "rgba(0, 245, 255, 0.08)" },
    body: GREEN,
    head: CYAN,
    food: MAGENTA,
    core: null,
    ink: { hex: "#000" },
    glow: 8,
    sprite: true,
  },
  // Vector brillante: trazo continuo verde con núcleo blanco, cabeza magenta y fruta amarilla.
  neon: {
    style: "vector",
    bg: { token: "--bg", hex: "#0a0a0f" },
    grid: { hex: "rgba(255, 0, 110, 0.10)" },
    body: GREEN,
    head: MAGENTA,
    food: YELLOW,
    core: { hex: "#ffffff" },
    ink: { token: "--bg", hex: "#0a0a0f" },
    glow: 14,
    sprite: false,
  },
  // Pixel/LCD: 4 tonos fijos, sin glow, bloques de rejilla y fruta pixel-art.
  retro: {
    style: "pixel",
    bg: LCD_3,
    grid: LCD_2,
    body: LCD_1,
    head: LCD_0,
    food: LCD_0,
    core: null,
    ink: LCD_2,
    glow: 0,
    sprite: false,
  },
};
/** Fruta pixel-art 8×8 de la skin RETRO (`#` = píxel encendido). */
export const RETRO_FRUIT = [
  "....##..",
  "...#....",
  ".##.##..",
  "########",
  "#####.##",
  "########",
  ".######.",
  "..####..",
];
export const FRUITS_IMAGE_SRC = "/games/snake/fruits.png";
export type FruitCrop = { x: number; y: number; w: number; h: number };
/**
 * Recortes de la fila del medio (pixel-art) de `fruits.png`, portados de
 * `sprites.js`. Los nombres del atlas original no son fiables: se eligieron
 * por coordenadas, mirando cada recorte.
 */
export const FRUIT_CROPS: FruitCrop[] = [
  { x: 34, y: 136, w: 110, h: 160 }, // manzana
  { x: 186, y: 136, w: 150, h: 160 }, // plátano
  { x: 1228, y: 136, w: 130, h: 160 }, // fresa
  { x: 1400, y: 136, w: 130, h: 160 }, // cerezas
  { x: 2604, y: 136, w: 130, h: 160 }, // limón
  { x: 2948, y: 136, w: 130, h: 160 }, // melocotón
];
