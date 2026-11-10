import type { SkinId } from "../skins";
// Coordenadas lógicas del juego; el canvas se escala a estas dimensiones.
export const W = 800;
export const H = 600;
/** Tope de dt (s) para evitar saltos tras bloqueos del hilo. */
export const MAX_DT = 0.05;
export const INITIAL_LIVES = 3;
export const INITIAL_ASTEROIDS = 4;
export const ASTEROID_SAFE_DIST = 130;
export const RESPAWN_DELAY = 2;
// Asteroides, indexados por tamaño 1 (pequeño), 2 (mediano), 3 (grande).
export const RADII = [0, 16, 30, 50];
export const SPEEDS = [0, 85, 55, 32];
export const POINTS = [0, 100, 50, 20];
export const BULLET_SPEED = 520;
export const BULLET_TTL = 1.1;
export const BULLET_RADIUS = 2;
export const SHIP_RADIUS = 12;
export const SHIP_ROT = 3.5; // rad/s
export const SHIP_THRUST = 260; // px/s²
export const SHIP_DRAG = 0.987;
export const SHIP_NOSE = 21;
export const SHIP_INVINCIBLE = 3;
export const SHOOT_COOLDOWN = 0.2;
/** Factor de holgura en la colisión nave-asteroide. */
export const SHIP_HIT_FACTOR = 0.82;
export const POWERUP_RADIUS = 12;
export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_GUARANTEED_KILLS = 5;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const TRIPLE_SPREAD = 0.18;

// ===== Skins (solo render; ninguna constante de jugabilidad depende de ellas) =====

/** Color de skin: token CSS opcional (leído con `getComputedStyle`) y hex de respaldo. */
export type SkinColor = { token?: `--${string}`; hex: string };

/** Paleta y estilo de dibujo de una skin. */
export type Palette = {
  /** `vector`: trazos a resolución completa. `pixel`: se dibuja a 1/`PIXEL_SIZE` y se reescala sin suavizado. */
  mode: "vector" | "pixel";
  bg: SkinColor;
  /** Rejilla de fondo (null = sin rejilla). */
  grid: SkinColor | null;
  ship: SkinColor;
  thrust: SkinColor;
  bullet: SkinColor;
  asteroid: SkinColor;
  powerUp: SkinColor;
  hud: SkinColor;
  /** Partículas al destruir la nave y los asteroides. */
  shipDebris: SkinColor;
  rockDebris: SkinColor;
  /** Núcleo claro sobre los trazos con glow (null = sin núcleo). */
  core: SkinColor | null;
  glow: {
    ship: number;
    bullet: number;
    asteroid: number;
    powerUp: number;
    hud: number;
  };
  lineWidth: { ship: number; asteroid: number; powerUp: number };
};

const CYAN: SkinColor = { token: "--cyan", hex: "#00f5ff" };
const MAGENTA: SkinColor = { token: "--magenta", hex: "#ff006e" };
const YELLOW: SkinColor = { token: "--yellow", hex: "#f5ff00" };
const GREEN: SkinColor = { token: "--green", hex: "#00ff88" };

// Fósforo verde de 4 tonos fijos para RETRO.
const PHOSPHOR_BG: SkinColor = { hex: "#071a0c" };
const PHOSPHOR_DIM: SkinColor = { hex: "#1e6b34" };
const PHOSPHOR_MID: SkinColor = { hex: "#4fc96a" };
const PHOSPHOR_HI: SkinColor = { hex: "#b6ffb0" };

/** Lado (px lógicos) de cada píxel en las skins `pixel`. */
export const PIXEL_SIZE = 3;

export const PALETTES: Record<SkinId, Palette> = {
  // Render original exacto: tokens del tema sobre negro.
  clasico: {
    mode: "vector",
    bg: { hex: "#000" },
    grid: null,
    ship: CYAN,
    thrust: YELLOW,
    bullet: YELLOW,
    asteroid: MAGENTA,
    powerUp: GREEN,
    hud: GREEN,
    shipDebris: CYAN,
    rockDebris: MAGENTA,
    core: null,
    glow: { ship: 12, bullet: 8, asteroid: 10, powerUp: 10, hud: 8 },
    lineWidth: { ship: 1.5, asteroid: 1.5, powerUp: 2 },
  },
  // Vector brillante: glow intenso, trazo fino con núcleo blanco y rejilla tenue.
  neon: {
    mode: "vector",
    bg: { token: "--bg", hex: "#0a0a0f" },
    grid: MAGENTA,
    ship: MAGENTA,
    thrust: YELLOW,
    bullet: GREEN,
    asteroid: CYAN,
    powerUp: YELLOW,
    hud: YELLOW,
    shipDebris: MAGENTA,
    rockDebris: CYAN,
    core: { hex: "#ffffff" },
    glow: { ship: 22, bullet: 14, asteroid: 18, powerUp: 18, hud: 14 },
    lineWidth: { ship: 1, asteroid: 1, powerUp: 1.25 },
  },
  // Pixel/CRT: 4 tonos de fósforo, sin glow, formas cuadradas.
  retro: {
    mode: "pixel",
    bg: PHOSPHOR_BG,
    grid: null,
    ship: PHOSPHOR_HI,
    thrust: PHOSPHOR_MID,
    bullet: PHOSPHOR_HI,
    asteroid: PHOSPHOR_MID,
    powerUp: PHOSPHOR_HI,
    hud: PHOSPHOR_HI,
    shipDebris: PHOSPHOR_HI,
    rockDebris: PHOSPHOR_DIM,
    core: null,
    glow: { ship: 0, bullet: 0, asteroid: 0, powerUp: 0, hud: 0 },
    lineWidth: { ship: PIXEL_SIZE, asteroid: PIXEL_SIZE, powerUp: PIXEL_SIZE },
  },
};
