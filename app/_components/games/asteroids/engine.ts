import { DEFAULT_SKIN, type SkinId } from "../skins";
import type { GameCanvasProps } from "../types";
import {
  ASTEROID_SAFE_DIST,
  H,
  INITIAL_ASTEROIDS,
  INITIAL_LIVES,
  MAX_DT,
  PALETTES,
  PIXEL_SIZE,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  POWERUP_GUARANTEED_KILLS,
  RESPAWN_DELAY,
  SHIP_HIT_FACTOR,
  W,
} from "./constants";
import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  type Look,
} from "./entities";
import { createInput } from "./input";
import { dist, rand } from "./utils";
type State = "playing" | "dead" | "gameover";
/** Resuelve las paletas de todas las skins una vez (tokens del tema con hex de respaldo). */
function readLooks(): Record<SkinId, Look> {
  const style = getComputedStyle(document.documentElement);
  const resolve = (c: { token?: string; hex: string }) =>
    (c.token && style.getPropertyValue(c.token).trim()) || c.hex;
  const looks = {} as Record<SkinId, Look>;
  for (const id of Object.keys(PALETTES) as SkinId[]) {
    const p = PALETTES[id];
    looks[id] = {
      ...p,
      bg: resolve(p.bg),
      grid: p.grid && resolve(p.grid),
      ship: resolve(p.ship),
      thrust: resolve(p.thrust),
      bullet: resolve(p.bullet),
      asteroid: resolve(p.asteroid),
      powerUp: resolve(p.powerUp),
      hud: resolve(p.hud),
      shipDebris: resolve(p.shipDebris),
      rockDebris: resolve(p.rockDebris),
      core: p.core && resolve(p.core),
    };
  }
  return looks;
}
/** Colores RGB de una skin `pixel`, para cuantizar el antialiasing a su paleta limitada. */
function pixelLevels(look: Look): [number, number, number][] {
  const colors = new Set([
    look.bg,
    look.ship,
    look.thrust,
    look.bullet,
    look.asteroid,
    look.powerUp,
    look.shipDebris,
    look.rockDebris,
  ]);
  return [...colors].map((hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  });
}
export function createAsteroidsGame(
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
  const pixelFont =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-press-start")
      .trim() || "monospace";
  // Búfer de baja resolución para las skins `pixel` (se crea al usarlo por primera vez).
  let low: CanvasRenderingContext2D | null = null;
  let paused = false;
  let destroyed = false;
  let rafId = 0;
  let lastTime: number | null = null;
  const ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;
  let state: State = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;
  const input = createInput(() => !paused && state !== "gameover");
  // Los callbacks solo se llaman cuando el valor cambia.
  const emitted = { score: NaN, lives: NaN, level: NaN };
  function emit() {
    if (emitted.score !== score) {
      emitted.score = score;
      callbacks.onScore(score);
    }
    if (emitted.lives !== lives) {
      emitted.lives = lives;
      callbacks.onLives?.(lives);
    }
    if (emitted.level !== level) {
      emitted.level = level;
      callbacks.onLevel(level);
    }
  }
  function spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < ASTEROID_SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }
  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }
  function explode(x: number, y: number, count: number, kind: "ship" | "rock") {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, kind));
  }
  function killShip() {
    explode(ship.x, ship.y, 14, "ship");
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      state = "gameover";
      emit();
      callbacks.onGameOver(score);
    } else {
      state = "dead";
      deadTimer = RESPAWN_DELAY;
    }
  }
  function update(dt: number) {
    if (state === "gameover") {
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      return;
    }
    if (state === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        state = "playing";
        ship.reset();
      }
      return;
    }
    if (input.pressed("Space")) bullets.push(...ship.tryShoot());
    ship.update(dt, input.keys);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }
    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5, "rock");
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= POWERUP_GUARANTEED_KILLS;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);
    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * SHIP_HIT_FACTOR) {
          killShip();
          break;
        }
      }
    }
    // Nivel completado
    if (asteroids.length === 0) nextLevel();
    emit();
  }
  /** Fondo y entidades con la transformación que se le indique (sin HUD). */
  function drawScene(c: CanvasRenderingContext2D, look: Look) {
    c.fillStyle = look.bg;
    c.fillRect(0, 0, W, H);
    if (look.grid) {
      c.save();
      c.globalAlpha = 0.07;
      c.strokeStyle = look.grid;
      c.lineWidth = 1;
      c.beginPath();
      for (let x = 40; x < W; x += 40) {
        c.moveTo(x, 0);
        c.lineTo(x, H);
      }
      for (let y = 40; y < H; y += 40) {
        c.moveTo(0, y);
        c.lineTo(W, y);
      }
      c.stroke();
      c.restore();
    }
    particles.forEach((p) => p.draw(c, look));
    asteroids.forEach((a) => a.draw(c, look));
    powerUps.forEach((p) => p.draw(c, look));
    bullets.forEach((b) => b.draw(c, look));
    ship.draw(c, look);
  }
  /** Dibuja a 1/PIXEL_SIZE, ajusta cada píxel al tono más cercano y reescala sin suavizado. */
  function drawPixelated(look: Look) {
    if (!low) {
      const buffer = document.createElement("canvas");
      buffer.width = Math.round(W / PIXEL_SIZE);
      buffer.height = Math.round(H / PIXEL_SIZE);
      const lowCtx = buffer.getContext("2d", { willReadFrequently: true });
      if (!lowCtx) return false;
      low = lowCtx;
    }
    const lc = low;
    const levels = pixelLevels(look);
    const bw = lc.canvas.width;
    const bh = lc.canvas.height;
    lc.setTransform(bw / W, 0, 0, bh / H, 0, 0);
    drawScene(lc, look);
    const image = lc.getImageData(0, 0, bw, bh);
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      let best = levels[0];
      let bestDist = Infinity;
      for (const lv of levels) {
        const dr = d[i] - lv[0];
        const dg = d[i + 1] - lv[1];
        const db = d[i + 2] - lv[2];
        const dd = dr * dr + dg * dg + db * db;
        if (dd < bestDist) {
          bestDist = dd;
          best = lv;
        }
      }
      d[i] = best[0];
      d[i + 1] = best[1];
      d[i + 2] = best[2];
      d[i + 3] = 255;
    }
    lc.putImageData(image, 0, 0);
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.imageSmoothingEnabled = false;
    ctx!.drawImage(lc.canvas, 0, 0, canvas.width, canvas.height);
    ctx!.imageSmoothingEnabled = true;
    return true;
  }
  function draw() {
    const look = looks[skin];
    if (look.mode === "pixel" && drawPixelated(look)) {
      // Barrido CRT: una línea oscura por cada fila de píxeles.
      ctx!.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      ctx!.fillStyle = "rgba(0, 0, 0, 0.28)";
      for (let y = PIXEL_SIZE - 1; y < H; y += PIXEL_SIZE) {
        ctx!.fillRect(0, y, W, 1);
      }
    } else {
      // Las coordenadas lógicas son 800×600; el canvas puede tener otro tamaño.
      ctx!.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      drawScene(ctx!, look);
    }
    if (ship.tripleShot > 0) {
      const pixel = look.mode === "pixel";
      ctx!.save();
      ctx!.fillStyle = look.hud;
      ctx!.shadowColor = look.hud;
      ctx!.shadowBlur = look.glow.hud;
      ctx!.font = pixel ? `12px ${pixelFont}, monospace` : "15px monospace";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "alphabetic";
      ctx!.fillText(
        `${pixel ? "3X" : "3x"}  ${ship.tripleShot.toFixed(1)}s`,
        14,
        26,
      );
      ctx!.restore();
    }
    ctx!.shadowBlur = 0;
  }
  function loop(ts: number) {
    if (destroyed) return;
    if (paused) {
      lastTime = null;
    } else {
      const dt =
        lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
      lastTime = ts;
      update(dt);
    }
    // Se sigue dibujando en pausa: redimensionar el canvas lo borraría.
    draw();
    rafId = requestAnimationFrame(loop);
  }
  spawnAsteroids(INITIAL_ASTEROIDS);
  emit();
  rafId = requestAnimationFrame(loop);
  return {
    setPaused(next: boolean) {
      paused = next;
      lastTime = null;
      input.clear();
    },
    // Solo cambia el render: el estado de la partida no se toca.
    setSkin(next: SkinId) {
      skin = next;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.destroy();
    },
  };
}
