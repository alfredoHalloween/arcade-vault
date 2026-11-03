import { COLS, PIECE_COUNT, PIECES, ROWS, WALL_KICKS } from "./constants";
import { rotateCW, type Board } from "./utils";

export type Piece = {
  /** Índice 1–8 (I, O, T, S, Z, J, L, N). */
  type: number;
  shape: number[][];
  x: number;
  y: number;
};

/** Sorteo uniforme con repetición entre las 8 piezas, centrada arriba. */
export function randomPiece(): Piece {
  const type = Math.floor(Math.random() * PIECE_COUNT) + 1;
  const shape = PIECES[type]!.map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

/** true si la forma, colocada en (ox, oy), sale del tablero o pisa bloques. */
export function collide(
  board: Board,
  shape: number[][],
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

/** Rota en sentido horario probando los kicks; si ninguno cabe, no hace nada. */
export function tryRotate(board: Board, piece: Piece): boolean {
  const rotated = rotateCW(piece.shape);
  for (const kick of WALL_KICKS) {
    if (!collide(board, rotated, piece.x + kick, piece.y)) {
      piece.shape = rotated;
      piece.x += kick;
      return true;
    }
  }
  return false;
}

/** Fija la pieza en el tablero. */
export function merge(board: Board, piece: Piece): void {
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c])
        board[piece.y + r][piece.x + c] = piece.shape[r][c];
}

/** Elimina las filas completas (de abajo arriba) y devuelve cuántas fueron. */
export function clearLines(board: Board): number {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((v) => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array<number>(COLS).fill(0));
      cleared++;
      r++; // la fila que bajó ocupa ahora el mismo índice
    }
  }
  return cleared;
}

/** Fila `y` en la que aterrizaría la pieza si cayera en vertical. */
export function ghostY(board: Board, piece: Piece): number {
  let gy = piece.y;
  while (!collide(board, piece.shape, piece.x, gy + 1)) gy++;
  return gy;
}
