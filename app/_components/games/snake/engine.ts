import type { GameCanvasProps } from "../types";
import {
  CELL,
  COLS,
  FALLBACK_COLORS,
  FRUITS_IMAGE_SRC,
  FRUIT_CROPS,
  FRUIT_MARGIN,
  FRUITS_PER_LEVEL,
  H,
  MAX_DT_MS,
  MAX_QUEUED_TURNS,
  MAX_SCORE,
  POINTS_PER_FRUIT,
  ROWS,
  W,
} from "./constants";
import {
  createSnake,
  hitsBody,
  hitsWall,
  isOpposite,
  nextHead,
  spawnFood,
  stepInterval,
  type Cell,
  type Dir,
} from "./entities";
import { createInput } from "./input";
type Palette = { green: string; cyan: string; magenta: string; grid: string };
function readPalette(): Palette {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    root.getPropertyValue(name).trim() || fallback;
  return {
    green: token("--green", FALLBACK_COLORS.green),
    cyan: token("--cyan", FALLBACK_COLORS.cyan),
    magenta: token("--magenta", FALLBACK_COLORS.magenta),
    grid: FALLBACK_COLORS.grid,
  };
}
type Food = { cell: Cell; fruit: number };
export function createSnakeGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void } {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const palette = readPalette();
  let paused = false;
  let destroyed = false;
  let ended = false;
  let rafId = 0;
  let lastTime: number | null = null;
  let accum = 0;
  const snake = createSnake();
  let dir: Dir = "right";
  const queue: Dir[] = [];
  let fruitsEaten = 0;
  let score = 0;
  let level = 1;
  let food: Food | null = null;
  // `null` mientras carga o si falla: la comida se dibuja como círculo.
  let fruitsImage: HTMLImageElement | null = null;
  function placeFood() {
    const cell = spawnFood(snake);
    food = cell
      ? { cell, fruit: Math.floor(Math.random() * FRUIT_CROPS.length) }
      : null;
    return food !== null;
  }
  placeFood();
  const input = createInput(handleDir);
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
    ended = true;
    queue.length = 0;
    input.setActive(false);
    emit();
    callbacks.onGameOver(Math.min(score, MAX_SCORE));
  }
  function handleDir(next: Dir) {
    if (paused || ended) return;
    // El giro se valida contra el último encolado, o la dirección actual.
    const ref = queue.length ? queue[queue.length - 1] : dir;
    if (next === ref || isOpposite(next, ref)) return;
    if (queue.length >= MAX_QUEUED_TURNS) return;
    queue.push(next);
  }
  function step() {
    const turn = queue.shift();
    if (turn) dir = turn;
    const head = nextHead(snake[0], dir);
    const willGrow =
      food !== null && head.col === food.cell.col && head.row === food.cell.row;
    if (hitsWall(head) || hitsBody(snake, head, willGrow)) {
      endGame();
      return;
    }
    snake.unshift(head);
    if (!willGrow) {
      snake.pop();
      return;
    }
    fruitsEaten++;
    score += POINTS_PER_FRUIT;
    level = Math.floor(fruitsEaten / FRUITS_PER_LEVEL) + 1;
    // Sin celda libre: tablero lleno, victoria.
    if (!placeFood()) endGame();
    else emit();
  }
  function update(dtMs: number) {
    accum += dtMs;
    const interval = stepInterval(level);
    // dt ≤ 50 ms e intervalo ≥ 60 ms: como mucho un paso por frame.
    if (accum < interval) return;
    accum -= interval;
    step();
  }
  function drawGrid() {
    const c = ctx!;
    c.strokeStyle = palette.grid;
    c.lineWidth = 1;
    c.beginPath();
    for (let col = 1; col < COLS; col++) {
      c.moveTo(col * CELL, 0);
      c.lineTo(col * CELL, H);
    }
    for (let row = 1; row < ROWS; row++) {
      c.moveTo(0, row * CELL);
      c.lineTo(W, row * CELL);
    }
    c.stroke();
  }
  function drawSegment(cell: Cell, color: string) {
    const c = ctx!;
    const pad = 3;
    c.fillStyle = color;
    c.fillRect(
      cell.col * CELL + pad,
      cell.row * CELL + pad,
      CELL - pad * 2,
      CELL - pad * 2,
    );
  }
  function drawSnake() {
    const c = ctx!;
    // `shadowBlur` va en píxeles del búfer, no del espacio lógico.
    const scale = canvas.width / W;
    c.save();
    c.shadowBlur = 8 * scale;
    c.shadowColor = palette.green;
    for (let i = snake.length - 1; i >= 1; i--) {
      drawSegment(snake[i], palette.green);
    }
    c.shadowColor = palette.cyan;
    drawSegment(snake[0], palette.cyan);
    c.restore();
  }
  function drawFood() {
    if (!food) return;
    const c = ctx!;
    const x = food.cell.col * CELL;
    const y = food.cell.row * CELL;
    if (!fruitsImage) {
      c.fillStyle = palette.magenta;
      c.beginPath();
      c.arc(
        x + CELL / 2,
        y + CELL / 2,
        CELL / 2 - FRUIT_MARGIN - 2,
        0,
        Math.PI * 2,
      );
      c.fill();
      return;
    }
    const crop = FRUIT_CROPS[food.fruit];
    // Mantiene la proporción y centra el sprite dentro de la celda.
    const avail = CELL - FRUIT_MARGIN * 2;
    const k = Math.min(avail / crop.w, avail / crop.h);
    const dw = crop.w * k;
    const dh = crop.h * k;
    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(
      fruitsImage,
      crop.x,
      crop.y,
      crop.w,
      crop.h,
      x + (CELL - dw) / 2,
      y + (CELL - dh) / 2,
      dw,
      dh,
    );
    c.restore();
  }
  function draw() {
    const c = ctx!;
    c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    c.clearRect(0, 0, W, H);
    drawGrid();
    drawFood();
    drawSnake();
  }
  function loop(ts: number) {
    if (destroyed) return;
    if (!paused && !ended) {
      const dt = lastTime === null ? 0 : Math.min(ts - lastTime, MAX_DT_MS);
      update(dt);
    }
    lastTime = ts;
    draw();
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (destroyed) return;
    rafId = requestAnimationFrame(loop);
  }
  emit();
  // El bucle espera a la imagen; si falla, la comida se dibuja como círculo.
  const img = new Image();
  img.onload = () => {
    if (destroyed) return;
    fruitsImage = img;
    start();
  };
  img.onerror = () => start();
  img.src = FRUITS_IMAGE_SRC;
  return {
    setPaused(next: boolean) {
      paused = next;
      // Al pausar se descartan giros pendientes y el tiempo transcurrido.
      queue.length = 0;
      lastTime = null;
      input.setActive(!paused && !ended);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      img.onload = null;
      img.onerror = null;
      input.destroy();
    },
  };
}
