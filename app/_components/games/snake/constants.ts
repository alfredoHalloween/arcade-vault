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
/** Colores de respaldo si los tokens del tema no existen. */
export const FALLBACK_COLORS = {
  green: "#00ff88",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  grid: "rgba(0, 245, 255, 0.08)",
};
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
