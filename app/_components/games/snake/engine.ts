import { DEFAULT_SKIN, type SkinId } from "../skins";
import type { GameCanvasProps } from "../types";
import {
  CELL,
  COLS,
  FRUITS_IMAGE_SRC,
  FRUIT_CROPS,
  FRUIT_MARGIN,
  FRUITS_PER_LEVEL,
  H,
  MAX_DT_MS,
  MAX_QUEUED_TURNS,
  MAX_SCORE,
  PALETTES,
  PIXEL_SIZE,
  POINTS_PER_FRUIT,
  RETRO_FRUIT,
  ROWS,
  W,
  type Palette,
  type SkinColor,
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
/** Paleta con los colores ya resueltos a cadenas CSS. */
type Look = Omit<
  Palette,
  "bg" | "grid" | "body" | "head" | "food" | "core" | "ink"
> & {
  bg: string | null;
  grid: string;
  body: string;
  head: string;
  food: string;
  core: string | null;
  ink: string;
};
/** Resuelve las paletas de todas las skins una vez (tokens del tema con hex de respaldo). */
function readLooks(): Record<SkinId, Look> {
  const style = getComputedStyle(document.documentElement);
  const resolve = (c: SkinColor) =>
    (c.token && style.getPropertyValue(c.token).trim()) || c.hex;
  const looks = {} as Record<SkinId, Look>;
  for (const id of Object.keys(PALETTES) as SkinId[]) {
    const p = PALETTES[id];
    looks[id] = {
      ...p,
      bg: p.bg && resolve(p.bg),
      grid: resolve(p.grid),
      body: resolve(p.body),
      head: resolve(p.head),
      food: resolve(p.food),
      core: p.core && resolve(p.core),
      ink: resolve(p.ink),
    };
  }
  return looks;
}
/** Ojos de la cabeza en la skin RETRO: 2 píxeles (en unidades de `PIXEL_SIZE`) según la dirección. */
const RETRO_EYES: Record<Dir, [number, number][]> = {
  up: [
    [2, 2],
    [5, 2],
  ],
  down: [
    [2, 5],
    [5, 5],
  ],
  left: [
    [2, 2],
    [2, 5],
  ],
  right: [
    [5, 2],
    [5, 5],
  ],
};
type Food = { cell: Cell; fruit: number };
export function createSnakeGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused" | "skin">,
  initialSkin: SkinId = DEFAULT_SKIN,
): {
  setPaused(paused: boolean): void;
  setSkin(skin: SkinId): void;
  destroy(): void;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const looks = readLooks();
  let skin = initialSkin;
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
  // ===== Render (depende de la skin; nunca toca el estado de la partida) =====
  function drawGrid(look: Look) {
    const c = ctx!;
    if (look.style === "pixel") {
      // RETRO: un píxel en cada cruce de la rejilla.
      c.fillStyle = look.grid;
      for (let col = 1; col < COLS; col++) {
        for (let row = 1; row < ROWS; row++) {
          c.fillRect(
            col * CELL - PIXEL_SIZE / 2,
            row * CELL - PIXEL_SIZE / 2,
            PIXEL_SIZE,
            PIXEL_SIZE,
          );
        }
      }
      return;
    }
    c.strokeStyle = look.grid;
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
  /** CLÁSICO: segmentos rellenos con glow (render original). */
  function drawSnakeBlocks(look: Look, scale: number) {
    const c = ctx!;
    c.save();
    c.shadowBlur = look.glow * scale;
    c.shadowColor = look.body;
    for (let i = snake.length - 1; i >= 1; i--) {
      drawSegment(snake[i], look.body);
    }
    c.shadowColor = look.head;
    drawSegment(snake[0], look.head);
    c.restore();
  }
  /** NEON: trazo continuo por los centros de las celdas, con glow y núcleo claro. */
  function drawSnakeVector(look: Look, scale: number) {
    const c = ctx!;
    const center = (cell: Cell) => [
      cell.col * CELL + CELL / 2,
      cell.row * CELL + CELL / 2,
    ];
    const tracePath = () => {
      c.beginPath();
      for (let i = snake.length - 1; i >= 0; i--) {
        const [x, y] = center(snake[i]);
        if (i === snake.length - 1) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
    };
    const head = snake[0];
    const hs = CELL - 14;
    const hx = head.col * CELL + 7;
    const hy = head.row * CELL + 7;
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    c.shadowBlur = look.glow * scale;
    c.shadowColor = look.body;
    c.strokeStyle = look.body;
    c.lineWidth = 6;
    tracePath();
    c.stroke();
    c.shadowColor = look.head;
    c.strokeStyle = look.head;
    c.lineWidth = 2;
    c.strokeRect(hx, hy, hs, hs);
    if (look.core) {
      c.shadowBlur = 0;
      c.strokeStyle = look.core;
      c.lineWidth = 1.5;
      tracePath();
      c.stroke();
      c.lineWidth = 1;
      c.strokeRect(hx, hy, hs, hs);
    }
    c.restore();
  }
  /** RETRO: bloques de 6×6 píxeles con hueco central; cabeza maciza con ojos. */
  function drawSnakePixel(look: Look) {
    const c = ctx!;
    const p = PIXEL_SIZE;
    for (let i = snake.length - 1; i >= 0; i--) {
      const x = snake[i].col * CELL;
      const y = snake[i].row * CELL;
      const isHead = i === 0;
      c.fillStyle = isHead ? look.head : look.body;
      c.fillRect(x + p, y + p, p * 6, p * 6);
      c.fillStyle = look.ink;
      if (isHead) {
        for (const [ex, ey] of RETRO_EYES[dir]) {
          c.fillRect(x + ex * p, y + ey * p, p, p);
        }
      } else {
        c.fillRect(x + p * 3, y + p * 3, p * 2, p * 2);
      }
    }
  }
  function drawFoodCircle(look: Look, x: number, y: number) {
    const c = ctx!;
    c.fillStyle = look.food;
    c.beginPath();
    c.arc(
      x + CELL / 2,
      y + CELL / 2,
      CELL / 2 - FRUIT_MARGIN - 2,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  function drawFood(look: Look, scale: number) {
    if (!food) return;
    const c = ctx!;
    const x = food.cell.col * CELL;
    const y = food.cell.row * CELL;
    if (look.style === "pixel") {
      c.fillStyle = look.food;
      RETRO_FRUIT.forEach((line, row) => {
        for (let col = 0; col < line.length; col++) {
          if (line[col] === "#") {
            c.fillRect(
              x + col * PIXEL_SIZE,
              y + row * PIXEL_SIZE,
              PIXEL_SIZE,
              PIXEL_SIZE,
            );
          }
        }
      });
      return;
    }
    if (look.style === "vector") {
      // Rombo trazado con glow; late suavemente (solo visual).
      const cx = x + CELL / 2;
      const cy = y + CELL / 2;
      const r = 11 + Math.sin(performance.now() / 180) * 1.5;
      const diamond = () => {
        c.beginPath();
        c.moveTo(cx, cy - r);
        c.lineTo(cx + r, cy);
        c.lineTo(cx, cy + r);
        c.lineTo(cx - r, cy);
        c.closePath();
      };
      c.save();
      c.shadowBlur = look.glow * 1.3 * scale;
      c.shadowColor = look.food;
      c.strokeStyle = look.food;
      c.lineWidth = 2;
      diamond();
      c.stroke();
      if (look.core) {
        c.shadowBlur = 0;
        c.strokeStyle = look.core;
        c.lineWidth = 0.75;
        diamond();
        c.stroke();
      }
      c.restore();
      return;
    }
    if (!look.sprite || !fruitsImage) {
      drawFoodCircle(look, x, y);
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
  /** RETRO: líneas de barrido horizontales tenues (efecto CRT/LCD). */
  function drawScanlines(look: Look) {
    const c = ctx!;
    c.save();
    c.globalAlpha = 0.12;
    c.fillStyle = look.head;
    for (let y = 0; y < H; y += PIXEL_SIZE) {
      c.fillRect(0, y, W, 1);
    }
    c.restore();
  }
  function draw() {
    const c = ctx!;
    const look = looks[skin];
    // `shadowBlur` va en píxeles del búfer, no del espacio lógico.
    const scale = canvas.width / W;
    c.setTransform(scale, 0, 0, canvas.height / H, 0, 0);
    c.clearRect(0, 0, W, H);
    if (look.bg) {
      c.fillStyle = look.bg;
      c.fillRect(0, 0, W, H);
    }
    drawGrid(look);
    drawFood(look, scale);
    if (look.style === "vector") drawSnakeVector(look, scale);
    else if (look.style === "pixel") drawSnakePixel(look);
    else drawSnakeBlocks(look, scale);
    if (look.style === "pixel") drawScanlines(look);
    c.shadowBlur = 0;
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
    setSkin(next: SkinId) {
      // Solo cambia el render: el bucle sigue dibujando aunque esté en pausa.
      skin = next;
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
