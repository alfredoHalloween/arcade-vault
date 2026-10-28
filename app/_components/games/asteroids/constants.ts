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
