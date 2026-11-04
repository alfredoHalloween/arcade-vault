import {
  COLS,
  MIN_STEP_MS,
  ROWS,
  START_HEAD,
  START_LENGTH,
  START_STEP_MS,
  STEP_DECREMENT_MS,
} from "./constants";
export type Dir = "up" | "down" | "left" | "right";
export type Cell = { col: number; row: number };
const DELTAS: Record<Dir, Cell> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};
const OPPOSITES: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
/** Serpiente inicial: cabeza en `START_HEAD` (índice 0) y el cuerpo hacia la izquierda. */
export function createSnake(): Cell[] {
  return Array.from({ length: START_LENGTH }, (_, i) => ({
    col: START_HEAD.col - i,
    row: START_HEAD.row,
  }));
}
export function nextHead(head: Cell, dir: Dir): Cell {
  const d = DELTAS[dir];
  return { col: head.col + d.col, row: head.row + d.row };
}
export function isOpposite(a: Dir, b: Dir): boolean {
  return OPPOSITES[a] === b;
}
export function hitsWall(cell: Cell): boolean {
  return cell.col < 0 || cell.col >= COLS || cell.row < 0 || cell.row >= ROWS;
}
/**
 * `true` si `cell` coincide con un segmento. Si la serpiente no crece en este
 * paso, la cola se libera y entrar en su celda no cuenta como colisión.
 */
export function hitsBody(
  snake: readonly Cell[],
  cell: Cell,
  willGrow: boolean,
): boolean {
  const end = willGrow ? snake.length : snake.length - 1;
  for (let i = 0; i < end; i++) {
    if (snake[i].col === cell.col && snake[i].row === cell.row) return true;
  }
  return false;
}
/** Celda libre al azar, o `null` si la serpiente llena el tablero. */
export function spawnFood(
  snake: readonly Cell[],
  rng: () => number = Math.random,
): Cell | null {
  const occupied = new Set(snake.map((c) => c.row * COLS + c.col));
  const free: number[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    if (!occupied.has(i)) free.push(i);
  }
  if (free.length === 0) return null;
  const pick = free[Math.min(free.length - 1, Math.floor(rng() * free.length))];
  return { col: pick % COLS, row: Math.floor(pick / COLS) };
}
/** Intervalo entre pasos (ms) del nivel `level`: max(60, 140 - (level - 1) * 10). */
export function stepInterval(level: number): number {
  return Math.max(MIN_STEP_MS, START_STEP_MS - (level - 1) * STEP_DECREMENT_MS);
}
