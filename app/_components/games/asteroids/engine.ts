import type { GameCanvasProps } from "../types";
import {
  ASTEROID_SAFE_DIST,
  H,
  INITIAL_ASTEROIDS,
  INITIAL_LIVES,
  MAX_DT,
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
  type Palette,
} from "./entities";
import { createInput } from "./input";
import { dist, rand } from "./utils";
type State = "playing" | "dead" | "gameover";
const FALLBACK_PALETTE: Palette = {
  cyan: "#00f5ff",
  magenta: "#ff006e",
  yellow: "#f5ff00",
  green: "#00ff88",
};
function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    cyan: token("--cyan", FALLBACK_PALETTE.cyan),
    magenta: token("--magenta", FALLBACK_PALETTE.magenta),
    yellow: token("--yellow", FALLBACK_PALETTE.yellow),
    green: token("--green", FALLBACK_PALETTE.green),
  };
}
export function createAsteroidsGame(
  canvas: HTMLCanvasElement,
  callbacks: Omit<GameCanvasProps, "paused">,
): { setPaused(paused: boolean): void; destroy(): void } {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  const palette = readPalette();
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
      callbacks.onLives(lives);
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
  function explode(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
  }
  function killShip() {
    explode(ship.x, ship.y, 14, palette.cyan);
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
          explode(a.x, a.y, a.size * 5, palette.magenta);
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
  function draw() {
    // Las coordenadas lógicas son 800×600; el canvas puede tener otro tamaño.
    ctx!.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx!.fillStyle = "#000";
    ctx!.fillRect(0, 0, W, H);
    particles.forEach((p) => p.draw(ctx!));
    asteroids.forEach((a) => a.draw(ctx!, palette));
    powerUps.forEach((p) => p.draw(ctx!, palette));
    bullets.forEach((b) => b.draw(ctx!, palette));
    ship.draw(ctx!, palette);
    if (ship.tripleShot > 0) {
      ctx!.save();
      ctx!.fillStyle = palette.green;
      ctx!.shadowColor = palette.green;
      ctx!.shadowBlur = 8;
      ctx!.font = "15px monospace";
      ctx!.textAlign = "left";
      ctx!.textBaseline = "alphabetic";
      ctx!.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 26);
      ctx!.restore();
    }
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
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.destroy();
    },
  };
}
