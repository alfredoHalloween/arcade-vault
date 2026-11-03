/** Coordenadas lógicas del canvas (proporción 4:3 del marco CRT). */
export const W = 800;
export const H = 600;

export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;

/** Esquina superior izquierda del tablero (300×600), a la izquierda del centro. */
export const BOARD_X = 150;
export const BOARD_Y = 0;

/** Panel derecho: pieza siguiente (rejilla 4×4) y contador de líneas. */
export const PANEL_X = 520;
export const NEXT_LABEL_Y = 70;
export const NEXT_BOX_Y = 90;
export const NEXT_BOX_SIZE = 4 * BLOCK;
export const LINES_LABEL_Y = 280;
export const LINES_VALUE_Y = 320;

/** Índice 1–8 → color de pieza (I, O, T, S, Z, J, L, N); 0 = vacío. */
export const COLORS: (string | null)[] = [
  null,
  "#4dd0e1", // I
  "#ffd54f", // O
  "#ba68c8", // T
  "#81c784", // S
  "#e57373", // Z
  "#90caf9", // J
  "#ffb74d", // L
  "#9e9e9e", // N (tuerca)
];

export const PIECE_COUNT = 8;

/** Matrices de las piezas por índice (1–8); la rotación crea copias nuevas. */
export const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ],
];

/** Puntos por 0–4 líneas, multiplicados por el nivel vigente. */
export const LINE_SCORES = [0, 100, 300, 500, 800];

/** Desplazamientos en columnas que prueba la rotación junto a una pared. */
export const WALL_KICKS = [0, -1, 1, -2, 2];

export const SOFT_DROP_POINTS = 1;
export const HARD_DROP_POINTS = 2;
export const LINES_PER_LEVEL = 10;
export const BASE_DROP_INTERVAL = 1000;
export const DROP_INTERVAL_STEP = 90;
export const MIN_DROP_INTERVAL = 100;

/** Tope de `scores.score` en la base de datos. */
export const MAX_SCORE = 9_999_999;

/** `dt` máximo del acumulador de caída (ms). */
export const MAX_DT = 50;

export const GHOST_ALPHA = 0.2;
export const GRID_COLOR = "rgba(255,255,255,0.07)";
