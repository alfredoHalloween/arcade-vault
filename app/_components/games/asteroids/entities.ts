import {
  BULLET_RADIUS,
  BULLET_SPEED,
  BULLET_TTL,
  H,
  POWERUP_RADIUS,
  POWERUP_TTL,
  RADII,
  SHIP_DRAG,
  SHIP_INVINCIBLE,
  SHIP_NOSE,
  SHIP_RADIUS,
  SHIP_ROT,
  SHIP_THRUST,
  SHOOT_COOLDOWN,
  SPEEDS,
  TRIPLE_SPREAD,
  W,
} from "./constants";
import { rand, randInt, wrap } from "./utils";
/** Colores resueltos de los tokens del tema (`--cyan`, `--magenta`, …). */
export type Palette = {
  cyan: string;
  magenta: string;
  yellow: string;
  green: string;
};
export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = BULLET_TTL;
  radius = BULLET_RADIUS;
  dead = false;
  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
  }
  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw(ctx: CanvasRenderingContext2D, palette: Palette) {
    ctx.save();
    ctx.fillStyle = palette.yellow;
    ctx.shadowColor = palette.yellow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
export class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: [number, number][] = [];
  dead = false;
  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);
    // Polígono irregular
    const n = randInt(8, 13);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }
  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }
  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }
  draw(ctx: CanvasRenderingContext2D, palette: Palette) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = palette.magenta;
    ctx.shadowColor = palette.magenta;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++) {
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
/** Partícula de explosión; toma el color de lo que se destruyó. */
export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  color: string;
  dead = false;
  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
  }
  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  // Sin glow por partícula: el coste de shadowBlur se evita aquí a propósito.
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(this.ttl / this.life, 0);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.restore();
  }
}

/** Power-up "3x": disparo triple al recogerlo. */
export class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = POWERUP_RADIUS;
  ttl = POWERUP_TTL;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, palette: Palette) {
    // Parpadea durante los últimos 2 s de vida
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.shadowColor = palette.green;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = palette.green;
    ctx.fillStyle = palette.green;
    ctx.lineWidth = 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();

    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
    ctx.restore();
  }
}

export class Ship {
  x = W / 2;
  y = H / 2;
  angle = -Math.PI / 2;
  vx = 0;
  vy = 0;
  radius = SHIP_RADIUS;
  thrusting = false;
  invincible = SHIP_INVINCIBLE;
  shootCooldown = 0;
  /** Segundos restantes de disparo triple; sobrevive a `reset()`. */
  tripleShot = 0;
  dead = false;

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.thrusting = false;
    this.invincible = SHIP_INVINCIBLE;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, keys: Record<string, boolean>) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;

    if (keys["ArrowLeft"]) this.angle -= SHIP_ROT * dt;
    if (keys["ArrowRight"]) this.angle += SHIP_ROT * dt;

    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * SHIP_THRUST * dt;
      this.vy += Math.sin(this.angle) * SHIP_THRUST * dt;
    }

    this.vx *= SHIP_DRAG;
    this.vy *= SHIP_DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = SHOOT_COOLDOWN;
    const ox = this.x + Math.cos(this.angle) * SHIP_NOSE;
    const oy = this.y + Math.sin(this.angle) * SHIP_NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(ctx: CanvasRenderingContext2D, palette: Palette) {
    if (this.dead) return;
    // Parpadeo durante la invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = palette.cyan;
    ctx.shadowColor = palette.cyan;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = palette.yellow;
      ctx.shadowColor = palette.yellow;
      ctx.stroke();
    }

    ctx.restore();
  }
}
