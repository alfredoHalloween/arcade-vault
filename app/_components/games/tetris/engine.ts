import type { GameCanvasProps } from "../types";
import {
  BASE_DROP_INTERVAL,
  BLOCK,
  BOARD_X,
  BOARD_Y,
  COLORS,
  COLS,
  DROP_INTERVAL_STEP,
  GHOST_ALPHA,
  GRID_COLOR,
  H,
  HARD_DROP_POINTS,
  LINES_LABEL_Y,
  LINES_PER_LEVEL,
  LINES_VALUE_Y,
  LINE_SCORES,
  MAX_DT,
  MAX_SCORE,
  MIN_DROP_INTERVAL,
  NEXT_BOX_SIZE,
  NEXT_BOX_Y,
  NEXT_LABEL_Y,
  PANEL_X,
  ROWS,
  SOFT_DROP_POINTS,
  W,
} from "./constants";
import {
  clearLines,
  collide,
  ghostY,
  merge,
  randomPiece,
  tryRotate,
  type Piece,
} from "./entities";
import { createInput, type TetrisKey } from "./input";
import { createBoard } from "./utils";

type Palette = { cyan: string; yellow: string; font: string };

const FALLBACK_PALETTE: Palette = {
  cyan: "#00f5ff",
  yellow: "#f5ff00",
  font: "monospace",
};

function readPalette(): Palette {
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  const token = (name: string, fallback: string) =>
    root.getPropertyValue(name).trim() || fallback;
  const pixel = body.getPropertyValue("--font-press-start").trim();
  return {
    cyan: token("--cyan", FALLBACK_PALETTE.cyan),
    yellow: token("--yellow", FALLBACK_PALETTE.yellow),
    font: pixel ? `${pixel}, monospace` : FALLBACK_PALETTE.font,
  };
}

function dropIntervalFor(level: number) {
  return Math.max(
    MIN_DROP_INTERVAL,
    BASE_DROP_INTERVAL - (level - 1) * DROP_INTERVAL_STEP,
  );
}

export function createTetrisGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void } {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const palette = readPalette();

  let paused = false;
  let destroyed = false;
  let gameOver = false;
  let rafId = 0;
  let lastTime: number | null = null;

  const board = createBoard();
  let current: Piece = randomPiece();
  let next: Piece = randomPiece();
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = dropIntervalFor(level);
  let dropAccum = 0;

  const input = createInput(handleKey);

  // Los callbacks solo se llaman cuando el valor cambia. No hay onLives.
  const emitted = { score: NaN, level: NaN };
  function emit() {
    const shown = Math.min(score, MAX_SCORE);
    if (emitted.score !== shown) {
      emitted.score = shown;
      callbacks.onScore(shown);
    }
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

  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) endGame();
  }

  function lockPiece() {
    merge(board, current);
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] ?? 0) * level;
      level = Math.floor(lines / LINES_PER_LEVEL) + 1;
      dropInterval = dropIntervalFor(level);
    }
    spawn();
    emit();
  }

  function handleKey(key: TetrisKey) {
    if (paused || gameOver) return;
    switch (key) {
      case "left":
        if (!collide(board, current.shape, current.x - 1, current.y))
          current.x--;
        break;
      case "right":
        if (!collide(board, current.shape, current.x + 1, current.y))
          current.x++;
        break;
      case "down":
        if (!collide(board, current.shape, current.x, current.y + 1)) {
          current.y++;
          score += SOFT_DROP_POINTS;
        } else {
          lockPiece();
        }
        break;
      case "rotate":
        tryRotate(board, current);
        break;
      case "hardDrop": {
        const gy = ghostY(board, current);
        score += (gy - current.y) * HARD_DROP_POINTS;
        current.y = gy;
        lockPiece();
        break;
      }
    }
    emit();
  }

  function update(dtMs: number) {
    dropAccum += dtMs;
    if (dropAccum < dropInterval) return;
    dropAccum = 0;
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }

  function drawBlock(x: number, y: number, colorIndex: number, alpha = 1) {
    const color = COLORS[colorIndex];
    if (!color) return;
    ctx!.globalAlpha = alpha;
    ctx!.fillStyle = color;
    ctx!.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
    ctx!.fillStyle = "rgba(255,255,255,0.12)";
    ctx!.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
    ctx!.globalAlpha = 1;
  }

  function drawGrid() {
    ctx!.strokeStyle = GRID_COLOR;
    ctx!.lineWidth = 0.5;
    ctx!.beginPath();
    for (let c = 1; c < COLS; c++) {
      ctx!.moveTo(c * BLOCK, 0);
      ctx!.lineTo(c * BLOCK, ROWS * BLOCK);
    }
    for (let r = 1; r < ROWS; r++) {
      ctx!.moveTo(0, r * BLOCK);
      ctx!.lineTo(COLS * BLOCK, r * BLOCK);
    }
    ctx!.stroke();
  }

  function drawShape(shape: number[][], ox: number, oy: number, alpha = 1) {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) drawBlock(ox + c, oy + r, shape[r][c], alpha);
  }

  function drawPanel() {
    const c = ctx!;
    c.textBaseline = "top";
    c.textAlign = "left";
    c.font = `12px ${palette.font}`;
    c.fillStyle = palette.cyan;
    c.fillText("SIGUIENTE", PANEL_X, NEXT_LABEL_Y);
    c.strokeStyle = palette.cyan;
    c.globalAlpha = 0.5;
    c.lineWidth = 1;
    c.strokeRect(PANEL_X + 0.5, NEXT_BOX_Y + 0.5, NEXT_BOX_SIZE, NEXT_BOX_SIZE);
    c.globalAlpha = 1;
    c.save();
    c.translate(PANEL_X, NEXT_BOX_Y);
    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    drawShape(shape, offX, offY);
    c.restore();
    c.fillStyle = palette.cyan;
    c.font = `12px ${palette.font}`;
    c.fillText("LÍNEAS", PANEL_X, LINES_LABEL_Y);
    c.fillStyle = palette.yellow;
    c.font = `20px ${palette.font}`;
    c.fillText(String(lines), PANEL_X, LINES_VALUE_Y);
  }

  function draw() {
    const c = ctx!;
    c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    c.clearRect(0, 0, W, H);

    c.save();
    c.translate(BOARD_X, BOARD_Y);
    c.fillStyle = "rgba(255,255,255,0.03)";
    c.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    drawGrid();
    for (let r = 0; r < ROWS; r++)
      for (let col = 0; col < COLS; col++) drawBlock(col, r, board[r][col]);
    if (!gameOver) {
      drawShape(current.shape, current.x, ghostY(board, current), GHOST_ALPHA);
    }
    drawShape(current.shape, current.x, current.y);
    c.strokeStyle = palette.cyan;
    c.globalAlpha = 0.6;
    c.lineWidth = 2;
    c.strokeRect(-1, -1, COLS * BLOCK + 2, ROWS * BLOCK + 2);
    c.globalAlpha = 1;
    c.restore();

    drawPanel();
  }

  function loop(ts: number) {
    if (destroyed) return;
    if (!paused && !gameOver) {
      const dt = lastTime === null ? 0 : Math.min(ts - lastTime, MAX_DT);
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
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.destroy();
    },
  };
}
